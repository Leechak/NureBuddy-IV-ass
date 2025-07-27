// Global patient modal for dashboard and chart pages
(function(){
  if (typeof document === 'undefined') return;

  // create modal HTML if not present
  if (!document.getElementById('globalPatientModal')) {
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal" id="globalPatientModal">
        <div class="modal-content patient-modal">
          <div class="modal-header">
            <div class="modal-title">
              <span class="title-icon">👩‍⚕️</span>
              <span>ข้อมูลผู้ป่วย</span>
            </div>
            <button class="close-btn" onclick="closePatientModal()">×</button>
          </div>

          <!-- Bed Selection Grid -->
          <div class="modal-section bed-selection-section">
            <div class="section-title">
              <span class="section-icon">🏥</span>
              <span>เลือกเตียง</span>
            </div>
            <div class="bed-grid" id="bedGrid">
              <!-- Beds will be generated here -->
            </div>
          </div>

          <!-- Patient Info Section -->
          <div class="modal-section patient-info-section">
            <div class="section-title">
              <span class="section-icon">👤</span>
              <span>ข้อมูลผู้ป่วย</span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">🆔</span>
                  รหัสผู้ป่วย (ไม่บังคับ)
                </label>
                <input type="text" id="globalPatientId" class="form-input" placeholder="เช่น P001234">
              </div>

              <div class="form-group full-width">
                <label class="form-label required">
                  <span class="label-icon">📝</span>
                  ชื่อ-สกุล
                </label>
                <input type="text" id="globalPatientName" class="form-input" placeholder="กรอกชื่อ-สกุลผู้ป่วย" required>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">🎂</span>
                  อายุ
                </label>
                <input type="number" id="globalAge" class="form-input" placeholder="25" min="0" max="150">
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">⚖️</span>
                  น้ำหนัก (กก.)
                </label>
                <input type="number" id="globalWeight" class="form-input" placeholder="60" min="0" step="0.1">
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">👫</span>
                  เพศ
                </label>
                <div class="gender-selector">
                  <label class="gender-option">
                    <input type="radio" name="gender" value="male" checked>
                    <span class="gender-btn">👨 ชาย</span>
                  </label>
                  <label class="gender-option">
                    <input type="radio" name="gender" value="female">
                    <span class="gender-btn">👩 หญิง</span>
                  </label>
                  <label class="gender-option">
                    <input type="radio" name="gender" value="other">
                    <span class="gender-btn">🧑 อื่นๆ</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Medication Section -->
          <div class="modal-section medication-section">
            <div class="section-title">
              <span class="section-icon">💊</span>
              <span>การให้สารน้ำ/ยา</span>
            </div>

            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label required">
                  <span class="label-icon">🧪</span>
                  ชื่อยา/สารน้ำ
                </label>
                <div class="medication-grid">
                  <div class="medication-option selected" data-value="Normal Saline">
                    <div class="med-icon">🧂</div>
                    <div class="med-name">Normal Saline</div>
                    <div class="med-desc">0.9% NSS</div>
                  </div>
                  <div class="medication-option" data-value="Dextrose 5%">
                    <div class="med-icon">🍯</div>
                    <div class="med-name">Dextrose 5%</div>
                    <div class="med-desc">D5W</div>
                  </div>
                  <div class="medication-option" data-value="Lactated Ringer's">
                    <div class="med-icon">💧</div>
                    <div class="med-name">Lactated Ringer's</div>
                    <div class="med-desc">LR Solution</div>
                  </div>
                  <div class="medication-option" data-value="Dextrose 5% in NSS">
                    <div class="med-icon">🌟</div>
                    <div class="med-name">D5NSS</div>
                    <div class="med-desc">5% Dextrose in NSS</div>
                  </div>
                  <div class="medication-option" data-value="Half Normal Saline">
                    <div class="med-icon">🌊</div>
                    <div class="med-name">0.45% NSS</div>
                    <div class="med-desc">Half Normal Saline</div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">
                  <span class="label-icon">🧊</span>
                  ปริมาณ (mL)
                </label>
                <div class="volume-selector">
                  <div class="volume-presets">
                    <button type="button" class="volume-btn" data-volume="250">250</button>
                    <button type="button" class="volume-btn" data-volume="500">500</button>
                    <button type="button" class="volume-btn selected" data-volume="1000">1000</button>
                    <button type="button" class="volume-btn" data-volume="1500">1500</button>
                  </div>
                  <input type="number" id="globalVolume" class="form-input volume-input" placeholder="กรอกปริมาณ" min="1" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">
                  <span class="label-icon">💧</span>
                  อัตราการให้
                </label>
                <div class="rate-input-group">
                  <div class="rate-toggle">
                    <button type="button" class="rate-type-btn active" data-type="drop">Drop/min</button>
                    <button type="button" class="rate-type-btn" data-type="cc">cc/hr</button>
                  </div>
                  <input type="number" id="globalRate" class="form-input rate-input" placeholder="20" min="1" required>
                  <span class="rate-unit" id="rateUnit">หยด/นาที</span>
                </div>
                <div class="rate-presets" id="ratePresets">
                  <button type="button" class="rate-preset-btn" data-rate="15">15</button>
                  <button type="button" class="rate-preset-btn" data-rate="20">20</button>
                  <button type="button" class="rate-preset-btn" data-rate="30">30</button>
                  <button type="button" class="rate-preset-btn" data-rate="40">40</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-cancel" id="globalPatientCancel">
              <span class="btn-icon">❌</span>
              ยกเลิก
            </button>
            <button class="btn btn-save" id="globalPatientSave">
              <span class="btn-icon">💾</span>
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div.firstElementChild);

    // Add CSS for the new patient modal
    if (!document.getElementById('patient-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'patient-modal-styles';
      style.textContent = `
        .patient-modal {
          max-width: 850px !important;
          max-height: 95vh;
          height: auto;
          min-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
          background: linear-gradient(145deg, #f0f9ff, #e0f2fe, #bae6fd);
          border-radius: 32px;
          box-shadow: 0 32px 64px rgba(14, 165, 233, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1);
          border: 2px solid rgba(59, 130, 246, 0.1);
          backdrop-filter: blur(20px);
          position: relative;
          -webkit-overflow-scrolling: touch;
        }

        .patient-modal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.05));
          pointer-events: none;
          z-index: 0;
        }

        .patient-modal > * {
          position: relative;
          z-index: 1;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 35px 25px;
          border-bottom: 2px solid rgba(59, 130, 246, 0.15);
          background: linear-gradient(135deg, #0ea5e9, #0284c7, #0369a1);
          border-radius: 32px 32px 0 0;
          color: white;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.3);
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .title-icon {
          font-size: 28px;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .modal-section {
          padding: 25px 30px;
          border-bottom: 1px solid rgba(236, 72, 153, 0.1);
        }

        .modal-section:last-of-type {
          border-bottom: none;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 28px;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          color: #0369a1;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(14, 165, 233, 0.05));
          border-radius: 16px;
          border-left: 4px solid #0ea5e9;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .section-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
        }

        /* Bed Selection Grid */
        .bed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 18px;
          margin-top: 20px;
        }

        .bed-item {
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border: 3px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px 18px;
          text-align: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .bed-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0ea5e9, #0284c7);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .bed-item:hover::before {
          transform: scaleX(1);
        }

        .bed-item:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 32px rgba(14, 165, 233, 0.2);
          border-color: #0ea5e9;
        }

        .bed-item.occupied {
          background: linear-gradient(145deg, #fef3c7, #fde68a, #fbbf24);
          border-color: #f59e0b;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
        }

        .bed-item.occupied:hover {
          box-shadow: 0 12px 32px rgba(245, 158, 11, 0.3);
        }

        .bed-item.selected {
          background: linear-gradient(145deg, #dbeafe, #93c5fd, #60a5fa);
          border-color: #2563eb;
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.25), 0 0 0 4px rgba(59, 130, 246, 0.15);
          transform: scale(1.05);
        }

        .bed-item.selected::before {
          transform: scaleX(1);
          background: linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8));
        }

        .bed-number {
          font-size: 24px;
          font-weight: 800;
          color: #374151;
          margin-bottom: 8px;
        }

        .bed-status {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bed-item.occupied .bed-status {
          color: #d97706;
        }

        .bed-item.selected .bed-status {
          color: #1d4ed8;
        }

        .bed-patient-name {
          font-size: 10px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }

        /* Form Styling */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
        }

        .form-label.required::after {
          content: '*';
          color: #ef4444;
          font-weight: 700;
        }

        .label-icon {
          font-size: 16px;
        }

        .form-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .form-input:focus {
          border-color: #0ea5e9;
          outline: none;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15), inset 0 2px 4px rgba(14, 165, 233, 0.05);
          transform: translateY(-2px);
        }

        .form-input:hover {
          border-color: #0284c7;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
        }

        /* Gender Selector */
        .gender-selector {
          display: flex;
          gap: 10px;
        }

        .gender-option {
          flex: 1;
          cursor: pointer;
        }

        .gender-option input {
          display: none;
        }

        .gender-btn {
          display: block;
          padding: 12px 8px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .gender-option input:checked + .gender-btn {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          border-color: #0369a1;
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
          transform: scale(1.05);
        }

        .gender-option:hover .gender-btn {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.15);
          border-color: #0ea5e9;
        }

        /* Medication Grid */
        .medication-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-top: 15px;
        }

        .medication-option {
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }

        .medication-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0ea5e9, #0284c7);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .medication-option:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(14, 165, 233, 0.15);
          border-color: #0ea5e9;
        }

        .medication-option:hover::before {
          transform: scaleX(1);
        }

        .medication-option.selected {
          background: linear-gradient(145deg, #dbeafe, #93c5fd);
          border-color: #2563eb;
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.2), 0 0 0 3px rgba(59, 130, 246, 0.15);
          transform: scale(1.05);
        }

        .medication-option.selected::before {
          transform: scaleX(1);
          background: linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8));
        }

        .med-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .med-name {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 4px;
        }

        .med-desc {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        /* Volume Selector */
        .volume-selector {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .volume-presets {
          display: flex;
          gap: 8px;
        }

        .volume-btn {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }

        .volume-btn:hover {
          border-color: #ec4899;
        }

        .volume-btn:hover {
          border-color: #0ea5e9;
          background: linear-gradient(145deg, #f0f9ff, #e0f2fe);
          transform: translateY(-2px);
        }

        .volume-btn.selected {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          border-color: #0369a1;
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
          transform: scale(1.05);
        }

        .volume-input {
          margin-top: 0;
        }

        /* Rate Input Group */
        .rate-input-group {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .rate-toggle {
          display: flex;
          background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
          border-radius: 12px;
          padding: 4px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .rate-type-btn {
          background: transparent;
          border: none;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #64748b;
          position: relative;
        }

        .rate-type-btn:hover {
          background: rgba(14, 165, 233, 0.1);
          color: #0369a1;
        }

        .rate-type-btn.active {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          transform: scale(1.05);
        }

        .rate-input {
          flex: 1;
          margin: 0;
        }

        .rate-unit {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          min-width: 80px;
        }

        .rate-presets {
          display: flex;
          gap: 8px;
        }

        .rate-preset-btn {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }

        .rate-preset-btn:hover {
          border-color: #0ea5e9;
          background: linear-gradient(145deg, #f0f9ff, #e0f2fe);
          transform: translateY(-2px);
        }

        /* Modal Actions */
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 30px 35px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
          border-radius: 0 0 32px 32px;
          backdrop-filter: blur(10px);
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          min-width: 160px;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn-cancel {
          background: linear-gradient(135deg, #64748b, #475569, #334155);
          color: white;
          box-shadow: 0 8px 25px rgba(100, 116, 139, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .btn-cancel:hover {
          background: linear-gradient(135deg, #475569, #334155, #1e293b);
          box-shadow: 0 12px 35px rgba(100, 116, 139, 0.4);
        }

        .btn-save {
          background: linear-gradient(135deg, #0ea5e9, #0284c7, #0369a1);
          color: white;
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .btn-save:hover {
          background: linear-gradient(135deg, #0284c7, #0369a1, #075985);
          box-shadow: 0 12px 35px rgba(14, 165, 233, 0.5);
        }

        .btn:hover {
          transform: translateY(-4px) scale(1.02);
        }

        .btn:active {
          transform: translateY(-2px) scale(0.98);
        }

        .btn-icon {
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .modal {
            padding: 10px;
            align-items: center;
            justify-content: center;
          }
          
          .patient-modal {
            max-width: 95vw;
            max-height: 90vh;
            min-height: auto;
            height: auto;
            margin: 0 auto;
            border-radius: 24px;
            overflow-y: auto;
          }

          .modal-header {
            padding: 20px 25px 18px;
            border-radius: 24px 24px 0 0;
          }

          .modal-title {
            font-size: 20px;
          }

          .title-icon {
            font-size: 24px;
          }

          .modal-section {
            padding: 20px 25px;
          }

          .section-title {
            font-size: 18px;
            padding: 12px 16px;
            margin-bottom: 18px;
          }

          .bed-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .bed-item {
            padding: 18px 12px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .medication-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .medication-option {
            padding: 16px 8px;
          }

          .form-input {
            padding: 14px 16px;
            font-size: 16px;
          }

          .gender-selector {
            gap: 8px;
          }

          .gender-btn {
            padding: 10px 6px;
            font-size: 13px;
          }

          .volume-presets {
            flex-wrap: wrap;
            gap: 6px;
          }

          .volume-btn {
            padding: 6px 10px;
            font-size: 13px;
          }

          .rate-input-group {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .rate-toggle {
            align-self: center;
          }

          .rate-presets {
            flex-wrap: wrap;
            gap: 6px;
          }

          .rate-preset-btn {
            padding: 4px 8px;
            font-size: 11px;
          }

          .modal-actions {
            flex-direction: column;
            gap: 12px;
            padding: 25px;
          }

          .btn {
            padding: 14px 24px;
            font-size: 15px;
            min-width: auto;
          }
        }

        @media (max-width: 480px) {
          .modal {
            padding: 5px;
            align-items: center;
            justify-content: center;
          }
          
          .patient-modal {
            max-width: 98vw;
            max-height: 95vh;
            min-height: auto;
            height: auto;
            margin: 0 auto;
            border-radius: 20px;
            overflow-y: auto;
          }

          .modal-header {
            padding: 16px 20px 14px;
            border-radius: 20px 20px 0 0;
          }

          .modal-title {
            font-size: 18px;
          }

          .modal-section {
            padding: 16px 20px;
          }

          .section-title {
            font-size: 16px;
            padding: 10px 12px;
          }

          .bed-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .bed-item {
            padding: 14px 8px;
          }

          .bed-number {
            font-size: 20px;
          }

          .medication-grid {
            grid-template-columns: 1fr;
          }

          .form-input {
            padding: 12px 14px;
          }

          .volume-presets,
          .rate-presets {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .modal-actions {
            padding: 20px;
            gap: 10px;
          }
        }

        /* Prevent zoom on mobile form inputs */
        @media screen and (max-width: 768px) {
          input[type="text"],
          input[type="number"],
          textarea,
          select {
            font-size: 16px !important;
          }
        }

        /* Improve touch targets on mobile */
        @media (max-width: 768px) {
          .bed-item,
          .medication-option,
          .volume-btn,
          .rate-preset-btn,
          .rate-type-btn,
          .gender-btn,
          .btn {
            min-height: 44px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
        }

        /* Fix iOS specific issues */
        @supports (-webkit-touch-callout: none) {
          .modal {
            -webkit-overflow-scrolling: touch;
          }

          .patient-modal {
            -webkit-overflow-scrolling: touch;
            transform: translate3d(0,0,0);
          }
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .modal.show {
          display: flex !important;
        }

        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          touch-action: none;
        }

        .patient-modal * {
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          body.modal-open {
            position: static;
            overflow: hidden;
            height: 100vh;
            touch-action: none;
          }
          
          .modal {
            position: fixed;
            height: 100vh;
            overflow-y: scroll;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  const modal = document.getElementById('globalPatientModal');
  const patientIdInput = modal.querySelector('#globalPatientId');
  const patientNameInput = modal.querySelector('#globalPatientName');
  const ageInput = modal.querySelector('#globalAge');
  const weightInput = modal.querySelector('#globalWeight');
  const volumeInput = modal.querySelector('#globalVolume');
  const rateInput = modal.querySelector('#globalRate');

  let selectedBedId = null;
  let selectedMedication = 'Normal Saline';
  let rateType = 'drop'; // 'drop' or 'cc'

  // Generate bed grid
  function generateBedGrid() {
    const bedGrid = modal.querySelector('#bedGrid');
    bedGrid.innerHTML = '';

    // Get dataManager from window or try to import
    const dataManager = window.dataManager || window.activeDataManager;
    if (!dataManager) {
      console.error('DataManager not found');
      return;
    }

    for (let i = 1; i <= (window.MAX_BEDS || 8); i++) {
      const patientData = dataManager.getPatient(i);
      const bedItem = document.createElement('div');
      bedItem.className = `bed-item ${patientData ? 'occupied' : ''}`;
      bedItem.dataset.bedId = i;

      bedItem.innerHTML = `
        <div class="bed-number">เตียง ${i}</div>
        <div class="bed-status">${patientData ? 'มีผู้ป่วย' : 'ว่าง'}</div>
        ${patientData ? `<div class="bed-patient-name">${patientData.name || 'ไม่ระบุชื่อ'}</div>` : ''}
      `;

      bedItem.addEventListener('click', () => selectBed(i));
      bedGrid.appendChild(bedItem);
    }
  }

  // Select bed function
  function selectBed(bedId) {
    // Remove previous selection
    modal.querySelectorAll('.bed-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Add selection to clicked bed
    const bedItem = modal.querySelector(`[data-bed-id="${bedId}"]`);
    bedItem.classList.add('selected');
    selectedBedId = bedId;

    // Load existing patient data if any
    loadPatientData(bedId);
  }

  // Medication selection
  function initMedicationSelection() {
    const medicationOptions = modal.querySelectorAll('.medication-option');
    medicationOptions.forEach(option => {
      option.addEventListener('click', () => {
        medicationOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedMedication = option.dataset.value;
      });
    });
  }

  // Volume presets
  function initVolumePresets() {
    const volumeBtns = modal.querySelectorAll('.volume-btn');
    const volumeInput = modal.querySelector('#globalVolume');

    volumeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        volumeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        volumeInput.value = btn.dataset.volume;
      });
    });

    volumeInput.addEventListener('input', () => {
      volumeBtns.forEach(b => b.classList.remove('selected'));
    });
  }

  // Rate type toggle
  function initRateToggle() {
    const rateTypeBtns = modal.querySelectorAll('.rate-type-btn');
    const rateUnit = modal.querySelector('#rateUnit');
    const ratePresets = modal.querySelector('#ratePresets');

    rateTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rateTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rateType = btn.dataset.type;

        if (rateType === 'drop') {
          rateUnit.textContent = 'หยด/นาที';
          updateRatePresets([15, 20, 30, 40]);
        } else {
          rateUnit.textContent = 'cc/ชั่วโมง';
          updateRatePresets([50, 75, 100, 125]);
        }

        rateInput.value = '';
      });
    });
  }

  // Update rate presets
  function updateRatePresets(values) {
    const ratePresets = modal.querySelector('#ratePresets');
    ratePresets.innerHTML = '';

    values.forEach(value => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rate-preset-btn';
      btn.dataset.rate = value;
      btn.textContent = value;
      btn.addEventListener('click', () => {
        rateInput.value = value;
      });
      ratePresets.appendChild(btn);
    });
  }

  // Gender selection
  function initGenderSelection() {
    const genderOptions = modal.querySelectorAll('input[name="gender"]');
    genderOptions.forEach(option => {
      option.addEventListener('change', () => {
        // Visual feedback is handled by CSS
      });
    });
  }

  // Load patient data into form
  function loadPatientData(bedId) {
    const dataManager = window.dataManager || window.activeDataManager;
    if (!dataManager) {
      console.error('DataManager not found');
      return;
    }
    const data = dataManager.getPatient(bedId);
    if (data) {
      patientIdInput.value = data.patient_id || '';
      patientNameInput.value = data.name || '';
      ageInput.value = data.age || '';
      weightInput.value = data.weight || '';

      // Set gender
      const genderRadio = modal.querySelector(`input[name="gender"][value="${data.gender || 'male'}"]`);
      if (genderRadio) genderRadio.checked = true;

      // Set medication
      const medOption = modal.querySelector(`[data-value="${data.medication || 'Normal Saline'}"]`);
      if (medOption) {
        modal.querySelectorAll('.medication-option').forEach(opt => opt.classList.remove('selected'));
        medOption.classList.add('selected');
        selectedMedication = data.medication || 'Normal Saline';
      }

      // Set volume
      const volumeMatch = data.volume ? data.volume.match(/\d+/) : null;
      const volume = volumeMatch ? parseInt(volumeMatch[0]) : '';
      volumeInput.value = volume;

      // Highlight volume preset if matches
      const volumeBtn = modal.querySelector(`[data-volume="${volume}"]`);
      if (volumeBtn) {
        modal.querySelectorAll('.volume-btn').forEach(b => b.classList.remove('selected'));
        volumeBtn.classList.add('selected');
      }

      // Set rate
      rateInput.value = data.rate || '';
    } else {
      clearForm();
    }
  }

  // Clear form
  function clearForm() {
    patientIdInput.value = '';
    patientNameInput.value = '';
    ageInput.value = '';
    weightInput.value = '';
    rateInput.value = '';
    volumeInput.value = '1000';

    // Reset gender to male
    const maleRadio = modal.querySelector('input[name="gender"][value="male"]');
    if (maleRadio) maleRadio.checked = true;

    // Reset medication to Normal Saline
    modal.querySelectorAll('.medication-option').forEach(opt => opt.classList.remove('selected'));
    const defaultMed = modal.querySelector('[data-value="Normal Saline"]');
    if (defaultMed) {
      defaultMed.classList.add('selected');
      selectedMedication = 'Normal Saline';
    }

    // Reset volume preset
    modal.querySelectorAll('.volume-btn').forEach(b => b.classList.remove('selected'));
    const defaultVol = modal.querySelector('[data-volume="1000"]');
    if (defaultVol) defaultVol.classList.add('selected');
  }

  // Initialize modal functionality
  function initModalFunctionality() {
    generateBedGrid();
    initMedicationSelection();
    initVolumePresets();
    initRateToggle();
    initGenderSelection();
  }

  // Show modal function
  window.openPatientModal = function(bedId) {
    initModalFunctionality();

    if (bedId) {
      selectBed(bedId);
    } else {
      selectedBedId = null;
      clearForm();
    }

    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.classList.add('modal-open'); // Prevent body scroll

    // Scroll modal to top and focus on patient name input
    setTimeout(() => {
      modal.scrollTop = 0;
      const modalContent = modal.querySelector('.patient-modal');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
      patientNameInput.focus();
    }, 100);
  };

  // Close modal function
  window.closePatientModal = function() {
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open'); // Re-enable body scroll
    selectedBedId = null;
  }

  function closeModal() {
    closePatientModal();
  }

  modal.querySelector('#globalPatientCancel').addEventListener('click', closeModal);

  modal.querySelector('#globalPatientSave').addEventListener('click', function(){
    const patientName = patientNameInput.value.trim();
    const patientId = patientIdInput.value.trim();
    const age = ageInput.value;
    const weight = weightInput.value;
    const volume = volumeInput.value;
    const rate = rateInput.value;

    // Get selected gender
    const selectedGender = modal.querySelector('input[name="gender"]:checked');
    const gender = selectedGender ? selectedGender.value : 'male';

    // Validation
    if (!selectedBedId) {
      alert('🏥 กรุณาเลือกเตียงก่อน');
      return;
    }

    if (!patientName) {
      alert('👤 กรุณากรอกชื่อ-สกุลผู้ป่วย');
      patientNameInput.focus();
      return;
    }

    if (!volume || volume <= 0) {
      alert('🧊 กรุณากรอกปริมาณสารน้ำ');
      volumeInput.focus();
      return;
    }

    if (!rate || rate <= 0) {
      alert('💧 กรุณากรอกอัตราการให้สารน้ำ');
      rateInput.focus();
      return;
    }

    // Convert rate if needed
    let finalRate = parseInt(rate);
    if (rateType === 'cc') {
      // Convert cc/hr to drop/min (assuming 20 drop factor)
      finalRate = Math.round((rate * 20) / 60);
    }

    const data = {
      patient_id: patientId || `P${String(selectedBedId).padStart(3, '0')}_${Date.now().toString().slice(-4)}`,
      name: patientName,
      age: age || '',
      weight: weight || '',
      gender: gender,
      medication: selectedMedication,
      volume: volume + 'mL',
      rate: finalRate,
      rate_type: rateType,
      original_rate: rate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const dataManager = window.dataManager || window.activeDataManager;
      if (!dataManager) {
        throw new Error('DataManager not found');
      }

      const saved = dataManager.savePatient(selectedBedId, data);
      window.dispatchEvent(new CustomEvent('patientSaved', {
        detail: { bedId: selectedBedId, patient: saved }
      }));

      // Show success message with animation
      showSuccessMessage('✅ บันทึกข้อมูลผู้ป่วยเรียบร้อย');
      closeModal();

    } catch (error) {
      alert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
      console.error('Save error:', error);
    }
  });

  // Success message function
  function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      animation: successFade 2s ease-in-out;
    `;
    successDiv.textContent = message;

    // Add CSS animation
    if (!document.getElementById('success-animation')) {
      const style = document.createElement('style');
      style.id = 'success-animation';
      style.textContent = `
        @keyframes successFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 2000);
  }
})();