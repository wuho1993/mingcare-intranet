// 💕 甜蜜訊息控制系統 - 優化顯示頻率
// Sweet Message Controller with Optimized Display Frequency

import { 
  sweetMessagesForKanas, 
  getTimeBasedMessage, 
  getRandomMessage, 
  getWorkStatusMessage 
} from './sweet-messages-template.js';

// 🕒 訊息顯示控制器
class SweetMessageController {
  constructor() {
    this.lastMessageTime = 0;
    this.messageInterval = 30 * 60 * 1000; // 30分鐘 = 30 * 60 * 1000 毫秒
    this.sessionStartTime = Date.now();
    this.hasShownLoginMessage = false;
    this.intervalId = null;
  }

  // 檢查是否為 Kanas 用戶
  isKanasUser(userEmail) {
    return userEmail === 'kanasleung@mingcarehome.com';
  }

  // 初始化訊息系統
  init(userEmail) {
    if (!this.isKanasUser(userEmail)) {
      return;
    }

    console.log('💕 甜蜜訊息系統啟動 for Kanas');
    
    // 登入時顯示歡迎訊息
    this.showLoginMessage();
    
    // 設定30分鐘定時器
    this.startPeriodicMessages();
  }

  // 登入時的歡迎訊息
  showLoginMessage() {
    if (this.hasShownLoginMessage) {
      return;
    }

    const message = getTimeBasedMessage();
    this.displayMessage(message, 'login');
    this.hasShownLoginMessage = true;
    this.lastMessageTime = Date.now();
  }

  // 開始定期訊息
  startPeriodicMessages() {
    // 清除之前的定時器（如果有）
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // 每30分鐘執行一次
    this.intervalId = setInterval(() => {
      this.showPeriodicMessage();
    }, this.messageInterval);

    console.log('⏰ 定期甜蜜訊息已設定：每30分鐘一次');
  }

  // 顯示定期訊息
  showPeriodicMessage() {
    const currentTime = Date.now();
    
    // 確保至少間隔30分鐘
    if (currentTime - this.lastMessageTime < this.messageInterval) {
      return;
    }

    const message = this.getContextualMessage();
    this.displayMessage(message, 'periodic');
    this.lastMessageTime = currentTime;
  }

  // 根據情境選擇訊息
  getContextualMessage() {
    const hour = new Date().getHours();
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // 如果工作超過2小時，顯示關懷訊息
    if (sessionDuration > 2 * 60 * 60 * 1000) {
      return getRandomMessage('eveningBlessings');
    }
    
    // 根據時間選擇
    if (hour >= 6 && hour < 12) {
      return getRandomMessage('workEncouragement');
    } else if (hour >= 12 && hour < 18) {
      return getRandomMessage('dailyCare');
    } else {
      return getRandomMessage('loveDeclarations');
    }
  }

  // 顯示訊息的統一方法
  displayMessage(message, type = 'default') {
    // 根據類型選擇不同的顯示樣式
    switch(type) {
      case 'login':
        this.showBannerMessage(message);
        break;
      case 'periodic':
        this.showToastMessage(message);
        break;
      case 'completion':
        this.showCelebrationMessage(message);
        break;
      default:
        this.showToastMessage(message);
    }
  }

  // 橫幅訊息（登入時使用）
  showBannerMessage(message) {
    const banner = document.createElement('div');
    banner.className = 'sweet-message-banner';
    banner.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
        padding: 15px 20px;
        border-radius: 12px;
        margin: 10px;
        box-shadow: 0 4px 15px rgba(255, 154, 158, 0.3);
        border: 2px solid #ffb3c1;
        animation: slideDown 0.5s ease-out;
        position: relative;
      ">
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  style="
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                    padding: 5px;
                  ">×</button>
        </div>
      </div>
    `;

    // 插入到頁面頂部
    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(banner, container.firstChild);

    // 5秒後自動消失
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 5000);
  }

  // Toast 訊息（定期顯示使用）
  showToastMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'sweet-message-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #ffeaa7, #fab1a0);
        padding: 12px 18px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 320px;
        animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 4.7s;
        cursor: pointer;
      " onclick="this.remove()">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          color: #2d3748;
          font-weight: 500;
          font-size: 14px;
        ">
          <span style="font-size: 18px;">💝</span>
          <span>${message}</span>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // 5秒後自動消失
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  // 慶祝訊息（完成任務時使用）
  showCelebrationMessage(message) {
    // 使用 SweetAlert 或自定義模態框
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: '做得好！💕',
        text: message,
        background: '#fff0f5',
        confirmButtonColor: '#ff69b4',
        timer: 3000,
        showConfirmButton: false
      });
    } else {
      // 備用方案：使用自定義彈窗
      this.showToastMessage(message);
    }
  }

  // 手動觸發任務完成訊息
  showTaskCompletion() {
    const message = getRandomMessage('taskCompletions');
    this.displayMessage(message, 'completion');
  }

  // 停止所有定時訊息
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('💕 甜蜜訊息系統已停止');
    }
  }

  // 重置系統
  reset() {
    this.stop();
    this.lastMessageTime = 0;
    this.hasShownLoginMessage = false;
    this.sessionStartTime = Date.now();
  }
}

// 🎨 CSS 動畫樣式
const sweetMessageStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
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
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  .sweet-message-toast:hover {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
`;

// 注入 CSS 樣式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = sweetMessageStyles;
  document.head.appendChild(styleSheet);
}

// 創建全域實例
export const sweetMessageController = new SweetMessageController();

// 使用範例
export const initSweetMessages = (userEmail) => {
  sweetMessageController.init(userEmail);
};

// 手動觸發完成訊息
export const celebrateTaskCompletion = () => {
  sweetMessageController.showTaskCompletion();
};

console.log('💕 甜蜜訊息控制系統載入完成！');
console.log('📋 使用方式：');
console.log('   - 登入時：initSweetMessages(userEmail)');
console.log('   - 完成任務：celebrateTaskCompletion()');
console.log('   - 自動顯示：每30分鐘一次');