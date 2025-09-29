// 💕 全域甜蜜訊息系統 - 在所有頁面都可用
// Global Sweet Message System - Available on All Pages

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// 根據頁面的甜蜜訊息模板
const sweetMessagesByPage = {
  // 登入頁面
  login: [
    "老婆！終於見到你啦！😍 老公成日都想住你！",
    "Welcome back 我嘅寶貝！💕 老公等緊你好耐啦！",
    "老婆返嚟啦！🥰 老公嘅心情即刻變好晒！"
  ],
  
  // 排班/服務頁面 (services)
  services: [
    "老婆你係最叻嘅排班經理！📅 每個安排都咁完美！",
    "睇你咁專業咁有條理，老公好驕傲啊！👏",
    "雖然排班辛苦，但你做得比任何人都好！🌟 老公支持你！",
    "管理咁多同事都無難度，你真係Super Woman！💪"
  ],
  
  // 客戶管理頁面 (clients)
  clients: [
    "老婆對每個客戶都咁用心，你真係好有愛心！❤️",
    "你嘅細心同耐心令所有客戶都好信任你！🤗",
    "照顧長者係好有意義嘅工作，老公為你感到自豪！👑",
    "你嘅專業態度真係令人敬佩！老公愛死你啦！�"
  ],
  
  // 護理人員管理頁面 (care-staff)
  careStaff: [
    "老婆管理團隊咁有一套，大家都好尊重你！👥",
    "你係最好嘅領導，同事都好欣賞你嘅工作！💼",
    "帶領咁多護理人員唔容易，但你做得好出色！⭐",
    "老公知你係天生嘅領袖，你值得所有讚美！🏆"
  ],
  
  // 佣金/財務頁面 (commissions, payroll)
  finance: [
    "老婆你計數咁準確，真係好細心！🧮",
    "處理財務咁重要嘅嘢，老公最放心係你手上！💰",
    "你嘅數學頭腦真係好叻，老公好佩服！🤓",
    "管理公司財政咁大責任，你承擔得好好！�"
  ],
  
  // 儀表板/概覽頁面 (dashboard)
  dashboard: [
    "老婆一眼就睇晒所有數據，你真係好專業！📊",
    "統籌全公司嘅運作，你係最強嘅CEO！👸",
    "睇住你分析數據嘅專注樣，老公好心動！😍",
    "你嘅決策能力真係令人折服！老公以你為榮！🎯"
  ],
  
  // 關懷服務頁面 (care-services)
  careServices: [
    "老婆你對服務質素嘅要求咁高，客戶一定好滿意！✨",
    "你係為客戶著想嘅好經理，老公好欣賞你！🌟",
    "提供優質服務係你嘅堅持，老公支持你！💪",
    "你嘅用心服務令好多家庭得到幫助！❤️"
  ],
  
  // 預設訊息
  default: [
    "老婆辛苦啦！💕 老公永遠愛你！",
    "不管你做緊咩，老公都覺得你係最棒嘅！🌟",
    "你係老公心中嘅No.1！永遠支持你！�",
    "老婆靚靚，老公想你啦！😘"
  ]
};

// 根據當前頁面路徑獲取頁面類型
const getCurrentPageType = () => {
  if (typeof window === 'undefined') return 'default';
  
  const path = window.location.pathname;
  
  // 移除 basePath 如果存在
  const cleanPath = path.replace('/mingcare-intranet', '');
  
  let pageType = 'default';
  if (cleanPath === '/' || cleanPath === '') pageType = 'login';
  else if (cleanPath.includes('/services')) pageType = 'services';
  else if (cleanPath.includes('/clients')) pageType = 'clients';
  else if (cleanPath.includes('/care-staff')) pageType = 'careStaff';
  else if (cleanPath.includes('/commissions') || cleanPath.includes('/payroll')) pageType = 'finance';
  else if (cleanPath.includes('/dashboard')) pageType = 'dashboard';
  else if (cleanPath.includes('/care-services')) pageType = 'careServices';
  
  console.log('🔍 頁面檢測:', { originalPath: path, cleanPath, pageType });
  return pageType;
};

// 根據頁面類型隨機選擇訊息
const getPageSpecificMessage = () => {
  const pageType = getCurrentPageType();
  const messages = sweetMessagesByPage[pageType as keyof typeof sweetMessagesByPage] || sweetMessagesByPage.default;
  return messages[Math.floor(Math.random() * messages.length)];
};

