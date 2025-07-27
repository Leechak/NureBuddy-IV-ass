
// NurseBuddy Mockup System - Popup Version
(function() {
  'use strict';

  // ตรวจสอบว่าโหลดแล้วหรือยัง
  if (window.MockupSystem) {
    return;
  }

  let mockFlowInterval = null;
  let mockAlertCount = 0;
  let mockDataCount = 0;

  const MockupSystem = {
    openPopup: function() {
      if (!this.checkMockupAccess()) {
        alert('⚠️ คุณไม่มีสิทธิ์เข้าใช้งานระบบ Mock-up\nกรุณาล็อกอินด้วยรหัส 9999');
        return;
      }
      this.createPopup();
      this.showPopup();
    },

    createPopup: function() {
      if (document.getElementById('mockupPopup')) {
        return;
      }

      const popup = document.createElement('div');
      popup.id = 'mockupPopup';
      popup.innerHTML = `
        <div class="mockup-overlay" onclick="MockupSystem.closePopup()"></div>
        <div class="mockup-popup-content">
          <div class="mockup-header">
            <h1>🎭 ระบบจำลองข้อมูลน้ำเกลือ</h1>
            <p>Mock-up System สำหรับทดสอบและจำลองข้อมูล NurseBuddy</p>
            <button class="mockup-close-btn" onclick="MockupSystem.closePopup()">×</button>
          </div>

          <div class="mockup-grid">
            <!-- IV Flow Simulator -->
            <div class="mockup-card">
              <div class="card-header">
                <div class="card-icon">💧</div>
                <div class="card-title">จำลองการไหลน้ำเกลือ</div>
              </div>
              
              <div class="mockup-controls">
                <div class="control-group">
                  <label class="control-label">เลือกเตียง</label>
                  <select class="control-input" id="mockBedSelect">
                    <option value="1">เตียง 1</option>
                    <option value="2">เตียง 2</option>
                    <option value="3">เตียง 3</option>
                    <option value="4">เตียง 4</option>
                    <option value="5">เตียง 5</option>
                    <option value="6">เตียง 6</option>
                    <option value="7">เตียง 7</option>
                    <option value="8">เตียง 8</option>
                  </select>
                </div>

                <div class="control-group">
                  <label class="control-label">อัตราการไหล (ดรอป/นาที)</label>
                  <input type="number" class="control-input" id="mockFlowRate" value="20" min="0" max="100">
                </div>

                <div class="control-group">
                  <label class="control-label">ปริมาณคงเหลือ (mL)</label>
                  <input type="number" class="control-input" id="mockVolume" value="500" min="0" max="1000">
                </div>

                <div class="control-buttons">
                  <button class="control-btn primary" onclick="MockupSystem.startMockFlow()">
                    🚀 เริ่มจำลอง
                  </button>
                  <button class="control-btn warning" onclick="MockupSystem.pauseMockFlow()">
                    ⏸️ หยุดชั่วคราว
                  </button>
                  <button class="control-btn secondary" onclick="MockupSystem.stopMockFlow()">
                    ⏹️ หยุด
                  </button>
                </div>
              </div>

              <div class="mock-display" id="flowDisplay">
                <div style="text-align: center; color: #64748b;">
                  <span class="status-indicator status-active"></span>
                  <strong>พร้อมจำลองข้อมูล</strong>
                </div>
                
                <div class="mock-data" id="flowData" style="display: none;">
                  <div class="data-item">
                    <div class="data-label">อัตราปัจจุบัน</div>
                    <div class="data-value" id="currentRate">20</div>
                    <div class="data-unit">ดรอป/นาที</div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">ปริมาณคงเหลือ</div>
                    <div class="data-value" id="remainingVolume">500</div>
                    <div class="data-unit">mL</div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">เวลาที่เหลือ</div>
                    <div class="data-value" id="timeRemaining">--</div>
                    <div class="data-unit">ชั่วโมง</div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">สถานะ</div>
                    <div class="data-value" id="flowStatus">ปกติ</div>
                    <div class="data-unit">--</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Patient Data Generator -->
            <div class="mockup-card">
              <div class="card-header">
                <div class="card-icon">👤</div>
                <div class="card-title">สร้างข้อมูลผู้ป่วย</div>
              </div>
              
              <div class="mockup-controls">
                <div class="control-buttons">
                  <button class="control-btn success" onclick="MockupSystem.generateRandomPatient()">
                    🎲 สร้างผู้ป่วยสุ่ม
                  </button>
                  <button class="control-btn primary" onclick="MockupSystem.generateVitalSigns()">
                    💓 สร้าง Vital Signs
                  </button>
                  <button class="control-btn warning" onclick="MockupSystem.generateIOData()">
                    📊 สร้างข้อมูล I/O
                  </button>
                </div>
              </div>

              <div class="mock-display" id="patientDisplay">
                <div style="text-align: center; color: #64748b;">
                  <strong>กดปุ่มเพื่อสร้างข้อมูลจำลอง</strong>
                </div>
              </div>
            </div>

            <!-- Alert Simulator -->
            <div class="mockup-card">
              <div class="card-header">
                <div class="card-icon">🚨</div>
                <div class="card-title">จำลองการแจ้งเตือน</div>
              </div>
              
              <div class="mockup-controls">
                <div class="control-group">
                  <label class="control-label">ประเภทการแจ้งเตือน</label>
                  <select class="control-input" id="alertType">
                    <option value="normal">ปกติ</option>
                    <option value="warning">เตือน</option>
                    <option value="critical">ฉุกเฉิน</option>
                  </select>
                </div>

                <div class="control-buttons">
                  <button class="control-btn success" onclick="MockupSystem.triggerMockAlert('normal')">
                    💚 แจ้งเตือนปกติ
                  </button>
                  <button class="control-btn warning" onclick="MockupSystem.triggerMockAlert('warning')">
                    💛 แจ้งเตือนเตือน
                  </button>
                  <button class="control-btn primary" onclick="MockupSystem.triggerMockAlert('critical')" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    ❤️ แจ้งเตือนฉุกเฉิน
                  </button>
                </div>
              </div>

              <div class="mock-display" id="alertDisplay">
                <div id="alertLog" style="max-height: 200px; overflow-y: auto;">
                  <div style="text-align: center; color: #64748b;">
                    <strong>ยังไม่มีการแจ้งเตือน</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- System Control -->
            <div class="mockup-card">
              <div class="card-header">
                <div class="card-icon">⚙️</div>
                <div class="card-title">ควบคุมระบบ</div>
              </div>
              
              <div class="mockup-controls">
                <div class="control-buttons">
                  <button class="control-btn success" onclick="MockupSystem.saveAllMockData()">
                    💾 บันทึกข้อมูลจำลอง
                  </button>
                  <button class="control-btn warning" onclick="MockupSystem.clearAllMockData()">
                    🗑️ ล้างข้อมูลทั้งหมด
                  </button>
                  <button class="control-btn secondary" onclick="MockupSystem.exportMockData()">
                    📤 Export ข้อมูล
                  </button>
                  <button class="control-btn primary" onclick="window.location.href='dashboard.html'">
                    📊 ไป Dashboard
                  </button>
                </div>
              </div>

              <div class="mock-display">
                <div class="mock-data">
                  <div class="data-item">
                    <div class="data-label">เตียงที่ใช้งาน</div>
                    <div class="data-value" id="activeBeds">0</div>
                    <div class="data-unit">เตียง</div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">การแจ้งเตือน</div>
                    <div class="data-value" id="totalAlerts">0</div>
                    <div class="data-unit">รายการ</div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">ข้อมูลจำลอง</div>
                    <div class="data-value" id="mockDataCount">0</div>
                    <div class="data-unit">รายการ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(popup);
      this.addStyles();
    },

    addStyles: function() {
      if (document.getElementById('mockupStyles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'mockupStyles';
      style.textContent = `
        #mockupPopup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          display: none;
          animation: fadeIn 0.3s ease-out;
        }

        .mockup-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
        }

        .mockup-popup-content {
          position: relative;
          width: 95%;
          max-width: 1200px;
          height: 90%;
          margin: 2.5% auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        .mockup-header {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          padding: 25px 30px;
          border-radius: 25px 25px 0 0;
          text-align: center;
          position: relative;
          border: none;
        }

        .mockup-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .mockup-header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }

        .mockup-close-btn {
          position: absolute;
          top: 20px;
          right: 25px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mockup-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .mockup-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          padding: 30px;
        }

        .mockup-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .mockup-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
        }

        .card-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .mockup-controls {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .control-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .control-input:focus {
          border-color: #8b5cf6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .control-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .control-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          flex: 1;
          min-width: 120px;
        }

        .control-btn.primary {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
        }

        .control-btn.secondary {
          background: linear-gradient(135deg, #64748b, #475569);
          color: white;
        }

        .control-btn.success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .control-btn.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .control-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mock-display {
          background: #f8fafc;
          border-radius: 10px;
          padding: 20px;
          margin-top: 15px;
          border: 2px dashed #cbd5e1;
        }

        .mock-data {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .data-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }

        .data-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .data-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .data-unit {
          font-size: 12px;
          color: #8b5cf6;
          font-weight: 600;
        }

        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }

        .status-active {
          background: #10b981;
        }

        .status-warning {
          background: #f59e0b;
        }

        .status-critical {
          background: #ef4444;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(50px) scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .mockup-popup-content {
            width: 98%;
            height: 95%;
            margin: 1% auto;
          }
          
          .mockup-grid {
            grid-template-columns: 1fr;
            padding: 20px;
          }
          
          .control-buttons {
            flex-direction: column;
          }
          
          .control-btn {
            min-width: auto;
          }
        }
      `;

      document.head.appendChild(style);
    },

    showPopup: function() {
      const popup = document.getElementById('mockupPopup');
      if (popup) {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.updateSystemStats();
      }
    },

    closePopup: function() {
      const popup = document.getElementById('mockupPopup');
      if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.stopMockFlow();
      }
    },

    checkMockupAccess: function() {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
      if (!currentUser || currentUser.role !== 'mockup') {
        // สำหรับ popup ไม่ต้องแสดง alert เมื่อไม่มีสิทธิ์
        console.warn('Access denied: mockup role required');
        return false;
      }
      return true;
    },

    startMockFlow: function() {
      if (!this.checkMockupAccess()) return;

      const bedId = document.getElementById('mockBedSelect').value;
      const flowRate = parseInt(document.getElementById('mockFlowRate').value);
      const volume = parseInt(document.getElementById('mockVolume').value);

      if (mockFlowInterval) {
        clearInterval(mockFlowInterval);
      }

      document.getElementById('flowData').style.display = 'grid';
      let currentVolume = volume;
      let currentFlow = flowRate;

      mockFlowInterval = setInterval(() => {
        const variance = (Math.random() - 0.5) * 4;
        currentFlow = Math.max(0, flowRate + variance);
        
        const volumeDecrease = currentFlow * 60 / 20 / 60;
        currentVolume = Math.max(0, currentVolume - volumeDecrease);

        document.getElementById('currentRate').textContent = currentFlow.toFixed(1);
        document.getElementById('remainingVolume').textContent = Math.round(currentVolume);
        
        if (currentFlow > 0) {
          const timeRemaining = currentVolume / (currentFlow * 60 / 20 / 60);
          const hours = Math.floor(timeRemaining / 3600);
          const minutes = Math.floor((timeRemaining % 3600) / 60);
          document.getElementById('timeRemaining').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        }

        let status = 'ปกติ';
        
        if (Math.abs(currentFlow - flowRate) > 3) {
          status = 'ผิดปกติ';
        }
        
        if (currentVolume < 50) {
          status = 'ใกล้หมด';
        }

        if (currentVolume <= 0) {
          status = 'หมดแล้ว';
          this.stopMockFlow();
        }

        document.getElementById('flowStatus').textContent = status;

        const mockData = {
          bedId: bedId,
          currentFlow: currentFlow,
          remainingVolume: currentVolume,
          status: status,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(`mock_flow_bed_${bedId}`, JSON.stringify(mockData));
      }, 1000);

      this.updateSystemStats();
    },

    pauseMockFlow: function() {
      if (mockFlowInterval) {
        clearInterval(mockFlowInterval);
        mockFlowInterval = null;
      }
    },

    stopMockFlow: function() {
      if (mockFlowInterval) {
        clearInterval(mockFlowInterval);
        mockFlowInterval = null;
      }
      
      const flowData = document.getElementById('flowData');
      if (flowData) {
        flowData.style.display = 'none';
      }
      
      const flowDisplay = document.getElementById('flowDisplay');
      if (flowDisplay) {
        flowDisplay.innerHTML = `
          <div style="text-align: center; color: #64748b;">
            <span class="status-indicator status-active"></span>
            <strong>หยุดการจำลองแล้ว</strong>
          </div>
        `;
      }
    },

    generateRandomPatient: function() {
      if (!this.checkMockupAccess()) return;

      const names = ['สมชาย ใจดี', 'สมหญิง สวยงาม', 'นายหนึ่ง ดีมาก', 'นางสอง งามดี', 'คุณสาม ยอดเยี่ยม'];
      const medications = ['Normal Saline', 'Ringer Lactate', 'Dextrose 5%', 'Dextrose 10%'];
      const volumes = [250, 500, 1000];
      
      const patientData = {
        patient_id: names[Math.floor(Math.random() * names.length)],
        medication: medications[Math.floor(Math.random() * medications.length)],
        volume: volumes[Math.floor(Math.random() * volumes.length)],
        rate: Math.floor(Math.random() * 50) + 10,
        timestamp: new Date().toISOString()
      };

      const bedId = document.getElementById('mockBedSelect').value;
      
      // บันทึกข้อมูลด้วย dataManager ถ้ามี
      if (window.dataManager) {
        window.dataManager.savePatient(bedId, patientData);
      }

      document.getElementById('patientDisplay').innerHTML = `
        <div class="mock-data">
          <div class="data-item">
            <div class="data-label">ชื่อผู้ป่วย</div>
            <div class="data-value" style="font-size: 16px;">${patientData.patient_id}</div>
          </div>
          <div class="data-item">
            <div class="data-label">ยา</div>
            <div class="data-value" style="font-size: 14px;">${patientData.medication}</div>
          </div>
          <div class="data-item">
            <div class="data-label">ปริมาณ</div>
            <div class="data-value">${patientData.volume}</div>
            <div class="data-unit">mL</div>
          </div>
          <div class="data-item">
            <div class="data-label">อัตรา</div>
            <div class="data-value">${patientData.rate}</div>
            <div class="data-unit">ดรอป/นาที</div>
          </div>
        </div>
      `;

      mockDataCount++;
      this.updateSystemStats();
    },

    generateVitalSigns: function() {
      if (!this.checkMockupAccess()) return;

      const vitalsData = {
        systolic: Math.floor(Math.random() * 40) + 100,
        diastolic: Math.floor(Math.random() * 20) + 60,
        heartRate: Math.floor(Math.random() * 40) + 60,
        temperature: (Math.random() * 2 + 36).toFixed(1),
        oxygen: Math.floor(Math.random() * 5) + 95,
        timestamp: new Date().toISOString()
      };

      const bedId = document.getElementById('mockBedSelect').value;
      
      if (window.dataManager) {
        window.dataManager.saveVitals(bedId, vitalsData);
      }

      document.getElementById('patientDisplay').innerHTML = `
        <div class="mock-data">
          <div class="data-item">
            <div class="data-label">BP</div>
            <div class="data-value" style="font-size: 16px;">${vitalsData.systolic}/${vitalsData.diastolic}</div>
          </div>
          <div class="data-item">
            <div class="data-label">HR</div>
            <div class="data-value">${vitalsData.heartRate}</div>
            <div class="data-unit">bpm</div>
          </div>
          <div class="data-item">
            <div class="data-label">Temp</div>
            <div class="data-value">${vitalsData.temperature}</div>
            <div class="data-unit">°C</div>
          </div>
          <div class="data-item">
            <div class="data-label">O2 Sat</div>
            <div class="data-value">${vitalsData.oxygen}</div>
            <div class="data-unit">%</div>
          </div>
        </div>
      `;

      mockDataCount++;
      this.updateSystemStats();
    },

    generateIOData: function() {
      if (!this.checkMockupAccess()) return;

      const ioData = {
        totalIn: Math.floor(Math.random() * 1000) + 500,
        totalOut: Math.floor(Math.random() * 800) + 400,
        balance: 0,
        timestamp: new Date().toISOString()
      };

      ioData.balance = ioData.totalIn - ioData.totalOut;

      const bedId = document.getElementById('mockBedSelect').value;
      
      if (window.dataManager) {
        window.dataManager.saveIORecord(bedId, ioData);
      }

      document.getElementById('patientDisplay').innerHTML = `
        <div class="mock-data">
          <div class="data-item">
            <div class="data-label">Input</div>
            <div class="data-value">${ioData.totalIn}</div>
            <div class="data-unit">mL</div>
          </div>
          <div class="data-item">
            <div class="data-label">Output</div>
            <div class="data-value">${ioData.totalOut}</div>
            <div class="data-unit">mL</div>
          </div>
          <div class="data-item">
            <div class="data-label">Balance</div>
            <div class="data-value" style="color: ${ioData.balance >= 0 ? '#10b981' : '#ef4444'}">
              ${ioData.balance > 0 ? '+' : ''}${ioData.balance}
            </div>
            <div class="data-unit">mL</div>
          </div>
        </div>
      `;

      mockDataCount++;
      this.updateSystemStats();
    },

    triggerMockAlert: function(type) {
      if (!this.checkMockupAccess()) return;

      const alertMessages = {
        normal: ['ตรวจสอบน้ำเกลือเตียง', 'ปรับอัตราการไหล', 'บันทึกข้อมูล Vital Signs'],
        warning: ['อัตราการไหลผิดปกติ', 'ปริมาณน้ำเกลือเหลือน้อย', 'ตรวจสอบสายยาง'],
        critical: ['น้ำเกลือหมด - เปลี่ยนทันที!', 'อัตราการไหลหยุด!', 'ระบบเตือนฉุกเฉิน!']
      };

      const colors = {
        normal: '#10b981',
        warning: '#f59e0b',
        critical: '#ef4444'
      };

      const message = alertMessages[type][Math.floor(Math.random() * alertMessages[type].length)];
      const bedId = document.getElementById('mockBedSelect').value;

      const alertData = {
        id: Date.now().toString(),
        type: type,
        message: message,
        bedId: bedId,
        timestamp: new Date().toLocaleString('th-TH')
      };

      if (window.dataManager) {
        window.dataManager.saveAlert(bedId, alertData);
      }

      const alertLog = document.getElementById('alertLog');
      if (mockAlertCount === 0) {
        alertLog.innerHTML = '';
      }

      const alertElement = document.createElement('div');
      alertElement.style.cssText = `
        padding: 10px;
        margin: 5px 0;
        border-radius: 8px;
        border-left: 4px solid ${colors[type]};
        background: ${colors[type]}15;
        font-size: 14px;
      `;
      
      alertElement.innerHTML = `
        <div style="font-weight: 600; color: ${colors[type]};">
          ${type.toUpperCase()} - เตียง ${bedId}
        </div>
        <div style="color: #374151; margin-top: 5px;">${message}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 5px;">${alertData.timestamp}</div>
      `;

      alertLog.insertBefore(alertElement, alertLog.firstChild);

      mockAlertCount++;
      this.updateSystemStats();

      if (alertLog.children.length > 5) {
        alertLog.removeChild(alertLog.lastChild);
      }
    },

    updateSystemStats: function() {
      let activeBeds = 0;
      if (window.dataManager) {
        for (let i = 1; i <= 8; i++) {
          if (window.dataManager.getPatient(i)) {
            activeBeds++;
          }
        }
      }

      const activeBedsEl = document.getElementById('activeBeds');
      const totalAlertsEl = document.getElementById('totalAlerts');
      const mockDataCountEl = document.getElementById('mockDataCount');

      if (activeBedsEl) activeBedsEl.textContent = activeBeds;
      if (totalAlertsEl) totalAlertsEl.textContent = mockAlertCount;
      if (mockDataCountEl) mockDataCountEl.textContent = mockDataCount;
    },

    saveAllMockData: function() {
      const mockSummary = {
        activeBeds: parseInt(document.getElementById('activeBeds').textContent || '0'),
        totalAlerts: mockAlertCount,
        mockDataCount: mockDataCount,
        timestamp: new Date().toISOString(),
        savedBy: 'Mock-up System'
      };

      localStorage.setItem('mock_summary', JSON.stringify(mockSummary));
      alert('✅ บันทึกข้อมูลจำลองทั้งหมดเรียบร้อยแล้ว');
    },

    clearAllMockData: function() {
      if (confirm('⚠️ คุณต้องการล้างข้อมูลจำลองทั้งหมดหรือไม่?')) {
        this.stopMockFlow();
        
        if (window.dataManager) {
          for (let i = 1; i <= 8; i++) {
            window.dataManager.clearBedData(i);
            localStorage.removeItem(`mock_flow_bed_${i}`);
          }
        }

        localStorage.removeItem('mock_summary');
        
        mockAlertCount = 0;
        mockDataCount = 0;
        
        const alertLog = document.getElementById('alertLog');
        if (alertLog) {
          alertLog.innerHTML = `
            <div style="text-align: center; color: #64748b;">
              <strong>ล้างข้อมูลแล้ว</strong>
            </div>
          `;
        }
        
        const patientDisplay = document.getElementById('patientDisplay');
        if (patientDisplay) {
          patientDisplay.innerHTML = `
            <div style="text-align: center; color: #64748b;">
              <strong>กดปุ่มเพื่อสร้างข้อมูลจำลอง</strong>
            </div>
          `;
        }

        this.updateSystemStats();
        alert('✅ ล้างข้อมูลจำลองทั้งหมดเรียบร้อยแล้ว');
      }
    },

    exportMockData: function() {
      const exportData = {
        summary: JSON.parse(localStorage.getItem('mock_summary') || '{}'),
        bedData: {},
        alerts: mockAlertCount,
        exportedAt: new Date().toISOString()
      };

      if (window.dataManager) {
        for (let i = 1; i <= 8; i++) {
          exportData.bedData[`bed_${i}`] = window.dataManager.exportBedData ? window.dataManager.exportBedData(i) : null;
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nursebuddy_mockup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      alert('📤 Export ข้อมูลจำลองเรียบร้อยแล้ว');
    }
  };

  // เปิดเผยระบบให้กับ window
  window.MockupSystem = MockupSystem;

  // เพิ่ม event listener สำหรับปิด popup ด้วย ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('mockupPopup').style.display === 'block') {
      MockupSystem.closePopup();
    }
  });

})();
