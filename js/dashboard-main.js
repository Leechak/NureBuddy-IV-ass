// Dashboard Main Module - รับผิดชอบการจัดการหน้า Dashboard

// Initialize and configure data manager
let dataManager;

// Initialize dataManager
if (typeof window.activeDataManager !== 'undefined') {
  dataManager = window.activeDataManager;
} else {
  // Fallback simple data manager
  class SimpleDataManager {
    constructor() {
      this.cache = new Map();
    }

    savePatient(bedId, patientData) {
      const enrichedData = {
        ...patientData,
        lastUpdated: new Date().toISOString(),
        bedId: bedId
      };

      localStorage.setItem(`ir_data_bed_${bedId}`, JSON.stringify(enrichedData));
      this.cache.set(`patient_${bedId}`, enrichedData);
      window.dispatchEvent(new CustomEvent('patientSaved', {
        detail: { bedId: bedId, patient: enrichedData }
      }));
      return enrichedData;
    }

    getPatient(bedId) {
      const key = `patient_${bedId}`;
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const data = localStorage.getItem(`ir_data_bed_${bedId}`);
      if (data) {
        const parsed = JSON.parse(data);
        this.cache.set(key, parsed);
        return parsed;
      }
      return null;
    }

    getIORecords(bedId) {
      return JSON.parse(localStorage.getItem(`io_records_bed_${bedId}`) || '[]');
    }

    saveIORecord(bedId, ioRecord) {
      const records = this.getIORecords(bedId);
      records.push(ioRecord);
      localStorage.setItem(`io_records_bed_${bedId}`, JSON.stringify(records));
      this.updateIOSummary(bedId);
    }

    updateIOSummary(bedId) {
      const records = this.getIORecords(bedId);
      let totalInput = 0;
      let totalOutput = 0;

      records.forEach(record => {
        totalInput += record.totalIn || 0;
        totalOutput += record.totalOut || 0;
      });

      const summary = {
        totalInput,
        totalOutput,
        balance: totalInput - totalOutput,
        recordCount: records.length,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(`io_summary_bed_${bedId}`, JSON.stringify(summary));
      return summary;
    }

    getIOSummary(bedId) {
      return JSON.parse(localStorage.getItem(`io_summary_bed_${bedId}`) || 'null');
    }

    getNotes(bedId) {
      return JSON.parse(localStorage.getItem(`notes_bed_${bedId}`) || '[]');
    }

    getAlerts(bedId) {
      return JSON.parse(localStorage.getItem(`alerts_bed_${bedId}`) || '[]');
    }

    addNote(bedId, note, type = 'general') {
      const notes = this.getNotes(bedId);
      const noteData = {
        id: Date.now().toString(),
        content: note,
        type: type,
        time: new Date().toLocaleString('th-TH'),
        timestamp: new Date().toISOString()
      };
      notes.unshift(noteData);
      localStorage.setItem(`notes_bed_${bedId}`, JSON.stringify(notes));
      return noteData;
    }
  }

  dataManager = new SimpleDataManager();
}

// Make dataManager globally available
window.dataManager = dataManager;

class DashboardManager {
  constructor() {
    this.currentUser = null;
    this.MAX_BEDS = window.MAX_BEDS || 8;
    this.init();
  }

  async init() {
    try {
      await this.initializeUser();
      this.setupEventListeners();
      this.renderDashboard();
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      this.showToast('เกิดข้อผิดพลาดในการเริ่มต้นระบบ', 'error');
    }
  }

  async initializeUser() {
    this.currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (!this.currentUser) {
      window.location.href = 'index.html';
      return;
    }

    this.updateUserInfo();
    this.updateBedCount();
  }

  updateUserInfo() {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
      userInfoElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            background: ${this.currentUser.role === 'admin' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)'};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          ">${this.currentUser.role === 'admin' ? 'ADMIN' : 'NURSE'}</div>
          <span>👤 ${this.currentUser.fullname}</span>
        </div>
      `;
    }

    const adminControls = document.getElementById('adminControls');
    if (adminControls) {
      adminControls.style.display = 'flex';
    }
  }

  updateBedCount() {
    const bedCountElem = document.getElementById('bedCountText');
    if (bedCountElem) {
      bedCountElem.textContent = this.MAX_BEDS;
    }
  }

  setupEventListeners() {
    // Quick Action buttons
    const quickAddBtn = document.querySelector('[data-action="quick-add"]');
    const ioEntryBtn = document.querySelector('[data-action="io-entry"]');
    const bedsOverviewBtn = document.querySelector('[data-action="beds-overview"]');
    const logoutBtn = document.querySelector('[data-action="logout"]');

    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => this.showQuickAdd());
    }

    if (ioEntryBtn) {
      ioEntryBtn.addEventListener('click', () => this.showIOEntry());
    }

    if (bedsOverviewBtn) {
      bedsOverviewBtn.addEventListener('click', () => this.showBedsOverview());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Form submissions
    this.setupFormListeners();
  }

  setupFormListeners() {
    // Patient form
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
      patientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePatient();
      });
    }

    // Modal close buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-close, .btn-cancel')) {
        this.closeActiveModal();
      }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveModal();
      }
    });
  }

  showQuickAdd() {
    if (typeof window.openPatientModal === 'function') {
      window.openPatientModal();
    } else {
      this.showToast('ฟีเจอร์นี้ยังไม่พร้อมใช้งาน', 'warning');
    }
  }

  showIOEntry() {
    if (typeof ioRecordManager !== 'undefined' && ioRecordManager && typeof ioRecordManager.createIOModal === 'function') {
      ioRecordManager.createIOModal();
    } else {
      // Fallback: แสดง modal I/O แบบง่าย
      const modal = document.getElementById('ioModalNew');
      if (modal) {
        modal.style.display = 'block';
        this.initializeIOModal();
      } else {
        this.showToast('ฟีเจอร์ I/O ยังไม่พร้อมใช้งาน', 'warning');
      }
    }
  }

  showBedsOverview() {
    this.loadBedsOverview();
    const bedsModal = document.getElementById('bedsModal');
    if (bedsModal) {
      bedsModal.style.display = 'flex';
    }
  }

  loadBedsOverview() {
    const content = document.getElementById('bedsOverviewContent');
    if (!content) return;

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';

    for (let i = 1; i <= this.MAX_BEDS; i++) {
      const bedData = dataManager.getPatient(i);
      const ioRecords = dataManager.getIORecords(i);

      if (bedData && bedData.patient_id) {
        html += this.createBedCard(i, bedData, ioRecords);
      } else {
        html += this.createEmptyBedCard(i);
      }
    }

    html += '</div>';
    content.innerHTML = html;
  }

  createBedCard(bedId, bedData, ioRecords) {
    return `
      <div style="
        background: white;
        border-radius: 15px;
        padding: 20px;
        border: 2px solid #22c55e;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      ">
        <h4 style="color: #1e293b; margin-bottom: 15px;">🛏️ เตียง ${bedId}</h4>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
          <div><strong>👤 ${bedData.patient_id}</strong></div>
          <div style="font-size: 14px; color: #64748b;">💊 ${bedData.medication || 'ไม่ระบุ'}</div>
          <div style="font-size: 14px; color: #64748b;">💧 ${bedData.volume || 'ไม่ระบุ'} mL</div>
          <div style="font-size: 14px; color: #64748b;">⚡ ${bedData.rate || 'ไม่ระบุ'} ดรอป/นาที</div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.href='chart.html?bed=${bedId}'" class="btn btn-primary" style="font-size: 12px; padding: 8px 12px;">
            👀 ดูรายละเอียด
          </button>
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
          บันทึก I/O: ${ioRecords.length} รายการ
        </div>
      </div>
    `;
  }

  createEmptyBedCard(bedId) {
    return `
      <div style="
        background: white;
        border-radius: 15px;
        padding: 20px;
        border: 2px dashed #cbd5e1;
        text-align: center;
        color: #64748b;
      ">
        <h4 style="margin-bottom: 15px;">🛏️ เตียง ${bedId}</h4>
        <div style="font-size: 48px; margin-bottom: 10px; opacity: 0.5;">➕</div>
        <div>เตียงว่าง</div>
        <div style="font-size: 12px; margin-top: 10px;">พร้อมรับผู้ป่วยใหม่</div>
      </div>
    `;
  }

  savePatient() {
    const bedId = document.getElementById('bedSelect')?.value;
    const patientId = document.getElementById('patientId')?.value?.trim();
    const patientName = document.getElementById('patientName')?.value?.trim();
    const medication = document.getElementById('medication')?.value;
    const volume = document.getElementById('volume')?.value;
    const rate = document.getElementById('rate')?.value;

    if (!bedId || !patientId || !medication || !volume || !rate) {
      this.showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    const patientData = {
      patient_id: patientId,
      name: patientName,
      medication: medication,
      volume: volume + 'mL',
      rate: parseFloat(rate),
      lastUpdated: new Date().toISOString()
    };

    try {
      const savedData = dataManager.savePatient(bedId, patientData);
      this.showToast('✅ บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว', 'success');
      this.closeActiveModal();
      this.clearPatientForm();

      // รีเฟรชภาพรวมเตียงทันที
      this.loadBedsOverviewInDashboard();

      // เชื่อมต่อกับระบบคำนวณน้ำเกลือเพื่อตรวจสอบและแจ้งเตือน
      this.initializeIVMonitoring(bedId, patientData);

      console.log('Patient saved successfully:', savedData);
    } catch (error) {
      console.error('Save patient error:', error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  }

  initializeIVMonitoring(bedId, patientData) {
    // ตรวจสอบว่ามีระบบ IV Calculator หรือไม่
    if (typeof window.ivCalculatorSystem !== 'undefined') {
      // เริ่มต้นการตรวจสอบเตียงนี้
      window.ivCalculatorSystem.startBedMonitoring(bedId);

      // คำนวณและตรวจสอบทันที
      const volumeNumeric = parseFloat(patientData.volume.replace('mL', ''));
      const calculationParams = {
        bedId: bedId,
        dropPerMin: patientData.rate,
        totalVolume: volumeNumeric,
        dropFactor: 20, // ค่าเริ่มต้น
        patientWeight: null, // จะได้จากข้อมูลเพิ่มเติมภายหลัง
        patientAge: null
      };

      // ทำการคำนวณและตรวจสอบความปลอดภัย
      const result = window.ivCalculatorSystem.calculateAdvancedWithAlerts(calculationParams);

      // แสดงผลการคำนวณเบื้องต้น
      this.showIVCalculationSummary(bedId, result, patientData);

      // เพิ่มบันทึกการเริ่มต้นระบบตรวจสอบ
      dataManager.addNote(
        bedId,
        `🧮 เริ่มระบบตรวจสอบน้ำเกลือ: ${patientData.rate} ดรอป/นาที, ปริมาณ ${patientData.volume}`,
        'iv_monitoring'
      );

      console.log(`IV Monitoring initialized for bed ${bedId}:`, result);
    } else {
      // ถ้าไม่มีระบบ IV Calculator ให้โหลด
      this.loadIVCalculatorSystem(() => {
        this.initializeIVMonitoring(bedId, patientData);
      });
    }
  }

  loadIVCalculatorSystem(callback) {
    if (typeof window.ivCalculatorSystem !== 'undefined') {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.src = './System/iv-calculator.js';
    script.type = 'module';
    script.onload = () => {
      // รอให้ระบบเริ่มต้นเสร็จ
      setTimeout(() => {
        if (typeof window.ivCalculatorSystem !== 'undefined') {
          callback();
        } else {
          console.error('Failed to load IV Calculator System');
        }
      }, 500);
    };
    script.onerror = () => {
      console.error('Error loading IV Calculator System');
    };
    document.head.appendChild(script);
  }

  showIVCalculationSummary(bedId, calculationResult, patientData) {
    if (!calculationResult) return;

    let summaryMessage = `🧮 สรุปการคำนวณน้ำเกลือ เตียง ${bedId}:\n`;
    
    if (calculationResult.calculatedCcPerHr) {
      summaryMessage += `• อัตราการไหล: ${calculationResult.calculatedCcPerHr.toFixed(1)} cc/hr\n`;
    }
    
    if (calculationResult.timeToFinishFormatted) {
      summaryMessage += `• เวลาที่จะหมด: ${calculationResult.timeToFinishFormatted}\n`;
    }
    
    if (calculationResult.estimatedFinishTime) {
      summaryMessage += `• เวลาที่คาดว่าจะหมด: ${calculationResult.estimatedFinishTime}\n`;
    }

    // แสดงการแจ้งเตือนถ้ามี
    if (calculationResult.alerts && calculationResult.alerts.length > 0) {
      summaryMessage += `\n⚠️ การแจ้งเตือน: ${calculationResult.alerts.length} รายการ`;
    } else {
      summaryMessage += '\n✅ ไม่พบปัญหาความปลอดภัย';
    }

    // แสดง toast ข้อมูลสรุป
    this.showToast(
      `เริ่มระบบตรวจสอบน้ำเกลือเตียง ${bedId} แล้ว`,
      calculationResult.alerts && calculationResult.alerts.length > 0 ? 'warning' : 'success'
    );

    console.log('IV Calculation Summary:', summaryMessage);
  }

  clearPatientForm() {
    const fields = ['bedSelect', 'patientId', 'patientName', 'medication', 'volume', 'rate'];
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
  }

  closeActiveModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
  }

  logout() {
    if (confirm('ต้องการออกจากระบบ?')) {
      sessionStorage.removeItem('currentUser');
      this.showToast('ออกจากระบบเรียบร้อย', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  }

  initializeIOModal() {
    // Initialize bed grid in I/O modal
    const ioBedGrid = document.getElementById('ioBedGrid');
    if (ioBedGrid) {
      ioBedGrid.innerHTML = '';

      for (let i = 1; i <= this.MAX_BEDS; i++) {
        const patient = window.dataManager.getPatient(i);
        const bedCard = document.createElement('div');
        bedCard.className = `io-bed-card ${patient ? 'occupied' : ''}`;
        bedCard.dataset.bedId = i;

        bedCard.innerHTML = `
          <div class="io-bed-number">เตียง ${i}</div>
          <div class="io-bed-status">${patient ? 'มีผู้ป่วย' : 'ว่าง'}</div>
          ${patient ? `<div class="io-bed-patient">${patient.name || patient.patient_id}</div>` : ''}
        `;

        bedCard.addEventListener('click', () => this.selectIOBed(i));
        ioBedGrid.appendChild(bedCard);
      }
    }

    // Setup I/O form listeners
    this.setupIOFormListeners();
  }

  selectIOBed(bedId) {
    // Remove previous selection
    document.querySelectorAll('.io-bed-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Select current bed
    const selectedCard = document.querySelector(`[data-bed-id="${bedId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }

    // Load patient info
    const patient = window.dataManager.getPatient(bedId);
    const patientInfo = document.getElementById('ioPatientInfo');
    const patientName = document.getElementById('ioPatientName');
    const patientId = document.getElementById('ioPatientId');

    if (patient) {
      patientInfo.style.display = 'block';
      patientName.textContent = patient.name || patient.patient_id || 'ไม่ระบุชื่อ';
      patientId.textContent = `รหัส: ${patient.patient_id || 'ไม่ระบุ'}`;

      // Show I/O form
      const ioForm = document.getElementById('ioForm');
      if (ioForm) {
        ioForm.style.display = 'block';
        ioForm.dataset.bedId = bedId;
      }
    } else {
      patientInfo.style.display = 'none';
      const ioForm = document.getElementById('ioForm');
      if (ioForm) {
        ioForm.style.display = 'none';
      }
    }
  }

  setupIOFormListeners() {
    // Input calculation
    const inputFields = ['inputOral', 'inputIV', 'inputTube', 'inputOther'];
    const outputFields = ['outputUrine', 'outputVomit', 'outputDrain', 'outputStool', 'outputOther'];

    [...inputFields, ...outputFields].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => this.calculateIOBalance());
      }
    });

    // Form submission
    const ioForm = document.getElementById('ioForm');
    if (ioForm) {
      ioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveIORecord();
      });
    }

    // Close modal listeners
    document.querySelectorAll('[data-action="close-io-modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('ioModalNew');
        if (modal) modal.style.display = 'none';
      });
    });
  }

  calculateIOBalance() {
    const inputFields = ['inputOral', 'inputIV', 'inputTube', 'inputOther'];
    const outputFields = ['outputUrine', 'outputVomit', 'outputDrain', 'outputStool', 'outputOther'];

    let totalInput = 0;
    let totalOutput = 0;

    inputFields.forEach(fieldId => {
      const value = parseFloat(document.getElementById(fieldId)?.value || 0);
      totalInput += value;
    });

    outputFields.forEach(fieldId => {
      const value = parseFloat(document.getElementById(fieldId)?.value || 0);
      totalOutput += value;
    });

    const balance = totalInput - totalOutput;

    // Update displays
    const inputTotal = document.getElementById('inputTotal');
    const outputTotal = document.getElementById('outputTotal');
    const balanceValue = document.getElementById('balanceValue');
    const balanceStatus = document.getElementById('balanceStatus');
    const balanceCard = document.getElementById('balanceCard');

    if (inputTotal) inputTotal.textContent = `${totalInput} ml`;
    if (outputTotal) outputTotal.textContent = `${totalOutput} ml`;
    if (balanceValue) balanceValue.textContent = `${balance > 0 ? '+' : ''}${balance} ml`;

    // Update status and styling
    if (balanceStatus && balanceCard) {
      if (balance === 0) {
        balanceStatus.textContent = 'สมดุล';
        balanceStatus.className = 'balance-status balanced';
        balanceCard.className = 'balance-card balanced';
      } else if (balance > 0) {
        balanceStatus.textContent = 'น้ำเข้ามากกว่า';
        balanceStatus.className = 'balance-status positive';
        balanceCard.className = 'balance-card positive';
      } else {
        balanceStatus.textContent = 'น้ำออกมากกว่า';
        balanceStatus.className = 'balance-status negative';
        balanceCard.className = 'balance-card negative';
      }
    }
  }

  saveIORecord() {
    const ioForm = document.getElementById('ioForm');
    const bedId = ioForm?.dataset.bedId;

    if (!bedId) {
      this.showToast('กรุณาเลือกเตียงก่อน', 'error');
      return;
    }

    const inputFields = ['inputOral', 'inputIV', 'inputTube', 'inputOther'];
    const outputFields = ['outputUrine', 'outputVomit', 'outputDrain', 'outputStool', 'outputOther'];

    let totalInput = 0;
    let totalOutput = 0;
    const inputData = {};
    const outputData = {};

    inputFields.forEach(fieldId => {
      const value = parseFloat(document.getElementById(fieldId)?.value || 0);
      const key = fieldId.replace('input', '').toLowerCase();
      inputData[key] = value;
      totalInput += value;
    });

    outputFields.forEach(fieldId => {
      const value = parseFloat(document.getElementById(fieldId)?.value || 0);
      const key = fieldId.replace('output', '').toLowerCase();
      outputData[key] = value;
      totalOutput += value;
    });

    const note = document.getElementById('ioNoteNew')?.value?.trim() || '';
    const balance = totalInput - totalOutput;

    const ioRecord = {
      input: inputData,
      output: outputData,
      totalIn: totalInput,
      totalOut: totalOutput,
      balance: balance,
      note: note,
      timestamp: new Date().toISOString(),
      recordedBy: this.currentUser?.fullname || 'ไม่ระบุ'
    };

    try {
      window.dataManager.saveIORecord(bedId, ioRecord);
      this.showToast('✅ บันทึก I/O สำเร็จ', 'success');

      // Clear form
      [...inputFields, ...outputFields].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
      });

      const noteField = document.getElementById('ioNoteNew');
      if (noteField) noteField.value = '';

      this.calculateIOBalance();

      // Close modal
      const modal = document.getElementById('ioModalNew');
      if (modal) modal.style.display = 'none';

      // Refresh dashboard
      this.loadBedsOverviewInDashboard();

    } catch (error) {
      console.error('Save I/O error:', error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึก I/O', 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#0ea5e9'};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      min-width: 300px;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
    `;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">${icons[type] || icons.info}</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  renderDashboard() {
    // โหลดภาพรวมเตียงทั้งหมด
    this.loadBedsOverviewInDashboard();
    
    // โหลดข้อมูลสรุปน้ำเกลือ
    this.loadIVSummary();
    
    // โหลดการแจ้งเตือนข้อมูลสำคัญ
    this.loadQuickAlerts();
    
    // ตั้งเวลาอัพเดทอัตโนมัติ
    this.startAutoRefresh();
    
    console.log('Dashboard rendered successfully');
  }

  loadIVSummary() {
    const ivSummaryGrid = document.getElementById('ivSummaryGrid');
    if (!ivSummaryGrid) return;

    let html = '';
    let normalCount = 0, warningCount = 0, criticalCount = 0, totalActive = 0;

    for (let i = 1; i <= this.MAX_BEDS; i++) {
      const bedData = dataManager.getPatient(i);
      if (bedData && bedData.patient_id) {
        totalActive++;
        const summaryData = this.calculateIVSummary(i, bedData);
        html += this.createIVSummaryCard(i, bedData, summaryData);
        
        // นับสถิติ
        switch (summaryData.status) {
          case 'normal': normalCount++; break;
          case 'warning': warningCount++; break;
          case 'critical': criticalCount++; break;
        }
      }
    }

    // อัพเดทสถิติภาพรวม
    this.updateOverviewStats(normalCount, warningCount, criticalCount, totalActive);

    if (html === '') {
      html = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 48px; margin-bottom: 15px;">💤</div>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">ไม่มีข้อมูลน้ำเกลือในขณะนี้</div>
          <div style="font-size: 14px;">เมื่อมีการเพิ่มผู้ป่วยใหม่ ข้อมูลจะแสดงที่นี่</div>
        </div>
      `;
    }

    ivSummaryGrid.innerHTML = html;
  }

  updateOverviewStats(normal, warning, critical, total) {
    const elements = {
      normalBedsCount: document.getElementById('normalBedsCount'),
      warningBedsCount: document.getElementById('warningBedsCount'),
      criticalBedsCount: document.getElementById('criticalBedsCount'),
      totalActiveBedsCount: document.getElementById('totalActiveBedsCount')
    };

    if (elements.normalBedsCount) elements.normalBedsCount.textContent = normal;
    if (elements.warningBedsCount) elements.warningBedsCount.textContent = warning;
    if (elements.criticalBedsCount) elements.criticalBedsCount.textContent = critical;
    if (elements.totalActiveBedsCount) elements.totalActiveBedsCount.textContent = total;
  }

  calculateIVSummary(bedId, bedData) {
    // คำนวณข้อมูลน้ำเกลือ
    const orderedRate = parseFloat(bedData.rate || 0);
    const currentRate = parseFloat(bedData.current_rate || bedData.rate || 0);
    const volume = parseFloat(bedData.volume?.replace('mL', '') || 0);
    
    const orderedCcPerHr = (orderedRate * 60) / 20;
    const currentCcPerHr = (currentRate * 60) / 20;
    const timeRemaining = volume > 0 && currentCcPerHr > 0 ? volume / currentCcPerHr : 0;
    
    const difference = Math.abs(orderedRate - currentRate);
    const percentage = orderedRate > 0 ? (difference / orderedRate) * 100 : 0;
    
    let status = 'normal';
    if (percentage > 20 || timeRemaining < 0.5) {
      status = 'critical';
    } else if (percentage > 10 || timeRemaining < 1) {
      status = 'warning';
    }

    return {
      orderedRate,
      currentRate,
      orderedCcPerHr,
      currentCcPerHr,
      timeRemaining,
      difference,
      percentage,
      status,
      estimatedFinishTime: timeRemaining > 0 ? new Date(Date.now() + timeRemaining * 60 * 60 * 1000) : null
    };
  }

  createIVSummaryCard(bedId, bedData, summaryData) {
    const statusText = {
      normal: 'ปกติ',
      warning: 'เตือน', 
      critical: 'ฉุกเฉิน'
    };

    const statusIcon = {
      normal: '✅',
      warning: '⚠️',
      critical: '🚨'
    };

    // คำนวณ progress bar สำหรับเวลาคงเหลือ
    const totalVolume = parseFloat(bedData.volume?.replace('mL', '') || 0);
    const usedVolume = totalVolume * (1 - (summaryData.timeRemaining / (totalVolume / summaryData.currentCcPerHr)));
    const progressPercentage = totalVolume > 0 ? Math.min(100, Math.max(0, (usedVolume / totalVolume) * 100)) : 0;

    return `
      <div class="iv-summary-card ${summaryData.status}" onclick="window.location.href='chart.html?bed=${bedId}'" data-bed-id="${bedId}">
        <div class="iv-summary-header">
          <div class="iv-summary-bed">🛏️ เตียง ${bedId}</div>
          <div class="iv-summary-status ${summaryData.status}">
            ${statusIcon[summaryData.status]} ${statusText[summaryData.status]}
          </div>
        </div>

        <div class="iv-summary-info">
          <div class="iv-info-item">
            <div class="iv-info-label">👤 ผู้ป่วย</div>
            <div class="iv-info-value">${bedData.patient_id}</div>
          </div>
          <div class="iv-info-item">
            <div class="iv-info-label">💊 ยา/สารน้ำ</div>
            <div class="iv-info-value">${bedData.medication || 'N/A'}</div>
          </div>
        </div>

        <!-- Progress Bar สำหรับปริมาณน้ำเกลือ -->
        <div class="iv-volume-progress">
          <div class="progress-header">
            <span class="progress-label">💧 ปริมาณน้ำเกลือ</span>
            <span class="progress-value">${bedData.volume || '0 mL'}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${100 - progressPercentage}%"></div>
          </div>
          <div class="progress-time">⏰ เวลาคงเหลือ: ${summaryData.timeRemaining > 0 ? summaryData.timeRemaining.toFixed(1) + ' ชม.' : 'N/A'}</div>
        </div>

        <!-- การเปรียบเทียบอัตราการไหล -->
        <div class="iv-flow-comparison">
          <div class="flow-comparison-header">📊 การเปรียบเทียบอัตราการไหล</div>
          <div class="flow-comparison-grid">
            <div class="flow-item ordered">
              <div class="flow-label">ที่สั่ง</div>
              <div class="flow-value">${summaryData.orderedRate}</div>
              <div class="flow-unit">ดรอป/นาที</div>
            </div>
            <div class="flow-item measured">
              <div class="flow-label">ปัจจุบัน</div>
              <div class="flow-value">${summaryData.currentRate}</div>
              <div class="flow-unit">ดรอป/นาที</div>
            </div>
            <div class="flow-item difference ${summaryData.status}">
              <div class="flow-label">ความแตกต่าง</div>
              <div class="flow-value">${summaryData.percentage.toFixed(1)}%</div>
              <div class="flow-unit">${summaryData.difference.toFixed(1)} ดรอป</div>
            </div>
          </div>
        </div>

        ${summaryData.estimatedFinishTime ? `
          <div class="iv-finish-time">
            🕐 คาดว่าจะหมด: ${summaryData.estimatedFinishTime.toLocaleString('th-TH', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        ` : ''}
      </div>
    `;
  }

  loadQuickAlerts() {
    const quickAlertsGrid = document.getElementById('quickAlertsGrid');
    const criticalCount = document.getElementById('criticalCount');
    const warningCount = document.getElementById('warningCount');
    const normalCount = document.getElementById('normalCount');
    const activeAlertsCount = document.getElementById('activeAlertsCount');

    if (!quickAlertsGrid) return;

    let alerts = [];
    let critical = 0, warning = 0, normal = 0;

    // รวบรวมการแจ้งเตือนจากทุกเตียง
    for (let i = 1; i <= this.MAX_BEDS; i++) {
      const bedData = dataManager.getPatient(i);
      if (bedData && bedData.patient_id) {
        const summaryData = this.calculateIVSummary(i, bedData);
        
        if (summaryData.status === 'critical') {
          critical++;
          alerts.push({
            bedId: i,
            type: 'critical',
            icon: '🚨',
            title: `เตียง ${i} - สถานการณ์ฉุกเฉิน`,
            message: `อัตราการไหลผิดปกติ ${summaryData.percentage.toFixed(1)}%`,
            time: 'เมื่อสักครู่'
          });
        } else if (summaryData.status === 'warning') {
          warning++;
          alerts.push({
            bedId: i,
            type: 'warning',
            icon: '⚠️',
            title: `เตียง ${i} - ต้องติดตาม`,
            message: `อัตราการไหลเบี่ยงเบน ${summaryData.percentage.toFixed(1)}%`,
            time: 'เมื่อ 5 นาที'
          });
        } else {
          normal++;
        }
      }
    }

    // อัพเดทสถิติ
    if (criticalCount) criticalCount.textContent = critical;
    if (warningCount) warningCount.textContent = warning;
    if (normalCount) normalCount.textContent = normal;
    if (activeAlertsCount) activeAlertsCount.textContent = critical + warning;

    // แสดงการแจ้งเตือนเร่งด่วน
    let html = '';
    const topAlerts = alerts.slice(0, 6); // แสดงสูงสุด 6 รายการ

    if (topAlerts.length === 0) {
      html = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #64748b;">
          <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">ไม่มีการแจ้งเตือน</div>
          <div style="font-size: 14px;">ระบบทำงานปกติทุกเตียง</div>
        </div>
      `;
    } else {
      topAlerts.forEach(alert => {
        html += `
          <div class="quick-alert-card ${alert.type}" onclick="window.location.href='chart.html?bed=${alert.bedId}'">
            <div class="alert-card-header">
              <div class="alert-card-icon">${alert.icon}</div>
              <div class="alert-card-title">${alert.title}</div>
            </div>
            <div class="alert-card-message">${alert.message}</div>
            <div class="alert-card-time">${alert.time}</div>
          </div>
        `;
      });
    }

    quickAlertsGrid.innerHTML = html;
  }

  startAutoRefresh() {
    // รีเฟรชข้อมูลทุก 30 วินาที
    setInterval(() => {
      this.loadIVSummary();
      this.loadQuickAlerts();
    }, 30000);
  }

  loadBedsOverviewInDashboard() {
    const bedsGrid = document.getElementById('bedsGrid');
    const activeBeds = document.getElementById('activeBeds');
    const emptyBeds = document.getElementById('emptyBeds');

    if (!bedsGrid) return;

    let html = '';
    let activeCount = 0;
    let emptyCount = 0;

    for (let i = 1; i <= this.MAX_BEDS; i++) {
      const bedData = window.dataManager.getPatient(i);
      const ioRecords = window.dataManager.getIORecords(i);

      if (bedData && bedData.patient_id) {
        html += this.createDashboardBedCard(i, bedData, ioRecords);
        activeCount++;
      } else {
        html += this.createDashboardEmptyBedCard(i);
        emptyCount++;
      }
    }

    bedsGrid.innerHTML = html;

    // อัพเดทสถิติ
    if (activeBeds) activeBeds.textContent = activeCount;
    if (emptyBeds) emptyBeds.textContent = emptyCount;
  }

  createDashboardBedCard(bedId, bedData, ioRecords) {
    const ioSummary = window.dataManager.getIOSummary(bedId);

    return `
      <div class="bed-card" onclick="window.location.href='chart.html?bed=${bedId}'">
        <div class="bed-header">
          <div class="bed-number">
            <div class="bed-icon">🛏️</div>
            เตียง ${bedId}
          </div>
          <div class="status-indicator">
            <div class="status-dot"></div>
            <div class="status-text">ใช้งาน</div>
          </div>
        </div>

        <div class="bed-content">
          <div class="patient-info">
            <div class="patient-info-row">
              <div class="patient-info-label">👤 ผู้ป่วย</div>
              <div class="patient-info-value">${bedData.patient_id || 'ไม่ระบุ'}</div>
            </div>
            <div class="patient-info-row">
              <div class="patient-info-label">💊 ยา/สารน้ำ</div>
              <div class="patient-info-value">${bedData.medication || 'ไม่ระบุ'}</div>
            </div>
            <div class="patient-info-row">
              <div class="patient-info-label">💧 ปริมาณ</div>
              <div class="patient-info-value">${bedData.volume || 'ไม่ระบุ'}</div>
            </div>
            <div class="patient-info-row">
              <div class="patient-info-label">⚡ อัตรา</div>
              <div class="patient-info-value">${bedData.rate || 'ไม่ระบุ'} ดรอป/นาที</div>
            </div>
          </div>

          ${ioSummary ? `
            <div class="comparison-section">
              <div class="comparison-header">
                💧 สรุป I/O Balance
              </div>
              <div class="comparison-grid">
                <div class="comparison-item">
                  <div class="comparison-label">INPUT</div>
                  <div class="comparison-value">${ioSummary.totalInput || 0}</div>
                </div>
                <div class="comparison-item">
                  <div class="comparison-label">OUTPUT</div>
                  <div class="comparison-value">${ioSummary.totalOutput || 0}</div>
                </div>
              </div>
              <div class="variance-indicator">
                Balance: ${ioSummary.balance > 0 ? '+' : ''}${ioSummary.balance || 0} mL
              </div>
            </div>
          ` : ''}

          <div class="stats-row">
            <div class="stat-mini">
              <div class="stat-mini-value">${ioRecords.length}</div>
              <div class="stat-mini-label">I/O Records</div>
            </div>
            <div class="stat-mini">
              <div class="stat-mini-value">${window.dataManager.getNotes(bedId).length}</div>
              <div class="stat-mini-label">Notes</div>
            </div>
            <div class="stat-mini">
              <div class="stat-mini-value">${window.dataManager.getAlerts(bedId).length}</div>
              <div class="stat-mini-label">Alerts</div>
            </div>
          </div>

          <div class="last-update">
            อัพเดทล่าสุด: ${new Date(bedData.lastUpdated || Date.now()).toLocaleString('th-TH')}
          </div>
        </div>
      </div>
    `;
  }

  createDashboardEmptyBedCard(bedId) {
    return `
      <div class="bed-card" onclick="this.classList.contains('empty-bed') && window.dashboardManager.showQuickAdd()">
        <div class="empty-bed">
          <div class="empty-bed-icon">➕</div>
          <div class="empty-bed-title">เตียง ${bedId}</div>
          <div class="empty-bed-desc">เตียงว่าง - คลิกเพื่อเพิ่มผู้ป่วย</div>
        </div>
      </div>
    `;
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardManager = new DashboardManager();
});

// Event listener สำหรับ patient saved
window.addEventListener('patientSaved', (event) => {
  console.log('Patient saved:', event.detail);
  loadBedsData();
  updateBedsStats();
});

// Initialize alert system
if (typeof window.alertSystemManager !== 'undefined') {
  console.log('Alert system available');
} else {
  console.log('Alert system not available');
}

// Load initial data
loadBedsData();
updateBedsStats();
displayUserInfo();

// ฟังก์ชันแสดงข้อมูลผู้ใช้
function displayUserInfo() {
  const userInfoElement = document.getElementById('userInfo');
  if (!userInfoElement) return;

  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (currentUser) {
    userInfoElement.innerHTML = `👤 ${currentUser.fullname} | 📅 ${new Date().toLocaleDateString('th-TH')}`;

    // แสดง admin controls ถ้าเป็น admin
    if (currentUser.role === 'admin') {
      const adminControls = document.getElementById('adminControls');
      if (adminControls) {
        adminControls.style.display = 'flex';
      }
    }
  } else {
    userInfoElement.innerHTML = '👤 ไม่พบข้อมูลผู้ใช้';
  }
}

// ฟังก์ชันโหลดข้อมูลเตียง
function loadBedsData() {
  const bedsGrid = document.getElementById('bedsGrid');
  if (!bedsGrid) return;

  const maxBeds = window.MAX_BEDS || 8;
  bedsGrid.innerHTML = '';

  for (let bedId = 1; bedId <= maxBeds; bedId++) {
    const bedCard = createBedCard(bedId);
    bedsGrid.appendChild(bedCard);
  }
}

// ฟังก์ชันสร้างการ์ดเตียง
function createBedCard(bedId) {
  const patientData = dataManager.getPatient(bedId);
  const cardElement = document.createElement('div');

  if (patientData) {
    // เตียงที่มีผู้ป่วย
    const flowRate = parseFloat(patientData.rate || 0);
    const ccPerHr = (flowRate * 60) / 20; // แปลงเป็น cc/hr
    const volumeLeft = parseFloat(patientData.volume?.replace('mL', '') || 0);
    const timeRemaining = volumeLeft / ccPerHr;

    cardElement.className = 'bed-card';
    cardElement.innerHTML = `
      <div class="bed-header">
        <div class="bed-number">
          <div class="bed-icon">🛏️</div>
          เตียง ${bedId}
        </div>
        <div class="status-indicator">
          <div class="status-dot"></div>
          <div class="status-text">ใช้งาน</div>
        </div>
      </div>

      <div class="bed-content">
        <div class="flow-rate-section">
          <span class="flow-rate">${flowRate}</span>
          <div class="flow-rate-label">หยด/นาที</div>
        </div>

        <div class="patient-info">
          <div class="patient-info-row">
            <span class="patient-info-label">👤 รหัสผู้ป่วย</span>
            <span class="patient-info-value">${patientData.patient_id}</span>
          </div>
          <div class="patient-info-row">
            <span class="patient-info-label">💊 ยา/สารน้ำ</span>
            <span class="patient-info-value">${patientData.medication}</span>
          </div>
          <div class="patient-info-row">
            <span class="patient-info-label">🥤 ปริมาตร</span>
            <span class="patient-info-value">${patientData.volume}</span>
          </div>
        </div>

        <div class="comparison-section">
          <div class="comparison-header">
            <span>📊</span> ข้อมูลการไหล
          </div>
          <div class="comparison-grid">
            <div class="comparison-item">
              <div class="comparison-label">CC/HR</div>
              <div class="comparison-value">${ccPerHr.toFixed(1)}</div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">เวลาคงเหลือ</div>
              <div class="comparison-value">${isFinite(timeRemaining) ? timeRemaining.toFixed(1) : '∞'} ชม.</div>
            </div>
          </div>
        </div>

        <div class="last-update">
          อัพเดทล่าสุด: ${new Date(patientData.lastUpdated).toLocaleString('th-TH')}
        </div>      </div>
    `;

    cardElement.addEventListener('click', () => {
      window.location.href = `chart.html?bed=${bedId}`;
    });
  } else {
    // เตียงว่าง
    cardElement.className = 'bed-card';
    cardElement.innerHTML = `
      <div class="bed-header">
        <div class="bed-number">
          <div class="bed-icon">🛏️</div>
          เตียง ${bedId}
        </div>
        <div class="status-indicator">
          <div class="status-dot inactive"></div>
          <div class="status-text">ว่าง</div>
        </div>
      </div>

      <div class="bed-content">
        <div class="empty-bed">
          <div class="empty-bed-icon">💤</div>
          <div class="empty-bed-title">เตียงว่าง</div>
          <div class="empty-bed-desc">พร้อมรับผู้ป่วยใหม่</div>
        </div>
      </div>
    `;

    cardElement.addEventListener('click', () => {
      // เปิด modal เพิ่มผู้ป่วยใหม่โดยเลือกเตียงนี้
      showQuickAdd(bedId);
    });
  }

  return cardElement;
}

// ฟังก์ชันอัพเดทสถิติเตียง
function updateBedsStats() {
  const activeBeds = document.getElementById('activeBeds');
  const emptyBeds = document.getElementById('emptyBeds');

  if (!activeBeds || !emptyBeds) return;

  const maxBeds = window.MAX_BEDS || 8;
  let activeCount = 0;

  for (let bedId = 1; bedId <= maxBeds; bedId++) {
    const patientData = dataManager.getPatient(bedId);
    if (patientData) {
      activeCount++;
    }
  }

  activeBeds.textContent = activeCount;
  emptyBeds.textContent = maxBeds - activeCount;
}

// ฟังก์ชัน Quick Actions
function showQuickAdd(preSelectedBed = null) {
  const modal = document.getElementById('patientModal');
  if (!modal) return;

  // เลือกเตียงล่วงหน้าถ้ามี
  if (preSelectedBed) {
    const bedSelect = document.getElementById('bedSelect');
    if (bedSelect) {
      bedSelect.value = preSelectedBed;
    }
  }

  modal.style.display = 'flex';
}

function showIOEntry() {
  const modal = document.getElementById('ioModalNew');
  if (!modal) return;

  // โหลดข้อมูลเตียงทั้งหมด
  loadBedSelectionForIO();
  modal.classList.add('show');
}

function showBedsOverview() {
  // Scroll to beds overview section
  const bedsSection = document.querySelector('.beds-overview-section');
  if (bedsSection) {
    bedsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// ฟังก์ชันสำหรับ I/O Modal
function loadBedSelectionForIO() {
  const ioBedGrid = document.getElementById('ioBedGrid');
  if (!ioBedGrid) return;

  const maxBeds = window.MAX_BEDS || 8;
  ioBedGrid.innerHTML = '';

  for (let bedId = 1; bedId <= maxBeds; bedId++) {
    const patientData = dataManager.getPatient(bedId);
    const bedCard = document.createElement('div');
    bedCard.className = `io-bed-card ${patientData ? 'occupied' : ''}`;
    bedCard.dataset.bedId = bedId;

    bedCard.innerHTML = `
      <div class="io-bed-number">เตียง ${bedId}</div>
      <div class="io-bed-status">${patientData ? 'มีผู้ป่วย' : 'ว่าง'}</div>
      ${patientData ? `<div class="io-bed-patient">${patientData.patient_id}</div>` : ''}
    `;

    bedCard.addEventListener('click', () => {
      selectBedForIO(bedId, patientData);
    });

    ioBedGrid.appendChild(bedCard);
  }
}

function selectBedForIO(bedId, patientData) {
  // Remove previous selection
  document.querySelectorAll('.io-bed-card.selected').forEach(card => {
    card.classList.remove('selected');
  });

  // Select current bed
  const selectedCard = document.querySelector(`[data-bed-id="${bedId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  // Show patient info if available
  const patientInfo = document.getElementById('ioPatientInfo');
  const patientName = document.getElementById('ioPatientName');
  const patientId = document.getElementById('ioPatientId');
  const ioForm = document.getElementById('ioForm');

  if (patientData) {
    patientInfo.style.display = 'block';
    patientName.textContent = patientData.name || patientData.patient_id;
    patientId.textContent = `รหัส: ${patientData.patient_id}`;
    ioForm.style.display = 'block';
    ioForm.dataset.selectedBed = bedId;
  } else {
    patientInfo.style.display = 'none';
    ioForm.style.display = 'none';
  }
}

// Make DashboardManager globally available
window.DashboardManager = DashboardManager;