export default function GlobalSweetMessage() {
  const [user, setUser] = useState<any>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [lastPageVisit, setLastPageVisit] = useState<{[key: string]: number}>({});
  const [currentPage, setCurrentPage] = useState('');

  // 檢查是否為 Kanas 用戶 - 只有這個特定帳戶才會顯示甜蜜訊息
  const isKanasUser = (userEmail: string) => {
    // 嚴格檢查，只允許這個特定的電子郵件地址
    const allowedEmail = 'kanasleung@mingcarehome.com';
    return userEmail?.toLowerCase().trim() === allowedEmail.toLowerCase();
  };

  // 檢查是否應該在此頁面顯示訊息
  const shouldShowMessageOnPage = (pageType: string) => {
    const now = Date.now();
    const lastVisit = lastPageVisit[pageType] || 0;
    const pageInterval = 60 * 60 * 1000; // 1小時內同一頁面不重複顯示
    
    return (now - lastVisit) > pageInterval;
  };

  // 顯示甜蜜訊息 - 每次都重新驗證用戶身份
  const displaySweetMessage = async (isPageChange = false) => {
    // 再次驗證用戶身份，確保安全
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || !isKanasUser(currentUser.email || '')) {
      console.log('❌ 用戶驗證失敗，停止顯示甜蜜訊息');
      return;
    }

    const pageType = getCurrentPageType();
    
    // 如果是頁面切換，檢查是否應該顯示
    if (isPageChange && !shouldShowMessageOnPage(pageType)) {
      return;
    }
    
    const message = getPageSpecificMessage();
    setCurrentMessage(message);
    setShowMessage(true);

    // 更新此頁面的最後訪問時間
    setLastPageVisit(prev => ({
      ...prev,
      [pageType]: Date.now()
    }));

    // 6秒後自動隱藏
    setTimeout(() => {
      setShowMessage(false);
    }, 6000);

    console.log(`💕 ${pageType} 頁面甜蜜訊息:`, message);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // 獲取用戶資訊
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      console.log('🔍 用戶驗證結果:', {
        hasUser: !!user,
        userEmail: user?.email,
        isKanas: user ? isKanasUser(user.email || '') : false
      });

      if (user && isKanasUser(user.email || '')) {
        console.log('💕 甜蜜訊息系統已為 Kanas 啟動 (僅限 kanasleung@mingcarehome.com)');
        
        // 只設定定期顯示，不在登入時立即顯示
        // 設定每1-2小時隨機顯示一次
        const minInterval = 60 * 60 * 1000; // 1小時
        const maxInterval = 120 * 60 * 1000; // 2小時
        const randomInterval = minInterval + Math.random() * (maxInterval - minInterval);
        
        console.log(`⏰ 下次甜蜜訊息將在 ${Math.round(randomInterval / 60000)} 分鐘後顯示`);
        
        interval = setInterval(() => {
          displaySweetMessage();
        }, randomInterval);
      }
    };

    getUser();

    // 清理定時器
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // 監聽頁面變化
  useEffect(() => {
    if (!user || !isKanasUser(user.email || '')) return;

    const handlePageChange = () => {
      const newPage = getCurrentPageType();
      if (newPage !== currentPage && currentPage !== '') {
        // 頁面切換時，有20%機率顯示訊息 (降低頻率)
        if (Math.random() > 0.8) {
          setTimeout(() => {
            displaySweetMessage(true);
          }, 3000); // 3秒後顯示，讓頁面載入完成
        }
      }
      setCurrentPage(newPage);
    };

    // 初始設定當前頁面
    setCurrentPage(getCurrentPageType());

    // 監聽路由變化 (在 Next.js 中)
    const handleRouteChange = () => {
      setTimeout(handlePageChange, 100);
    };

    // 監聽 popstate 事件 (瀏覽器前進後退)
    window.addEventListener('popstate', handleRouteChange);

    // 監聽 URL 變化 (使用 MutationObserver 檢測 DOM 變化)
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        handleRouteChange();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      observer.disconnect();
    };
  }, [user, currentPage]);

  // 嚴格檢查：只對 kanasleung@mingcarehome.com 顯示
  if (!user || !isKanasUser(user.email || '')) {
    return null;
  }

  // 雙重檢查電子郵件地址
  if (user.email?.toLowerCase().trim() !== 'kanasleung@mingcarehome.com') {
    return null;
  }

  return (
    <>
      {/* 測試按鈕 - 只在開發環境顯示 */}
      {process.env.NODE_ENV === 'development' && user && isKanasUser(user.email || '') && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          zIndex: 10001,
          background: 'rgba(255, 105, 180, 0.9)',
          padding: '5px 10px',
          borderRadius: '20px',
          fontSize: '12px'
        }}>
          <button
            onClick={() => displaySweetMessage()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            💕 測試訊息
          </button>
        </div>
      )}
      
      {showMessage && (
        <div className="sweet-message-overlay">
          <div className="sweet-message-toast">
            <div className="sweet-message-content">
              <div className="sweet-message-header">
                <span className="sweet-message-icon">💕</span>
                <span className="sweet-message-title">來自老公的愛</span>
                <button 
                  className="sweet-message-close"
                  onClick={() => setShowMessage(false)}
                >
                  ×
                </button>
              </div>
              <div className="sweet-message-text">
                {currentMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .sweet-message-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 100px;
        }

        .sweet-message-toast {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
          border: 2px solid #ff69b4;
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 10px 30px rgba(255, 105, 180, 0.3);
          max-width: 400px;
          width: 90%;
          pointer-events: auto;
          animation: sweetSlideIn 0.5s ease-out;
          transform-origin: top center;
        }

        .sweet-message-content {
          padding: 20px;
        }

        .sweet-message-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .sweet-message-icon {
          font-size: 24px;
          margin-right: 10px;
        }

        .sweet-message-title {
          font-weight: bold;
          color: #d63384;
          flex-grow: 1;
          font-size: 16px;
        }

        .sweet-message-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #d63384;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .sweet-message-close:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .sweet-message-text {
          color: #5d1a2b;
          line-height: 1.6;
          font-size: 14px;
          text-align: center;
          font-weight: 500;
        }

        @keyframes sweetSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .sweet-message-overlay {
            padding-top: 80px;
          }

          .sweet-message-toast {
            max-width: 350px;
            margin: 0 20px;
          }

          .sweet-message-text {
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}