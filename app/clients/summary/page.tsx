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
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center fade-in-apple">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 fade-in-apple">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">客戶總覽</h1>
          <p className="text-text-secondary">管理所有客戶資料</p>
        </div>

        {/* Search and Controls */}
        <div className="card-apple mb-6 fade-in-apple" style={{ animationDelay: '0.1s' }}>
          <div className="card-apple-content">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜尋客戶姓名、電話或客戶編號..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input-apple w-full"
                />
              </div>
              <button
                onClick={() => window.location.href = '/clients/new'}
                className="btn-apple-primary whitespace-nowrap"
              >
                <span className="mr-2">➕</span>
                新增客戶
              </button>
            </div>
          </div>
        </div>

        {/* Customer Count */}
        <div className="mb-4 fade-in-apple" style={{ animationDelay: '0.15s' }}>
          <p className="text-sm text-text-secondary">
            共 <span className="font-semibold text-primary">{filteredCustomers.length}</span> 位客戶
          </p>
        </div>

        {/* Customer Cards - Mobile First Design */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer, index) => (
            <div 
              key={customer.customer_id} 
              className="card-apple card-hover-float fade-in-apple"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              <div className="card-apple-content">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary text-lg">{customer.customer_name}</h3>
                    <p className="text-sm text-text-tertiary">ID: {customer.customer_id}</p>
                  </div>
                  <span className="badge-chip badge-chip-success">
                    活躍
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center">
                    <span className="text-text-secondary text-sm w-16">📞 電話:</span>
                    <span className="text-text-primary text-sm font-medium">{customer.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-text-secondary text-sm w-16 flex-shrink-0">📍 地區:</span>
                    <span className="text-text-primary text-sm">{customer.district}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-text-secondary text-sm w-16">👤 項目:</span>
                    <span className="text-text-primary text-sm">{customer.project_manager}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border-light">
                  <button
                    onClick={() => window.location.href = `/clients/edit-client/edit?id=${customer.customer_id}`}
                    className="btn-apple-primary flex-1 text-sm py-2"
                  >
                    ✏️ 編輯
                  </button>
                  <button
                    onClick={() => window.location.href = `/clients/detail?id=${customer.customer_id}`}
                    className="btn-apple-secondary flex-1 text-sm py-2"
                  >
                    📋 詳情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && !loading && (
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content text-center py-12">
              <div className="text-text-tertiary mb-4">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {searchTerm ? '找不到符合條件的客戶' : '尚未有客戶資料'}
              </h3>
              <p className="text-text-secondary mb-6">
                {searchTerm ? '請嘗試其他搜尋條件' : '開始新增您的第一位客戶'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => window.location.href = '/clients/new'}
                  className="btn-apple-primary"
                >
                  <span className="mr-2">➕</span>
                  新增客戶
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
