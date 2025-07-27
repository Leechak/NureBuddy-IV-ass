
// IV Calculator System - ระบบคำนวณน้ำเกลือขั้นสูงพร้อมการแจ้งเตือน
class IVCalculatorSystem {
  constructor() {
    this.alertSystem = null;
    this.dataManager = null;
    this.monitoringIntervals = new Map();
    this.criticalThresholds = {
      flowRate: { min: 5, max: 200 }, // หยด/นาที
      ccPerHr: { min: 10, max: 500 }, // cc/hr
      timeRemaining: { critical: 30, warning: 60 }, // นาที
      balance: { critical: 1000, warning: 500 } // ml
    };
    this.init();
  }

  init() {
    // เชื่อมต่อกับระบบอื่น
    if (typeof window !== 'undefined') {
      this.alertSystem = window.alertSystemManager || window.alertSystem;
      this.dataManager = window.dataManager;
    }

    // เริ่มต้นการตรวจสอบ
    this.startGlobalMonitoring();
    console.log('🧮 IV Calculator System initialized');
  }

  // ===============================
  // การคำนวณหลัก
  // ===============================

  static dropPerMinToCcPerHr(dropPerMin, dropFactor = 20) {
    if (!dropPerMin || !dropFactor) return 0;
    return (dropPerMin * 60) / dropFactor;
  }

  static ccPerHrToDropPerMin(ccPerHr, dropFactor = 20) {
    if (!ccPerHr || !dropFactor) return 0;
    return (ccPerHr * dropFactor) / 60;
  }

  static calculateTimeToFinish(totalVolume, ccPerHr) {
    if (!totalVolume || !ccPerHr) return 0;
    return totalVolume / ccPerHr;
  }

  static quickDropCalculation(ccPerHr, dropFactor = 20) {
    if (dropFactor === 20) {
      return Math.round(ccPerHr / 3);
    } else if (dropFactor === 15) {
      return Math.round(ccPerHr / 4);
    } else if (dropFactor === 60) {
      return Math.round(ccPerHr);
    } else {
      return this.ccPerHrToDropPerMin(ccPerHr, dropFactor);
    }
  }

