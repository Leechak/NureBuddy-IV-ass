// rec-IO.js - ระบบบันทึก Input/Output ครบครัน
class IORecordManager {
  constructor() {
    this.currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    this.cache = new Map();
    this.observers = new Set();
    this.autoSaveEnabled = true;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCachedData();
  }

  // ===============================
  // การจัดการข้อมูล I/O
  // ===============================
  
  addIORecord(bedId, ioData) {
    const patientData = JSON.parse(localStorage.getItem(`ir_data_bed_${bedId}`) || 'null');
    
    const record = {
      id: Date.now().toString(),
      bedId: parseInt(bedId),
      patientId: patientData?.patient_id || 'ไม่ทราบ',
      patientName: patientData?.name || 'ไม่ระบุ',
      
      // Input data
      inputOral: parseFloat(ioData.inputOral) || 0,
      inputIV: parseFloat(ioData.inputIV) || 0,
      inputTube: parseFloat(ioData.inputTube) || 0,
      inputOther: parseFloat(ioData.inputOther) || 0,
      
      // Output data
      outputUrine: parseFloat(ioData.outputUrine) || 0,
      outputVomit: parseFloat(ioData.outputVomit) || 0,
      outputDrain: parseFloat(ioData.outputDrain) || 0,
      outputStool: parseFloat(ioData.outputStool) || 0,
      outputOther: parseFloat(ioData.outputOther) || 0,
      
      // Calculated totals
      totalInput: 0,
      totalOutput: 0,
      balance: 0,
      
      // Metadata
      note: ioData.note || '',
      recordedBy: this.currentUser?.fullname || 'ไม่ทราบ',
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleString('th-TH'),
      shift: this.getCurrentShift()
    };

    // คำนวณผลรวม
    record.totalInput = record.inputOral + record.inputIV + record.inputTube + record.inputOther;
    record.totalOutput = record.outputUrine + record.outputVomit + record.outputDrain + record.outputStool + record.outputOther;
    record.balance = record.totalInput - record.totalOutput;

    // บันทึกลง localStorage
    const records = this.getIORecords(bedId);
    records.unshift(record);
    
    // เก็บแค่ 100 รายการล่าสุด
    if (records.length > 100) {
      records.splice(100);
    }
    
    localStorage.setItem(`io_records_bed_${bedId}`, JSON.stringify(records));
    
    // อัปเดตสรุปรายวัน
    this.updateDailySummary(bedId);
    
    // แจ้งเตือน observers
    this.notifyObservers('record_added', { bedId, record });
    
    // บันทึกใน nurse notes
    if (typeof dataManager !== 'undefined') {
      dataManager.addNote(bedId, 
        `บันทึก I/O: Input ${record.totalInput}ml, Output ${record.totalOutput}ml, Balance ${record.balance > 0 ? '+' : ''}${record.balance}ml`,
        'io_record'
      );
    }

    return record;
  }

  getIORecords(bedId) {
    return JSON.parse(localStorage.getItem(`io_records_bed_${bedId}`) || '[]');
  }

  updateDailySummary(bedId) {
    const records = this.getIORecords(bedId);
    const today = new Date().toDateString();
    
    const todayRecords = records.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );

    const summary = {
      bedId: parseInt(bedId),
      date: today,
      totalInput: todayRecords.reduce((sum, r) => sum + r.totalInput, 0),
      totalOutput: todayRecords.reduce((sum, r) => sum + r.totalOutput, 0),
      balance: 0,
      recordsCount: todayRecords.length,
      lastUpdated: new Date().toISOString(),
      shifts: {
        morning: this.getShiftSummary(todayRecords, 'morning'),
        afternoon: this.getShiftSummary(todayRecords, 'afternoon'),
        night: this.getShiftSummary(todayRecords, 'night')
      }
    };

    summary.balance = summary.totalInput - summary.totalOutput;
    
