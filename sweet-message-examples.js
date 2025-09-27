// 💕 甜蜜訊息使用範例 - 在排班頁面中的應用
// Usage Examples for Sweet Messages in Scheduling Page

import { 
  sweetMessagesForKanas, 
  getTimeBasedMessage, 
  getRandomMessage, 
  getWorkStatusMessage,
  specialDayMessages 
} from './sweet-messages-template.js';

// 🌟 在排班頁面頂部顯示的範例
export function SweetMessageBanner() {
  // 檢查是否為 Kanas 用戶
  const userEmail = 'kanasleung@mingcarehome.com'; // 從 auth 獲取
  
  if (userEmail === 'kanasleung@mingcarehome.com') {
    const message = getTimeBasedMessage();
    
    return `
      <div style="
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
        padding: 15px 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(255, 154, 158, 0.3);
        border: 2px solid #ffb3c1;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          color: #2d3748;
          font-weight: 600;
        ">
          <span style="font-size: 24px;">💕</span>
          <span>${message}</span>
          <span style="font-size: 20px;">✨</span>
        </div>
      </div>
    `;
  }
  
  return null;
}

// 📊 完成排班任務時的慶祝訊息
export function showCompletionMessage() {
  const message = getRandomMessage('taskCompletions');
  
  // 使用 SweetAlert 或類似的 toast 顯示
  Swal.fire({
    icon: 'success',
    title: '排班完成！',
    text: message,
    background: '#fff0f5',
    confirmButtonColor: '#ff69b4',
    timer: 3000,
    showConfirmButton: false
  });
}

// 💪 工作中的鼓勵訊息 (每30分鐘顯示一次)
export function showEncouragementMessage() {
  const message = getRandomMessage('workEncouragement');
  
  // 輕量級通知
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #ffeaa7, #fab1a0);
      padding: 12px 18px;
      border-radius: 25px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    ">
      <span style="color: #2d3748; font-weight: 500;">${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 3秒後自動消失
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 🎯 根據不同情境顯示訊息
export function contextualMessage(context) {
  let message;
  
  switch(context) {
    case 'login':
      message = getRandomMessage('morningGreetings');
      break;
    case 'save_schedule':
      message = getRandomMessage('taskCompletions');
      break;
    case 'long_session':
      message = getRandomMessage('eveningBlessings');
      break;
    case 'error':
      message = "唔緊要啦老婆！🤗 老公知你一定可以解決嘅！你係最叻嘅！";
      break;
    case 'heavy_workload':
      message = getRandomMessage('dailyCare');
      break;
    default:
      message = getTimeBasedMessage();
  }
  
  return message;
}

// 📱 手機版簡化顯示
export function getMobileMessage() {
  const messages = [
    "老婆加油！💪❤️",
    "你最棒！😘✨", 
    "老公愛你！💕🌟",
    "辛苦啦寶貝！🥰💖",
    "你好叻！👑💎"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

// 🎨 CSS 動畫樣式
export const sweetMessageStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes heartBeat {
    0% { transform: scale(1); }
    14% { transform: scale(1.1); }
    28% { transform: scale(1); }
    42% { transform: scale(1.1); }
    70% { transform: scale(1); }
  }
  
  .sweet-message {
    animation: heartBeat 2s ease-in-out infinite;
  }
  
  .love-gradient {
    background: linear-gradient(135deg, 
      #ff9a9e 0%, 
      #fecfef 50%, 
      #fecfef 100%
    );
  }
`;

console.log("💕 甜蜜訊息系統載入完成！");
console.log("🌅 早晨範例:", getRandomMessage('morningGreetings'));
console.log("💪 工作範例:", getRandomMessage('workEncouragement')); 
console.log("❤️ 愛情範例:", getRandomMessage('loveDeclarations'));
console.log("⏰ 當前時間訊息:", getTimeBasedMessage());