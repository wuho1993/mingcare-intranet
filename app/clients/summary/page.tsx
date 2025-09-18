'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomerListItem } from '@/types/customer';

export default function ClientSummaryPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerListItem[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">客戶總覽</h1>
          <p className="text-gray-600">管理所有客戶資料</p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜尋客戶姓名、電話或客戶編號..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => window.location.href = '/clients/new'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
            >
              新增客戶
            </button>
          </div>
        </div>

        {/* Customer Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            共 {filteredCustomers.length} 位客戶
          </p>
        </div>

        {/* Customer Cards - Mobile First Design */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <div key={customer.customer_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{customer.customer_name}</h3>
                  <p className="text-sm text-gray-500">ID: {customer.customer_id}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  活躍
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm w-16">電話:</span>
                  <span className="text-gray-900 text-sm font-medium">{customer.phone}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-600 text-sm w-16 flex-shrink-0">地區:</span>
                  <span className="text-gray-900 text-sm">{customer.district}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm w-16">項目:</span>
                  <span className="text-gray-900 text-sm">{customer.project_manager}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => window.location.href = `/clients/edit-client/edit?id=${customer.customer_id}`}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium"
                >
                  編輯
                </button>
                <button
                  onClick={() => window.location.href = `/clients/detail?id=${customer.customer_id}`}
                  className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 font-medium"
                >
                  詳情
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '找不到符合條件的客戶' : '尚未有客戶資料'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? '請嘗試其他搜尋條件' : '開始新增您的第一位客戶'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => window.location.href = '/clients/new'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                新增客戶
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}