    localStorage.setItem(`io_summary_daily_bed_${bedId}`, JSON.stringify(summary));
    return summary;
  }

  getShiftSummary(records, shift) {
    const shiftRecords = records.filter(r => r.shift === shift);
    return {
      totalInput: shiftRecords.reduce((sum, r) => sum + r.totalInput, 0),
      totalOutput: shiftRecords.reduce((sum, r) => sum + r.totalOutput, 0),
      recordsCount: shiftRecords.length
    };
  }

  getCurrentShift() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'morning';
    if (hour >= 14 && hour < 22) return 'afternoon';
    return 'night';
  }

  // ===============================
  // UI Components
  // ===============================

  createIOModal(bedId = null) {
    const patientData = bedId ? JSON.parse(localStorage.getItem(`ir_data_bed_${bedId}`) || 'null') : null;
    
    const modal = document.createElement('div');
    modal.className = 'io-modal';
    modal.id = 'ioRecordModal';
    
    modal.innerHTML = `
      <div class="io-modal-overlay" onclick="this.closest('.io-modal').remove()"></div>
      <div class="io-modal-content">
        <div class="io-modal-header">
          <div class="io-modal-title">
            <div class="io-icon">💧</div>
            <div>
              <h3>บันทึก Input/Output</h3>
              ${patientData ? `<div class="patient-info">เตียง ${bedId} - ${patientData.patient_id}</div>` : ''}
            </div>
          </div>
          <button class="io-close-btn" onclick="this.closest('.io-modal').remove()">✕</button>
        </div>

        <form id="ioRecordForm" class="io-form">
          ${!bedId ? `
            <div class="io-section">
              <label class="io-label">เลือกเตียง</label>
              <select id="io-bed-select" class="io-select" required>
                <option value="">-- เลือกเตียง --</option>
                ${this.generateBedOptions()}
              </select>
            </div>
          ` : `<input type="hidden" id="io-bed-select" value="${bedId}">`}

          <div class="io-grid">
            <!-- INPUT Section -->
            <div class="io-section input-section">
              <div class="io-section-header">
                <h4>📥 INPUT (มิลลิลิตร)</h4>
              </div>
              
              <div class="io-input-group">
                <label class="io-label">💧 น้ำดื่ม/อาหารเหลว</label>
                <input type="number" id="inputOral" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">💉 สารน้ำทางหลอดเลือด (IV)</label>
                <input type="number" id="inputIV" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">🩺 สารน้ำทาง Tube</label>
                <input type="number" id="inputTube" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">➕ อื่นๆ</label>
                <input type="number" id="inputOther" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-total">
                <div class="io-total-label">รวม INPUT:</div>
                <div class="io-total-value" id="totalInput">0 ml</div>
              </div>
            </div>

            <!-- OUTPUT Section -->
            <div class="io-section output-section">
              <div class="io-section-header">
                <h4>📤 OUTPUT (มิลลิลิตร)</h4>
              </div>
              
              <div class="io-input-group">
                <label class="io-label">🚽 ปัสสาวะ</label>
                <input type="number" id="outputUrine" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">🤮 อาเจียน</label>
                <input type="number" id="outputVomit" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">🩹 Drain</label>
                <input type="number" id="outputDrain" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">💩 อุจจาระเหลว</label>
                <input type="number" id="outputStool" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-input-group">
                <label class="io-label">➕ อื่นๆ</label>
                <input type="number" id="outputOther" class="io-input" min="0" placeholder="0">
              </div>
              
              <div class="io-total">
                <div class="io-total-label">รวม OUTPUT:</div>
                <div class="io-total-value" id="totalOutput">0 ml</div>
              </div>
            </div>
          </div>

          <!-- Balance Section -->
          <div class="io-balance-section">
            <div class="io-balance-card">
              <div class="io-balance-label">⚖️ สมดุลสารน้ำ (I/O Balance)</div>
              <div class="io-balance-value" id="ioBalance">0 ml</div>
              <div class="io-balance-status" id="balanceStatus">สมดุล</div>
            </div>
          </div>

          <!-- Note Section -->
          <div class="io-section">
            <label class="io-label">📝 หมายเหตุ</label>
            <textarea id="ioNote" class="io-textarea" rows="3" placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"></textarea>
          </div>

          <!-- Actions -->
          <div class="io-actions">
            <button type="button" class="io-btn io-btn-secondary" onclick="this.closest('.io-modal').remove()">
              ยกเลิก
            </button>
            <button type="submit" class="io-btn io-btn-primary">
              💾 บันทึก I/O
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupModalEventListeners(modal);
    
    // Focus on first input
    setTimeout(() => {
      const firstInput = modal.querySelector('.io-input');
      if (firstInput) firstInput.focus();
    }, 100);

    return modal;
  }

  generateBedOptions() {
    let options = '';
    for (let i = 1; i <= (window.MAX_BEDS || 8); i++) {
      const patientData = JSON.parse(localStorage.getItem(`ir_data_bed_${i}`) || 'null');
      if (patientData) {
        options += `<option value="${i}">เตียง ${i} - ${patientData.patient_id}</option>`;
      }
    }
    return options;
  }

  setupModalEventListeners(modal) {
    const inputs = modal.querySelectorAll('.io-input');
    const form = modal.querySelector('#ioRecordForm');

    // Auto calculate totals
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calculateTotals(modal));
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(modal);
    });

    // Keyboard shortcuts
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });
  }

  calculateTotals(modal) {
    // Input totals
    const inputOral = parseFloat(modal.querySelector('#inputOral').value) || 0;
    const inputIV = parseFloat(modal.querySelector('#inputIV').value) || 0;
    const inputTube = parseFloat(modal.querySelector('#inputTube').value) || 0;
    const inputOther = parseFloat(modal.querySelector('#inputOther').value) || 0;
    const totalInput = inputOral + inputIV + inputTube + inputOther;

    // Output totals
    const outputUrine = parseFloat(modal.querySelector('#outputUrine').value) || 0;
    const outputVomit = parseFloat(modal.querySelector('#outputVomit').value) || 0;
    const outputDrain = parseFloat(modal.querySelector('#outputDrain').value) || 0;
    const outputStool = parseFloat(modal.querySelector('#outputStool').value) || 0;
    const outputOther = parseFloat(modal.querySelector('#outputOther').value) || 0;
    const totalOutput = outputUrine + outputVomit + outputDrain + outputStool + outputOther;

    // Balance
    const balance = totalInput - totalOutput;

    // Update display
    modal.querySelector('#totalInput').textContent = `${totalInput.toLocaleString()} ml`;
    modal.querySelector('#totalOutput').textContent = `${totalOutput.toLocaleString()} ml`;
    modal.querySelector('#ioBalance').textContent = `${balance > 0 ? '+' : ''}${balance.toLocaleString()} ml`;

    // Update balance status
    const balanceStatus = modal.querySelector('#balanceStatus');
    const balanceValue = modal.querySelector('#ioBalance');
    
    if (Math.abs(balance) <= 200) {
      balanceStatus.textContent = 'สมดุลดี';
      balanceStatus.className = 'io-balance-status balanced';
      balanceValue.className = 'io-balance-value balanced';
    } else if (balance > 200) {
      balanceStatus.textContent = 'น้ำเข้ามากกว่า';
      balanceStatus.className = 'io-balance-status positive';
      balanceValue.className = 'io-balance-value positive';
    } else {
      balanceStatus.textContent = 'น้ำออกมากกว่า';
      balanceStatus.className = 'io-balance-status negative';
      balanceValue.className = 'io-balance-value negative';
    }
  }

  handleFormSubmit(modal) {
    const bedId = modal.querySelector('#io-bed-select').value;
    
    if (!bedId) {
      this.showToast('กรุณาเลือกเตียง', 'error');
      return;
    }

    const ioData = {
      inputOral: modal.querySelector('#inputOral').value,
      inputIV: modal.querySelector('#inputIV').value,
      inputTube: modal.querySelector('#inputTube').value,
      inputOther: modal.querySelector('#inputOther').value,
      outputUrine: modal.querySelector('#outputUrine').value,
      outputVomit: modal.querySelector('#outputVomit').value,
      outputDrain: modal.querySelector('#outputDrain').value,
      outputStool: modal.querySelector('#outputStool').value,
      outputOther: modal.querySelector('#outputOther').value,
      note: modal.querySelector('#ioNote').value
    };

    // Validate at least one input
    const hasInput = Object.values(ioData).some(value => 
      value && parseFloat(value) > 0
    );

    if (!hasInput) {
      this.showToast('กรุณากรอกข้อมูล Input หรือ Output อย่างน้อย 1 รายการ', 'error');
      return;
    }

    try {
      const record = this.addIORecord(bedId, ioData);
      this.showToast('✅ บันทึก I/O เรียบร้อยแล้ว', 'success');
      modal.remove();
      
      // Refresh any existing displays
      this.refreshDisplays();
      
    } catch (error) {
      console.error('Error saving I/O record:', error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  }

  // ===============================
  // Summary and Display Functions
  // ===============================

  createIOSummaryCard(bedId) {
    const summary = JSON.parse(localStorage.getItem(`io_summary_daily_bed_${bedId}`) || 'null');
    const patientData = JSON.parse(localStorage.getItem(`ir_data_bed_${bedId}`) || 'null');
    
    if (!summary && !patientData) return null;

    const totalInput = summary?.totalInput || 0;
    const totalOutput = summary?.totalOutput || 0;
    const balance = totalInput - totalOutput;
    const recordsCount = summary?.recordsCount || 0;

    const balanceClass = Math.abs(balance) <= 200 ? 'balanced' : 
                        balance > 200 ? 'positive' : 'negative';

    return `
      <div class="io-summary-card" data-bed="${bedId}">
        <div class="io-summary-header">
          <div class="io-summary-title">
            <span class="io-bed-number">🛏️ เตียง ${bedId}</span>
            ${patientData ? `<span class="io-patient-id">${patientData.patient_id}</span>` : ''}
          </div>
          <div class="io-summary-count">${recordsCount} บันทึก</div>
        </div>
        
        <div class="io-summary-grid">
          <div class="io-summary-item input">
            <div class="io-summary-icon">📥</div>
            <div class="io-summary-data">
              <div class="io-summary-value">${totalInput.toLocaleString()}</div>
              <div class="io-summary-label">INPUT (ml)</div>
            </div>
          </div>
          
          <div class="io-summary-item output">
            <div class="io-summary-icon">📤</div>
            <div class="io-summary-data">
              <div class="io-summary-value">${totalOutput.toLocaleString()}</div>
              <div class="io-summary-label">OUTPUT (ml)</div>
            </div>
          </div>
          
          <div class="io-summary-item balance ${balanceClass}">
            <div class="io-summary-icon">⚖️</div>
            <div class="io-summary-data">
              <div class="io-summary-value">${balance > 0 ? '+' : ''}${balance.toLocaleString()}</div>
              <div class="io-summary-label">BALANCE (ml)</div>
            </div>
          </div>
        </div>

        <div class="io-summary-actions">
          <button class="io-btn-small io-btn-primary" onclick="ioRecordManager.createIOModal(${bedId})">
            ➕ เพิ่ม I/O
          </button>
          <button class="io-btn-small io-btn-secondary" onclick="ioRecordManager.showDetailedReport(${bedId})">
            📊 รายละเอียด
          </button>
        </div>
      </div>
    `;
  }

  showDetailedReport(bedId) {
    const records = this.getIORecords(bedId);
    const patientData = JSON.parse(localStorage.getItem(`ir_data_bed_${bedId}`) || 'null');
    
    if (records.length === 0) {
      this.showToast('ไม่มีข้อมูล I/O สำหรับเตียงนี้', 'info');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'io-modal io-report-modal';
    modal.innerHTML = `
      <div class="io-modal-overlay" onclick="this.closest('.io-modal').remove()"></div>
      <div class="io-modal-content io-report-content">
        <div class="io-modal-header">
          <div class="io-modal-title">
            <div class="io-icon">📊</div>
            <div>
              <h3>รายงาน I/O เตียง ${bedId}</h3>
              ${patientData ? `<div class="patient-info">${patientData.patient_id} - ${patientData.name || 'ไม่ระบุชื่อ'}</div>` : ''}
            </div>
          </div>
          <button class="io-close-btn" onclick="this.closest('.io-modal').remove()">✕</button>
        </div>

        <div class="io-report-filters">
          <select id="reportPeriod" class="io-select">
            <option value="today">วันนี้</option>
            <option value="3days">3 วันล่าสุด</option>
            <option value="week">7 วันล่าสุด</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <button class="io-btn io-btn-secondary" onclick="ioRecordManager.exportIOReport(${bedId})">
            📄 ส่งออกรายงาน
          </button>
        </div>

        <div class="io-report-summary">
          ${this.generateReportSummary(records)}
        </div>

        <div class="io-report-records">
          <h4>รายการบันทึก</h4>
          <div class="io-records-list" id="recordsList">
            ${this.generateRecordsList(records)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  generateReportSummary(records) {
    const totalInput = records.reduce((sum, r) => sum + r.totalInput, 0);
    const totalOutput = records.reduce((sum, r) => sum + r.totalOutput, 0);
    const balance = totalInput - totalOutput;

    return `
      <div class="io-report-summary-grid">
        <div class="io-summary-card-large input">
          <div class="io-summary-icon-large">📥</div>
          <div class="io-summary-value-large">${totalInput.toLocaleString()}</div>
          <div class="io-summary-label-large">INPUT รวม (ml)</div>
        </div>
        <div class="io-summary-card-large output">
          <div class="io-summary-icon-large">📤</div>
          <div class="io-summary-value-large">${totalOutput.toLocaleString()}</div>
          <div class="io-summary-label-large">OUTPUT รวม (ml)</div>
        </div>
        <div class="io-summary-card-large balance ${Math.abs(balance) <= 200 ? 'balanced' : balance > 0 ? 'positive' : 'negative'}">
          <div class="io-summary-icon-large">⚖️</div>
          <div class="io-summary-value-large">${balance > 0 ? '+' : ''}${balance.toLocaleString()}</div>
          <div class="io-summary-label-large">BALANCE (ml)</div>
        </div>
      </div>
    `;
  }

  generateRecordsList(records) {
    return records.map(record => `
      <div class="io-record-item">
        <div class="io-record-header">
          <div class="io-record-time">${record.time}</div>
          <div class="io-record-shift shift-${record.shift}">${this.getShiftName(record.shift)}</div>
        </div>
        <div class="io-record-data">
          <div class="io-record-input">
            <span class="io-record-label">INPUT:</span>
            <span class="io-record-value">${record.totalInput} ml</span>
          </div>
          <div class="io-record-output">
            <span class="io-record-label">OUTPUT:</span>
            <span class="io-record-value">${record.totalOutput} ml</span>
          </div>
          <div class="io-record-balance ${Math.abs(record.balance) <= 50 ? 'balanced' : record.balance > 0 ? 'positive' : 'negative'}">
            <span class="io-record-label">BALANCE:</span>
            <span class="io-record-value">${record.balance > 0 ? '+' : ''}${record.balance} ml</span>
          </div>
        </div>
        ${record.note ? `<div class="io-record-note">📝 ${record.note}</div>` : ''}
        <div class="io-record-meta">บันทึกโดย: ${record.recordedBy}</div>
      </div>
    `).join('');
  }

  getShiftName(shift) {
    const names = {
      'morning': 'เช้า',
      'afternoon': 'บ่าย', 
      'night': 'กลางคืน'
    };
    return names[shift] || shift;
  }

  // ===============================
  // Utility Functions
  // ===============================

  setupEventListeners() {
    // Auto-refresh when data changes
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('io_records_bed_')) {
        this.refreshDisplays();
      }
    });
  }

  loadCachedData() {
    // Load any cached preferences or settings
    const settings = JSON.parse(localStorage.getItem('io_settings') || '{}');
    this.autoSaveEnabled = settings.autoSaveEnabled !== false;
  }

  refreshDisplays() {
    // Refresh any existing I/O displays on the page
    const displays = document.querySelectorAll('[data-io-display]');
    displays.forEach(display => {
      const bedId = display.dataset.bed;
      if (bedId) {
        // Refresh the display content
        const newContent = this.createIOSummaryCard(bedId);
        if (newContent) {
          display.innerHTML = newContent;
        }
      }
    });

    // Notify observers
    this.notifyObservers('displays_refreshed', {});
  }

  subscribe(callback) {
    this.observers.add(callback);
  }

  unsubscribe(callback) {
    this.observers.delete(callback);
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in I/O observer:', error);
      }
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `io-toast io-toast-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="io-toast-icon">${icons[type] || icons.info}</div>
      <div class="io-toast-message">${message}</div>
    `;

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 300px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // Set colors based on type
    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#0ea5e9'
    };
    
    toast.style.background = colors[type] || colors.info;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  exportIOReport(bedId) {
    const records = this.getIORecords(bedId);
    const patientData = JSON.parse(localStorage.getItem(`ir_data_bed_${bedId}`) || 'null');
    
    let report = `รายงาน Input/Output - เตียง ${bedId}\n`;
    report += `วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
    report += `เวลา: ${new Date().toLocaleTimeString('th-TH')}\n`;
    if (patientData) {
      report += `ผู้ป่วย: ${patientData.patient_id} - ${patientData.name || 'ไม่ระบุชื่อ'}\n`;
    }
    report += `จำนวนบันทึก: ${records.length} รายการ\n\n`;

    // Summary
    const totalInput = records.reduce((sum, r) => sum + r.totalInput, 0);
    const totalOutput = records.reduce((sum, r) => sum + r.totalOutput, 0);
    const balance = totalInput - totalOutput;

    report += `=== สรุปภาพรวม ===\n`;
    report += `INPUT รวม: ${totalInput.toLocaleString()} ml\n`;
    report += `OUTPUT รวม: ${totalOutput.toLocaleString()} ml\n`;
    report += `BALANCE: ${balance > 0 ? '+' : ''}${balance.toLocaleString()} ml\n\n`;

    // Detailed records
    report += `=== รายละเอียดบันทึก ===\n`;
    records.forEach((record, index) => {
      report += `${index + 1}. ${record.time} (${this.getShiftName(record.shift)})\n`;
      report += `   INPUT: ${record.totalInput} ml (ดื่ม:${record.inputOral} IV:${record.inputIV} Tube:${record.inputTube} อื่น:${record.inputOther})\n`;
      report += `   OUTPUT: ${record.totalOutput} ml (ปัสสาวะ:${record.outputUrine} อาเจียน:${record.outputVomit} Drain:${record.outputDrain} อุจจาระ:${record.outputStool} อื่น:${record.outputOther})\n`;
      report += `   BALANCE: ${record.balance > 0 ? '+' : ''}${record.balance} ml\n`;
      if (record.note) report += `   หมายเหตุ: ${record.note}\n`;
      report += `   บันทึกโดย: ${record.recordedBy}\n\n`;
    });

    // Download file
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `IO_Report_Bed${bedId}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    this.showToast('📄 ส่งออกรายงานเรียบร้อย', 'success');
  }
}

