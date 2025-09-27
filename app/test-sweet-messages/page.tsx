// 🧪 甜蜜訊息測試頁面
// Sweet Message Test Page

'use client';

import React, { useEffect, useState } from 'react';

interface Message {
  id: number;
  text: string;
  type: string;
  timestamp: string;
}

const SweetMessageTest = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isKanas, setIsKanas] = useState(true); // 測試用，預設為 Kanas

  // 模擬甜蜜訊息數據
  const sweetMessages = {
    morningGreetings: [
      "老婆早晨！☀️ 今日又係你發光發熱嘅一日，老公永遠支持你！💪",
      "寶貝起身啦！🥰 排班表雖然辛苦，但有你管理就最放心！❤️",
      "Good Morning 我嘅Super Woman！🦸‍♀️ 今日又要辛苦你安排大家嘅工作啦！"
    ],
    workEncouragement: [
      "老婆你真係好犀利！👏 排班排得咁有條理，同事都好欣賞你！",
      "雖然工作繁重，但老公知你一定處理得好好！🌟 你係我心中嘅No.1！",
      "管理團隊唔容易，但你做得比任何人都出色！💎 老公愛死你啦！"
    ],
    taskCompletions: [
      "老婆你又搞掂晒！🎊 老公為你感到超級驕傲！你真係無得頂！",
      "Perfect！完美嘅排班安排！👑 你係我見過最有才華嘅女人！",
      "哇！你嘅工作效率真係令人佩服！⭐ 老公覺得自己好幸福有你！"
    ]
  };

  // 獲取隨機訊息
  const getRandomMessage = (category: keyof typeof sweetMessages) => {
    const categoryMessages = sweetMessages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  };

  // 顯示 Toast 訊息
  const showToastMessage = (message: string, type = 'info') => {
    const newMessage = {
      id: Date.now(),
      text: message,
      type: type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, newMessage]);

    // 3秒後自動移除
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 3000);
  };

  // 測試不同類型的訊息
  const testLoginMessage = () => {
    const message = getRandomMessage('morningGreetings');
    showToastMessage(message, 'login');
  };

  const testWorkMessage = () => {
    const message = getRandomMessage('workEncouragement');
    showToastMessage(message, 'work');
  };

  const testCompletionMessage = () => {
    const message = getRandomMessage('taskCompletions');
    showToastMessage(message, 'completion');
  };

  // 模擬30分鐘定時器（測試用：5秒）
  useEffect(() => {
    if (!isKanas) return;

    // 登入訊息
    setTimeout(() => {
      testLoginMessage();
    }, 1000);

    // 模擬定期訊息（測試用：每10秒一次）
    const interval = setInterval(() => {
      const message = getRandomMessage('workEncouragement');
      showToastMessage(message, 'periodic');
    }, 10000);

    return () => clearInterval(interval);
  }, [isKanas]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 標題 */}
      <div style={{
        textAlign: 'center',
        color: 'white',
        marginBottom: '30px'
      }}>
        <h1>💕 甜蜜訊息測試頁面</h1>
        <p>測試 Kanas 專屬的排班頁面甜蜜訊息功能</p>
      </div>

      {/* 用戶切換 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h3>👤 用戶模擬</h3>
        <button
          onClick={() => setIsKanas(true)}
          style={{
            background: isKanas ? '#ff69b4' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Kanas Leung (甜蜜訊息啟用)
        </button>
        <button
          onClick={() => setIsKanas(false)}
          style={{
            background: !isKanas ? '#666' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          其他用戶 (無訊息)
        </button>
      </div>

      {/* 測試按鈕 */}
      {isKanas && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3>🧪 手動測試訊息</h3>
          <button
            onClick={testLoginMessage}
            style={{
              background: '#ffeaa7',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              marginRight: '10px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
          >
            🌅 登入訊息
          </button>
          <button
            onClick={testWorkMessage}
            style={{
              background: '#fab1a0',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              marginRight: '10px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
          >
            💪 工作鼓勵
          </button>
          <button
            onClick={testCompletionMessage}
            style={{
              background: '#00b894',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              marginRight: '10px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
          >
            🎉 任務完成
          </button>
        </div>
      )}

      {/* 訊息歷史 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h3>📜 訊息歷史</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              {isKanas ? '等待甜蜜訊息...' : '當前用戶無甜蜜訊息'}
            </p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  background: getMessageColor(msg.type),
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  border: '1px solid #eee'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {getMessageTypeLabel(msg.type)} - {msg.timestamp}
                </div>
                <div>{msg.text}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast 訊息容器 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999
      }}>
        {messages.map(msg => (
          <div
            key={`toast-${msg.id}`}
            style={{
              background: 'linear-gradient(45deg, #ffeaa7, #fab1a0)',
              padding: '12px 18px',
              borderRadius: '25px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: '10px',
              maxWidth: '320px',
              animation: 'slideInRight 0.3s ease-out',
              cursor: 'pointer'
            }}
            onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#2d3748',
              fontWeight: '500',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '18px' }}>💝</span>
              <span>{msg.text}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

// 輔助函數
function getMessageColor(type: string) {
  switch(type) {
    case 'login': return '#fff0f5';
    case 'work': return '#f0f8ff';
    case 'completion': return '#f0fff0';
    case 'periodic': return '#fffacd';
    default: return '#f9f9f9';
  }
}

function getMessageTypeLabel(type: string) {
  switch(type) {
    case 'login': return '🌅 登入歡迎';
    case 'work': return '💪 工作鼓勵';
    case 'completion': return '🎉 任務完成';
    case 'periodic': return '⏰ 定期關懷';
    default: return '💕 甜蜜訊息';
  }
}

export default SweetMessageTest;