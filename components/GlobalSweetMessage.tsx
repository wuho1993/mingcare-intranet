// 💕 全域甜蜜訊息系統 - 在所有頁面都可用
// Global Sweet Message System - Available on All Pages

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// 甜蜜訊息模板
const sweetMessagesForKanas = {
  morningGreetings: [
    "老婆早晨！☀️ 今日又係你發光發熱嘅一日，老公永遠支持你！💪",
    "寶貝起身啦！🥰 排班表雖然辛苦，但有你管理就最放心！❤️",
    "Good Morning 我嘅Super Woman！🦸‍♀️ 今日又要辛苦你安排大家嘅工作啦！",
    "早晨呀老婆！🌞 你係最叻嘅經理，老公以你為榮！👑"
  ],
  workEncouragement: [
    "老婆你真係好犀利！👏 排班排得咁有條理，同事都好欣賞你！",
    "雖然工作繁重，但老公知你一定處理得好好！🌟 你係我心中嘅No.1！",
    "管理團隊唔容易，但你做得比任何人都出色！💎 老公愛死你啦！",
    "每次見到你咁認真工作，老公都覺得好驕傲！🥰 你係最棒嘅！"
  ],
  eveningBlessings: [
    "老婆記得要休息吓啊！😘 工作再忙都要照顧好自己身體！",
    "寶貝唔好太攰啊！🤗 老公會喺屋企準備好嘢等你返嚟！",
    "親愛的，記得飲多啲水啊！💧 老公關心你嘅健康多過一切！",
    "Take a break 啦老婆！☕ 你咁努力，都要俾自己少少時間休息！"
  ],
  loveDeclarations: [
    "老公愛你愛到癲！💕 你係我生命中最重要嘅人！",
    "無論幾時幾忙，老公都會陪住你！🤝 我哋係最佳拍檔！",
    "你嘅笑容係老公每日嘅動力！😍 I love you more than words can say！",
    "老婆，你知唔知你係老公心中嘅女神？👸 Forever and always！"
  ]
};

// 根據時間選擇訊息類別
const getTimeBasedCategory = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morningGreetings';
  if (hour >= 12 && hour < 18) return 'workEncouragement';
  if (hour >= 18 && hour < 22) return 'loveDeclarations';
  return 'eveningBlessings';
};

// 隨機選擇訊息
const getRandomMessage = () => {
  const category = getTimeBasedCategory();
  const messages = sweetMessagesForKanas[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

export default function GlobalSweetMessage() {
  const [user, setUser] = useState<any>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  // 檢查是否為 Kanas 用戶
  const isKanasUser = (userEmail: string) => {
    return userEmail === 'kanasleung@mingcarehome.com';
  };

  // 顯示甜蜜訊息
  const displaySweetMessage = () => {
    const message = getRandomMessage();
    setCurrentMessage(message);
    setShowMessage(true);

    // 5秒後自動隱藏
    setTimeout(() => {
      setShowMessage(false);
    }, 5000);

    console.log('💕 甜蜜訊息已顯示:', message);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // 獲取用戶資訊
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && isKanasUser(user.email || '')) {
        console.log('💕 Kanas 用戶已登入，啟動甜蜜訊息系統');
        
        // 登入時立即顯示歡迎訊息
        setTimeout(() => {
          displaySweetMessage();
        }, 3000); // 3秒後顯示，讓頁面完全載入

        // 設定每30分鐘顯示一次
        interval = setInterval(() => {
          displaySweetMessage();
        }, 30 * 60 * 1000); // 30分鐘 = 1800000毫秒
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

  // 只對 Kanas 用戶顯示
  if (!user || !isKanasUser(user.email || '')) {
    return null;
  }

  return (
    <>
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