// CSS Styles for I/O System
const ioStyles = `
<style>
.io-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.io-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.io-modal-content {
  position: relative;
  background: white;
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 75px rgba(0, 0, 0, 0.3);
}

.io-report-content {
  max-width: 1000px;
}

.io-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25px 30px;
  border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 20px 20px 0 0;
}

.io-modal-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.io-icon {
  font-size: 28px;
  padding: 12px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.io-modal-title h3 {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 700;
}

.patient-info {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.io-close-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.io-close-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.io-form {
  padding: 30px;
}

.io-section {
  margin-bottom: 25px;
}

.io-section-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
}

.io-section-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
}

.io-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.input-section {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  padding: 25px;
  border-radius: 15px;
  border: 2px solid #22c55e;
}

.output-section {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  padding: 25px;
  border-radius: 15px;
  border: 2px solid #ef4444;
}

.io-input-group {
  margin-bottom: 20px;
}

.io-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.io-input, .io-select, .io-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

.io-input:focus, .io-select:focus, .io-textarea:focus {
  border-color: #0ea5e9;
  outline: none;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.io-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  margin-top: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.io-total-label {
  font-weight: 700;
  color: #1e293b;
}

.io-total-value {
  font-size: 18px;
  font-weight: 800;
  color: #0ea5e9;
}

.io-balance-section {
  margin: 30px 0;
}

.io-balance-card {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 25px;
  border-radius: 15px;
  border: 3px solid #e2e8f0;
  text-align: center;
}

.io-balance-label {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.io-balance-value {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.io-balance-value.balanced {
  color: #22c55e;
}

.io-balance-value.positive {
  color: #0ea5e9;
}

.io-balance-value.negative {
  color: #ef4444;
}

.io-balance-status {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  display: inline-block;
}

.io-balance-status.balanced {
  background: #22c55e;
  color: white;
}

.io-balance-status.positive {
  background: #0ea5e9;
  color: white;
}

.io-balance-status.negative {
  background: #ef4444;
  color: white;
}

.io-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.io-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.io-btn-primary {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
}

.io-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
}

.io-btn-secondary {
  background: linear-gradient(135deg, #64748b, #475569);
  color: white;
  box-shadow: 0 6px 20px rgba(100, 116, 139, 0.3);
}

.io-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 116, 139, 0.4);
}

.io-btn-small {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Summary Cards */
.io-summary-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.io-summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #0ea5e9;
}

.io-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f5f9;
}

.io-summary-title {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.io-bed-number {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.io-patient-id {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.io-summary-count {
  background: #0ea5e9;
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.io-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.io-summary-item {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.io-summary-item.input {
  border-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.io-summary-item.output {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.io-summary-item.balance.balanced {
  border-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.io-summary-item.balance.positive {
  border-color: #0ea5e9;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
}

.io-summary-item.balance.negative {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.io-summary-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
}

.io-summary-data {
  flex: 1;
}

.io-summary-value {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 2px;
}

.io-summary-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.io-summary-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Report Styles */
.io-report-filters {
  padding: 20px 30px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 15px;
  align-items: center;
}

.io-report-summary {
  padding: 30px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
}

.io-report-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.io-summary-card-large {
  background: white;
  padding: 25px;
  border-radius: 15px;
  text-align: center;
  border: 3px solid;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.io-summary-card-large.input {
  border-color: #22c55e;
}

.io-summary-card-large.output {
  border-color: #ef4444;
}

.io-summary-card-large.balance.balanced {
  border-color: #22c55e;
}

.io-summary-card-large.balance.positive {
  border-color: #0ea5e9;
}

.io-summary-card-large.balance.negative {
  border-color: #ef4444;
}

.io-summary-icon-large {
  font-size: 36px;
  margin-bottom: 15px;
}

.io-summary-value-large {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 8px;
}

.io-summary-label-large {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.io-report-records {
  padding: 30px;
}

.io-report-records h4 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 700;
}

.io-records-list {
  max-height: 400px;
  overflow-y: auto;
}

.io-record-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.io-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.io-record-time {
  font-weight: 600;
  color: #1e293b;
}

.io-record-shift {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.shift-morning {
  background: #fef3c7;
  color: #92400e;
}

.shift-afternoon {
  background: #ddd6fe;
  color: #6b46c1;
}

.shift-night {
  background: #e0e7ff;
  color: #3730a3;
}

.io-record-data {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.io-record-input,
.io-record-output,
.io-record-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.io-record-balance.balanced {
  background: #f0fdf4;
  color: #166534;
}

.io-record-balance.positive {
  background: #f0f9ff;
  color: #1e40af;
}

.io-record-balance.negative {
  background: #fef2f2;
  color: #991b1b;
}

.io-record-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.io-record-value {
  font-weight: 700;
  color: #1e293b;
}

.io-record-note {
  background: #fffbeb;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #92400e;
  border-left: 4px solid #f59e0b;
}

.io-record-meta {
  font-size: 12px;
  color: #64748b;
  text-align: right;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .io-modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .io-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .io-summary-grid,
  .io-report-summary-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .io-record-data {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .io-actions {
    flex-direction: column;
  }
  
  .io-btn {
    width: 100%;
  }
}
</style>
`;

// Initialize the I/O Record Manager
let ioRecordManager;
if (typeof window !== 'undefined' && !window.ioRecordManager) {
  ioRecordManager = new IORecordManager();
  window.ioRecordManager = ioRecordManager;

  // Insert CSS styles only once
  if (!document.getElementById('io-record-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'io-record-styles';
    styleElement.textContent = ioStyles.replace('<style>', '').replace('</style>', '');
    document.head.appendChild(styleElement);
  }
} else if (typeof window !== 'undefined') {
  ioRecordManager = window.ioRecordManager;
} else {
  ioRecordManager = new IORecordManager();
}

// Export สำหรับ ES modules
export { IORecordManager, ioRecordManager };

// Fallback สำหรับ CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IORecordManager, ioRecordManager };
}