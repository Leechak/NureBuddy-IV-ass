// Alert System Manager for NurseBuddy
class AlertSystemManager {
  constructor() {
    this.alerts = [];
    this.observers = new Set();
    this.criticalThresholds = {
      temperature: { min: 35, max: 39 },
      heartRate: { min: 50, max: 120 },
      systolic: { min: 90, max: 180 },
      diastolic: { min: 60, max: 110 },
      oxygen: { min: 95, max: 100 }
    };
    this.activeAlerts = new Map();
    this.snoozeTimers = new Map();
    this.alertHistory = [];
    this.sounds = {
      warning: null,
      critical: null
    };
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadSnoozeData();
      await this.loadAlertHistory();
      this.initSounds();
      this.startMonitoring();
      this.isInitialized = true;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเริ่มต้นระบบแจ้งเตือน:', error);
    }
  }

  async loadSnoozeData() {
    try {
      const snoozeData = JSON.parse(localStorage.getItem('alert_snooze_data') || '{}');
      const now = new Date();

      Object.keys(snoozeData).forEach(key => {
        const data = snoozeData[key];
        const snoozeUntil = new Date(data.snoozeUntil);

        if (snoozeUntil > now) {
          const timeLeft = snoozeUntil - now;
          const timer = setTimeout(() => {
            this.snoozeTimers.delete(key);
            this.saveSnoozeData();
            this.showToast({
              message: `⏰ หมดเวลา Snooze เตียง ${data.bedId} - กลับมาตรวจสอบแล้ว`,
              type: 'warning'
            });
          }, timeLeft);

          this.snoozeTimers.set(key, {
            timer: timer,
            alert: data.alert,
            snoozeUntil: snoozeUntil,
            bedId: data.bedId,
            minutes: data.minutes
          });
        }
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล snooze:', error);
    }
  }

  async loadAlertHistory() {
    try {
      this.alertHistory = JSON.parse(localStorage.getItem('alert_history') || '[]');
      if (this.alertHistory.length > 100) {
        this.alertHistory = this.alertHistory.slice(0, 100);
        localStorage.setItem('alert_history', JSON.stringify(this.alertHistory));
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการโหลดประวัติ:', error);
      this.alertHistory = [];
    }
  }

  saveSnoozeData() {
    const snoozeData = {};
    this.snoozeTimers.forEach((value, key) => {
      snoozeData[key] = {
        bedId: value.bedId,
        minutes: value.minutes,
        snoozeUntil: value.snoozeUntil,
        alert: value.alert
      };
    });
    localStorage.setItem('alert_snooze_data', JSON.stringify(snoozeData));
  }

  saveAlertHistory() {
    localStorage.setItem('alert_history', JSON.stringify(this.alertHistory));
  }

  initSounds() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sounds.warning = () => this.playTone(audioContext, 800, 0.3, 0.2);
      this.sounds.critical = () => this.playTone(audioContext, 1000, 0.5, 0.5);
    } catch (e) {
      console.log('ไม่สามารถสร้างเสียงแจ้งเตือนได้');
    }
  }

  playTone(audioContext, frequency, duration, volume) {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.log('ไม่สามารถเล่นเสียงได้');
    }
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.checkSystemStatus();
    }, 5000);
  }

  checkSystemStatus() {
    if (!this.isInitialized) return;
    // Monitoring logic here
  }

  showToast(config) {
    const {
      message,
      type = 'info',
      duration = 4000,
      position = 'top-right'
    } = config;

    const typeStyles = {
      success: { bg: '#22c55e', icon: '✅' },
      error: { bg: '#ef4444', icon: '❌' },
      warning: { bg: '#f59e0b', icon: '⚠️' },
      info: { bg: '#0ea5e9', icon: 'ℹ️' }
    };

    const style = typeStyles[type] || typeStyles.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${style.bg};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      min-width: 300px;
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
    `;

    toast.innerHTML = `
      <span style="font-size: 18px;">${style.icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }

  createModal(config) {
    const {
      id,
      title,
      content,
      size = 'medium',
      closable = true,
      className = ''
    } = config;

    this.removeModal(id);

    const modal = document.createElement('div');
    modal.id = id;
    modal.className = `modal ${className}`;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const sizeStyles = {
      small: 'max-width: 400px;',
      medium: 'max-width: 600px;',
      large: 'max-width: 800px;',
      xlarge: 'max-width: 1000px;'
    };

    modal.innerHTML = `
      <div class="modal-content" style="
        ${sizeStyles[size]} 
        max-height: 90vh; 
        overflow-y: auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 25px 75px rgba(0,0,0,0.3);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        margin: 20px;
      ">
        ${title ? `
          <div style="padding: 20px 25px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0; color: #1e293b;">${title}</h3>
          </div>
        ` : ''}

        <div style="padding: ${title ? '25px' : '0'};">
          ${content}
        </div>
      </div>
    `;

    if (closable) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(id);
        }
      });
    }

    document.body.appendChild(modal);

    setTimeout(() => {
      modal.style.opacity = '1';
      modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 10);

    return modal;
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.opacity = '0';
      modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  removeModal(id) {
    const existingModal = document.getElementById(id);
    if (existingModal) {
      existingModal.remove();
    }
  }

  getAllAlerts() {
    return {
      active: Array.from(this.activeAlerts.values()),
      snoozed: Array.from(this.snoozeTimers.values()),
      history: this.alertHistory
    };
  }

  getAlertStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayAlerts = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) >= today
    );

    return {
      total: this.alertHistory.length,
      today: todayAlerts.length,
      critical: this.alertHistory.filter(a => a.severity === 'critical').length,
      warning: this.alertHistory.filter(a => a.severity === 'warning').length,
      acknowledged: this.alertHistory.filter(a => a.status === 'acknowledged').length,
      snoozed: this.snoozeTimers.size,
      active: this.activeAlerts.size
    };
  }

  acknowledgeAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    const historyAlert = this.alertHistory.find(h => h.id === alertId);
    if (historyAlert) {
      historyAlert.status = 'acknowledged';
      historyAlert.acknowledgedAt = new Date().toISOString();
      historyAlert.acknowledgedBy = window.currentUser?.fullname || 'ไม่ทราบ';
      this.saveAlertHistory();
    }

    this.activeAlerts.delete(alertId);
    this.closeModal('criticalAlertModal');

    this.showToast({
      message: '✅ รับทราบการแจ้งเตือนแล้ว',
      type: 'success'
    });
  }

  addAlert(bedId, type, message, priority = 'normal') {
    const alert = {
      id: Date.now().toString(),
      bedId: parseInt(bedId),
      type: type,
      message: message,
      priority: priority,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleString('th-TH'),
      acknowledged: false
    };

    this.alerts.unshift(alert);

    if (this.alerts.length > 100) {
      this.alerts.splice(100);
    }

    localStorage.setItem('system_alerts', JSON.stringify(this.alerts));

    return alert;
  }

  getAlerts(bedId = null) {
    if (bedId) {
      return this.alerts.filter(alert => alert.bedId === bedId);
    }
    return this.alerts;
  }

  getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  }

  loadAlertsFromStorage() {
    const stored = localStorage.getItem('system_alerts');
    if (stored) {
      try {
        this.alerts = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading alerts:', error);
        this.alerts = [];
      }
    }
  }
}

// สร้าง instance และทำให้เป็น global
let alertSystemManager;
if (typeof window !== 'undefined' && !window.alertSystemManager) {
  alertSystemManager = new AlertSystemManager();
  alertSystemManager.loadAlertsFromStorage();
  window.alertSystemManager = alertSystemManager;
  window.alertSystem = alertSystemManager;
} else if (typeof window !== 'undefined') {
  alertSystemManager = window.alertSystemManager;
} else {
  alertSystemManager = new AlertSystemManager();
}

// Export สำหรับ ES modules
export { AlertSystemManager, alertSystemManager };

// Fallback สำหรับ CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AlertSystemManager, alertSystemManager };
}