  static formatTime(hours) {
    if (!hours) return "0 ชั่วโมง 0 นาที";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} ชั่วโมง ${minutes} นาที`;
  }

  // ===============================
  // ระบบการแจ้งเตือนอัจฉริยะ
  // ===============================

  checkFlowRateAlerts(bedId, currentFlow, orderedFlow, patientData) {
    const alerts = [];
    
    // ตรวจสอบอัตราการไหลผิดปกติ
    if (currentFlow < this.criticalThresholds.flowRate.min) {
      alerts.push({
        type: 'critical',
        category: 'flow_rate',
        message: `🚨 อัตราการไหลต่ำมาก (${currentFlow} หยด/นาที) - ตรวจสอบทันที`,
        bedId: bedId,
        severity: 'critical',
        actions: ['ตรวจสอบหลอดน้ำเกลือ', 'ปรับแรงดัน IV bag', 'เปลี่ยน IV catheter']
      });
    } else if (currentFlow > this.criticalThresholds.flowRate.max) {
      alerts.push({
        type: 'critical',
        category: 'flow_rate',
        message: `🚨 อัตราการไหลสูงมาก (${currentFlow} หยด/นาที) - อันตราย!`,
        bedId: bedId,
        severity: 'critical',
        actions: ['หยุดการไหลทันที', 'ปรับความเร็ว', 'ตรวจสอบ IV pump']
      });
    }

    // ตรวจสอบความแตกต่างจากที่สั่ง
    const flowDifference = Math.abs(currentFlow - orderedFlow);
    const percentDifference = (flowDifference / orderedFlow) * 100;

    if (percentDifference > 50) {
      alerts.push({
        type: 'warning',
        category: 'flow_variance',
        message: `⚠️ อัตราการไหลผิดปกติ: สั่ง ${orderedFlow} หยด/นาที แต่ได้ ${currentFlow} หยด/นาที`,
        bedId: bedId,
        severity: 'warning',
        actions: ['ปรับอัตราการไหล', 'ตรวจสอบอุปกรณ์']
      });
    }

    return alerts;
  }

  checkTimeRemainingAlerts(bedId, timeRemainingHours, patientData) {
    const alerts = [];
    const timeRemainingMinutes = timeRemainingHours * 60;

    if (timeRemainingMinutes <= this.criticalThresholds.timeRemaining.critical) {
      alerts.push({
        type: 'critical',
        category: 'time_remaining',
        message: `🔥 น้ำเกลือจะหมดใน ${Math.round(timeRemainingMinutes)} นาที - เตรียมเปลี่ยนทันที!`,
        bedId: bedId,
        severity: 'critical',
        actions: ['เตรียมน้ำเกลือใหม่', 'แจ้งแพทย์', 'ตรวจสอบคำสั่งใหม่']
      });
    } else if (timeRemainingMinutes <= this.criticalThresholds.timeRemaining.warning) {
      alerts.push({
        type: 'warning',
        category: 'time_remaining',
        message: `⏰ น้ำเกลือจะหมดใน ${Math.round(timeRemainingMinutes)} นาที - เตรียมตัว`,
        bedId: bedId,
        severity: 'warning',
        actions: ['เตรียมน้ำเกลือใหม่', 'ตรวจสอบคำสั่ง']
      });
    }

    return alerts;
  }

  checkSafetyAlerts(bedId, ccPerHr, patientWeight, patientAge) {
    const alerts = [];
    
    if (!patientWeight || !ccPerHr) return alerts;

    const mlPerKgPerHr = ccPerHr / patientWeight;

    // เด็ก (อายุ < 18)
    if (patientAge && patientAge < 18) {
      if (mlPerKgPerHr > 8) {
        alerts.push({
          type: 'critical',
          category: 'pediatric_safety',
          message: `🚨 เด็ก: อัตราการให้น้ำสูงมาก ${mlPerKgPerHr.toFixed(1)} ml/kg/hr - อันตรายต่อหัวใจ!`,
          bedId: bedId,
          severity: 'critical',
          actions: ['ลดอัตราทันที', 'แจ้งแพทย์', 'ตรวจสอบอาการบวม']
        });
      }
    } else {
      // ผู้ใหญ่
      if (mlPerKgPerHr > 15) {
        alerts.push({
          type: 'critical',
          category: 'adult_safety',
          message: `🚨 อัตราการให้น้ำสูงมาก ${mlPerKgPerHr.toFixed(1)} ml/kg/hr - ระวังภาวะน้ำเกิน!`,
          bedId: bedId,
          severity: 'critical',
          actions: ['ลดอัตราทันที', 'ตรวจสอบอาการบวม', 'วัด I/O Balance']
        });
      } else if (mlPerKgPerHr > 10) {
        alerts.push({
          type: 'warning',
          category: 'adult_safety',
          message: `⚠️ อัตราการให้น้ำค่อนข้างสูง ${mlPerKgPerHr.toFixed(1)} ml/kg/hr - ติดตามใกล้ชิด`,
          bedId: bedId,
          severity: 'warning',
          actions: ['ติดตาม I/O', 'ตรวจสอบอาการ']
        });
      }
    }

    return alerts;
  }

  // ===============================
  // การจัดการการแจ้งเตือน
  // ===============================

  processAlerts(alerts) {
    alerts.forEach(alert => {
      // บันทึกในระบบแจ้งเตือน
      if (this.alertSystem) {
        this.alertSystem.addAlert(
          alert.bedId,
          alert.category,
          alert.message,
          alert.severity
        );

        // แสดงการแจ้งเตือนตามความรุนแรง
        if (alert.severity === 'critical') {
          this.showCriticalAlert(alert);
          this.playAlertSound('critical');
        } else if (alert.severity === 'warning') {
          this.showWarningToast(alert);
          this.playAlertSound('warning');
        }

        // บันทึกใน nurse notes
        if (this.dataManager) {
          this.dataManager.addNote(
            alert.bedId,
            `⚠️ IV Alert: ${alert.message}`,
            'iv_alert'
          );
        }
      }
    });
  }

  showCriticalAlert(alert) {
    if (!this.alertSystem) return;

    const actionsHTML = alert.actions.map(action => 
      `<li style="margin: 5px 0; padding: 8px; background: #fee2e2; border-radius: 6px;">• ${action}</li>`
    ).join('');

    const alertContent = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 15px;">🚨</div>
        <h3 style="color: #dc2626; margin-bottom: 15px;">การแจ้งเตือนวิกฤต</h3>
        <div style="background: #fef2f2; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <strong>เตียง ${alert.bedId}:</strong><br>
          ${alert.message}
        </div>
        
        <div style="text-align: left; margin-bottom: 20px;">
          <h4 style="color: #1f2937; margin-bottom: 10px;">📋 ขั้นตอนที่ต้องทำ:</h4>
          <ul style="list-style: none; padding: 0;">
            ${actionsHTML}
          </ul>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;">
          <button onclick="ivCalculatorSystem.acknowledgeAlert('${alert.bedId}', 'critical')" 
                  style="background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            ✅ รับทราบ
          </button>
          <button onclick="ivCalculatorSystem.snoozeAlert('${alert.bedId}', 5)" 
                  style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            ⏰ เลื่อน 5 นาที
          </button>
        </div>
      </div>
    `;

    this.alertSystem.createModal({
      id: 'criticalIVAlert',
      title: '🚨 การแจ้งเตือนวิกฤต - ระบบน้ำเกลือ',
      content: alertContent,
      size: 'medium',
      closable: false,
      className: 'critical-alert-modal'
    });
  }

  showWarningToast(alert) {
    if (!this.alertSystem) return;

    this.alertSystem.showToast({
      message: `⚠️ เตียง ${alert.bedId}: ${alert.message}`,
      type: 'warning',
      duration: 6000
    });
  }

  playAlertSound(type) {
    if (this.alertSystem && this.alertSystem.sounds) {
      if (type === 'critical' && this.alertSystem.sounds.critical) {
        this.alertSystem.sounds.critical();
      } else if (type === 'warning' && this.alertSystem.sounds.warning) {
        this.alertSystem.sounds.warning();
      }
    }
  }

  acknowledgeAlert(bedId, type) {
    if (this.alertSystem) {
      this.alertSystem.closeModal('criticalIVAlert');
      this.alertSystem.showToast({
        message: `✅ รับทราบการแจ้งเตือนเตียง ${bedId} แล้ว`,
        type: 'success'
      });
    }
  }

  snoozeAlert(bedId, minutes) {
    if (this.alertSystem) {
      this.alertSystem.closeModal('criticalIVAlert');
      this.alertSystem.showToast({
        message: `⏰ เลื่อนการแจ้งเตือนเตียง ${bedId} ไป ${minutes} นาที`,
        type: 'info'
      });

      // ตั้งเวลาแจ้งเตือนใหม่
      setTimeout(() => {
        this.alertSystem.showToast({
          message: `🔔 หมดเวลา Snooze เตียง ${bedId} - กรุณาตรวจสอบอีกครั้ง`,
          type: 'warning'
        });
      }, minutes * 60 * 1000);
    }
  }

  // ===============================
  // การตรวจสอบแบบอัตโนมัติ
  // ===============================

  startBedMonitoring(bedId) {
    this.stopBedMonitoring(bedId);

    const interval = setInterval(() => {
      this.checkBedStatus(bedId);
    }, 30000); // ตรวจทุก 30 วินาที

    this.monitoringIntervals.set(bedId, interval);
    console.log(`🔍 Started monitoring bed ${bedId}`);
  }

  stopBedMonitoring(bedId) {
    const interval = this.monitoringIntervals.get(bedId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(bedId);
      console.log(`⏹️ Stopped monitoring bed ${bedId}`);
    }
  }

  checkBedStatus(bedId) {
    if (!this.dataManager) return;

    const patientData = this.dataManager.getPatient(bedId);
    if (!patientData) return;

    const currentFlow = parseFloat(patientData.current_rate || patientData.rate || 0);
    const orderedFlow = parseFloat(patientData.rate || 0);
    const totalVolume = parseFloat(patientData.volume?.replace('mL', '') || 0);
    const ccPerHr = IVCalculatorSystem.dropPerMinToCcPerHr(currentFlow);
    
    let alerts = [];

    // ตรวจสอบอัตราการไหล
    alerts = alerts.concat(this.checkFlowRateAlerts(bedId, currentFlow, orderedFlow, patientData));

    // ตรวจสอบเวลาที่เหลือ
    if (totalVolume > 0 && ccPerHr > 0) {
      const timeRemaining = IVCalculatorSystem.calculateTimeToFinish(totalVolume, ccPerHr);
      alerts = alerts.concat(this.checkTimeRemainingAlerts(bedId, timeRemaining, patientData));
    }

    // ตรวจสอบความปลอดภัย
    if (patientData.weight) {
      alerts = alerts.concat(this.checkSafetyAlerts(
        bedId, 
        ccPerHr, 
        parseFloat(patientData.weight), 
        parseFloat(patientData.age || 0)
      ));
    }

    // ประมวลผลการแจ้งเตือน
    if (alerts.length > 0) {
      this.processAlerts(alerts);
    }
  }

  startGlobalMonitoring() {
    // ตรวจสอบทุกเตียงทุก 60 วินาที
    setInterval(() => {
      if (!this.dataManager) return;

      const maxBeds = window.MAX_BEDS || 8;
      for (let bedId = 1; bedId <= maxBeds; bedId++) {
        const patientData = this.dataManager.getPatient(bedId);
        if (patientData && patientData.patient_id) {
          this.checkBedStatus(bedId);
        }
      }
    }, 60000);
  }

  // ===============================
  // การคำนวณขั้นสูงพร้อมการแจ้งเตือน
  // ===============================

  calculateAdvancedWithAlerts(params) {
    const {
      bedId,
      dropPerMin,
      ccPerHr,
      totalVolume,
      dropFactor = 20,
      patientWeight,
      patientAge,
      fluidType = 'normal'
    } = params;

    // คำนวณค่าพื้นฐาน
    const result = {
      dropFactor: dropFactor,
      originalDropPerMin: parseFloat(dropPerMin) || 0,
      originalCcPerHr: parseFloat(ccPerHr) || 0,
      totalVolume: parseFloat(totalVolume) || 0
    };

    // คำนวณค่าที่ขาดหายไป
    if (dropPerMin && !ccPerHr) {
      result.calculatedCcPerHr = IVCalculatorSystem.dropPerMinToCcPerHr(dropPerMin, dropFactor);
    } else if (ccPerHr && !dropPerMin) {
      result.calculatedDropPerMin = IVCalculatorSystem.ccPerHrToDropPerMin(ccPerHr, dropFactor);
      result.quickDropPerMin = IVCalculatorSystem.quickDropCalculation(ccPerHr, dropFactor);
    }

    // คำนวณเวลาที่จะหมด
    const finalCcPerHr = result.calculatedCcPerHr || result.originalCcPerHr;
    if (totalVolume && finalCcPerHr) {
      result.timeToFinishHours = IVCalculatorSystem.calculateTimeToFinish(totalVolume, finalCcPerHr);
      result.timeToFinishFormatted = IVCalculatorSystem.formatTime(result.timeToFinishHours);
      result.estimatedFinishTime = new Date(Date.now() + (result.timeToFinishHours * 60 * 60 * 1000)).toLocaleString('th-TH');
    }

    // ตรวจสอบและสร้างการแจ้งเตือนถ้ามี bedId
    if (bedId) {
      let alerts = [];

      // ตรวจสอบอัตราการไหล
      const currentFlow = result.originalDropPerMin || result.calculatedDropPerMin || 0;
      const orderedFlow = result.originalDropPerMin || 0;
      alerts = alerts.concat(this.checkFlowRateAlerts(bedId, currentFlow, orderedFlow, {}));

      // ตรวจสอบเวลาที่เหลือ
      if (result.timeToFinishHours) {
        alerts = alerts.concat(this.checkTimeRemainingAlerts(bedId, result.timeToFinishHours, {}));
      }

      // ตรวจสอบความปลอดภัย
      if (patientWeight && finalCcPerHr) {
        alerts = alerts.concat(this.checkSafetyAlerts(bedId, finalCcPerHr, patientWeight, patientAge));
      }

      // ประมวลผลการแจ้งเตือน
      if (alerts.length > 0) {
        result.alerts = alerts;
        this.processAlerts(alerts);
      }
    }

    return result;
  }

  // ===============================
  // UI Components
  // ===============================

  createAdvancedCalculatorModal(bedId = null) {
    const patientData = bedId ? (this.dataManager?.getPatient(bedId) || null) : null;
    
    const modalContent = `
      <div style="padding: 20px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🧮</div>
          <h3 style="color: #1e293b; margin-bottom: 5px;">เครื่องคำนวณน้ำเกลืออัจฉริยะ</h3>
          <p style="color: #64748b; margin: 0;">พร้อมระบบแจ้งเตือนความปลอดภัย</p>
        </div>

        <form id="advancedIVForm" style="max-width: 600px; margin: 0 auto;">
          ${bedId ? `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
              <strong>🛏️ เตียง ${bedId}</strong><br>
              ${patientData ? `👤 ${patientData.patient_id}` : 'ไม่มีข้อมูลผู้ป่วย'}
            </div>
          ` : `
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">เลือกเตียง (ไม่บังคับ):</label>
              <select id="bedSelect" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                <option value="">-- ไม่ระบุเตียง --</option>
                ${this.generateBedOptions()}
              </select>
            </div>
          `}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">ปริมาตรน้ำเกลือ (mL):</label>
              <input type="number" id="totalVolume" placeholder="1000" min="1" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;" value="${patientData?.volume?.replace('mL', '') || ''}">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">Drop Factor:</label>
              <select id="dropFactor" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                <option value="10">10 หยด/cc (เด็ก)</option>
                <option value="15">15 หยด/cc</option>
                <option value="20" selected>20 หยด/cc (มาตรฐาน)</option>
                <option value="60">60 หยด/cc (Micro set)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">น้ำหนักผู้ป่วย (kg):</label>
              <input type="number" id="patientWeight" placeholder="70" min="1" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;" value="${patientData?.weight || ''}">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">อายุ (ปี):</label>
              <input type="number" id="patientAge" placeholder="30" min="0" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;" value="${patientData?.age || ''}">
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #1e293b;">กรอกข้อมูลอย่างใดอย่างหนึ่ง:</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">อัตราการหยด (หยด/นาที):</label>
                <input type="number" id="dropPerMin" placeholder="30" min="0" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;" value="${patientData?.rate || ''}">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">อัตราการไหล (cc/hr):</label>
                <input type="number" id="ccPerHr" placeholder="100" min="0" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <button type="submit" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; border: none; padding: 15px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
              🧮 คำนวณและตรวจสอบ
            </button>
          </div>

          <div id="calculationResults" style="display: none;"></div>
        </form>
      </div>
    `;

    if (this.alertSystem) {
      const modal = this.alertSystem.createModal({
        id: 'advancedIVCalculator',
        title: '🧮 เครื่องคำนวณน้ำเกลืออัจฉริยะ',
        content: modalContent,
        size: 'large',
        closable: true
      });

      this.setupCalculatorEventListeners(modal, bedId);
      return modal;
    }
  }

  setupCalculatorEventListeners(modal, bedId) {
    const form = modal.querySelector('#advancedIVForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAdvancedCalculation(modal, bedId);
      });
    }
  }

  handleAdvancedCalculation(modal, bedId) {
    const formData = {
      bedId: bedId || modal.querySelector('#bedSelect')?.value || null,
      totalVolume: modal.querySelector('#totalVolume').value,
      dropFactor: modal.querySelector('#dropFactor').value,
      patientWeight: modal.querySelector('#patientWeight').value,
      patientAge: modal.querySelector('#patientAge').value,
      dropPerMin: modal.querySelector('#dropPerMin').value,
      ccPerHr: modal.querySelector('#ccPerHr').value
    };

    if (!formData.dropPerMin && !formData.ccPerHr) {
      if (this.alertSystem) {
        this.alertSystem.showToast({
          message: 'กรุณากรอกอัตราการหยด หรือ อัตราการไหล',
          type: 'error'
        });
      }
      return;
    }

    const result = this.calculateAdvancedWithAlerts(formData);
    this.displayCalculationResults(modal, result);
  }

  displayCalculationResults(modal, result) {
    const resultsDiv = modal.querySelector('#calculationResults');
    if (!resultsDiv) return;

    let html = `
      <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 20px; border-radius: 10px; border: 2px solid #22c55e;">
        <h4 style="color: #166534; margin-bottom: 15px;">📊 ผลการคำนวณ</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
    `;

    if (result.calculatedCcPerHr) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <div style="font-weight: 700; color: #1e293b;">อัตราการไหล</div>
          <div style="font-size: 18px; color: #0ea5e9;">${result.calculatedCcPerHr.toFixed(1)} cc/hr</div>
        </div>
      `;
    }

    if (result.calculatedDropPerMin) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <div style="font-weight: 700; color: #1e293b;">อัตราการหยด</div>
          <div style="font-size: 18px; color: #0ea5e9;">${result.calculatedDropPerMin.toFixed(1)} หยด/นาที</div>
        </div>
      `;
    }

    if (result.timeToFinishFormatted) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <div style="font-weight: 700; color: #1e293b;">เวลาที่จะหมด</div>
          <div style="font-size: 18px; color: #ef4444;">${result.timeToFinishFormatted}</div>
        </div>
      `;
    }

    if (result.estimatedFinishTime) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <div style="font-weight: 700; color: #1e293b;">เวลาที่คาดว่าจะหมด</div>
          <div style="font-size: 14px; color: #64748b;">${result.estimatedFinishTime}</div>
        </div>
      `;
    }

    html += '</div>';

    // แสดงการแจ้งเตือนถ้ามี
    if (result.alerts && result.alerts.length > 0) {
      html += `
        <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h5 style="color: #dc2626; margin-bottom: 10px;">⚠️ การแจ้งเตือน</h5>
          ${result.alerts.map(alert => `
            <div style="margin-bottom: 8px; font-size: 14px; color: #991b1b;">
              • ${alert.message}
            </div>
          `).join('')}
        </div>
      `;
    }

    html += '</div>';

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  }

  generateBedOptions() {
    if (!this.dataManager) return '';

    let options = '';
    const maxBeds = window.MAX_BEDS || 8;
    
    for (let i = 1; i <= maxBeds; i++) {
      const patientData = this.dataManager.getPatient(i);
      if (patientData && patientData.patient_id) {
        options += `<option value="${i}">เตียง ${i} - ${patientData.patient_id}</option>`;
      }
    }
    return options;
  }
}

// Initialize the IV Calculator System
let ivCalculatorSystem;
if (typeof window !== 'undefined' && !window.ivCalculatorSystem) {
  ivCalculatorSystem = new IVCalculatorSystem();
  window.ivCalculatorSystem = ivCalculatorSystem;
  window.IVCalculatorSystem = IVCalculatorSystem;
} else if (typeof window !== 'undefined') {
  ivCalculatorSystem = window.ivCalculatorSystem;
} else {
  ivCalculatorSystem = new IVCalculatorSystem();
}

// Export สำหรับ ES modules
export { IVCalculatorSystem, ivCalculatorSystem };

// Fallback สำหรับ CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IVCalculatorSystem, ivCalculatorSystem };
}
