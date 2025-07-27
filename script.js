// IV Calculator ใหม่ - ใช้ระบบจาก System/iv-calculator.js
// โหลดระบบใหม่จากไฟล์ที่แยกออกมาแล้ว
function loadIVCalculatorSystem() {
  const script = document.createElement('script');
  script.src = './System/iv-calculator.js';
  script.type = 'module';
  document.head.appendChild(script);
}

// ฟังก์ชันสำหรับเรียกใช้เครื่องคำนวณแบบใหม่
function openAdvancedIVCalculator(bedId = null) {
  if (typeof window.ivCalculatorSystem !== 'undefined') {
    window.ivCalculatorSystem.createAdvancedCalculatorModal(bedId);
  } else {
    // โหลดและรอสักครู่
    loadIVCalculatorSystem();
    setTimeout(() => {
      if (typeof window.ivCalculatorSystem !== 'undefined') {
        window.ivCalculatorSystem.createAdvancedCalculatorModal(bedId);
      }
    }, 500);
  }
}

// คลาส IVCalculator เก่าสำหรับ backward compatibility
class IVCalculator {
  static dropPerMinToCcPerHr(dropPerMin, dropFactor = 20) {
    if (typeof window.IVCalculatorSystem !== 'undefined') {
      return window.IVCalculatorSystem.dropPerMinToCcPerHr(dropPerMin, dropFactor);
    }
    if (!dropPerMin || !dropFactor) return 0;
    return (dropPerMin * 60) / dropFactor;
  }

  static ccPerHrToDropPerMin(ccPerHr, dropFactor = 20) {
    if (typeof window.IVCalculatorSystem !== 'undefined') {
      return window.IVCalculatorSystem.ccPerHrToDropPerMin(ccPerHr, dropFactor);
    }
    if (!ccPerHr || !dropFactor) return 0;
    return (ccPerHr * dropFactor) / 60;
  }

  static calculateTimeToFinish(totalVolume, ccPerHr) {
    if (typeof window.IVCalculatorSystem !== 'undefined') {
      return window.IVCalculatorSystem.calculateTimeToFinish(totalVolume, ccPerHr);
    }
    if (!totalVolume || !ccPerHr) return 0;
    return totalVolume / ccPerHr;
  }

  static formatTime(hours) {
    if (typeof window.IVCalculatorSystem !== 'undefined') {
      return window.IVCalculatorSystem.formatTime(hours);
    }
    if (!hours) return "0 ชั่วโมง 0 นาที";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} ชั่วโมง ${minutes} นาที`;
  }
}

// ฟังก์ชันสำหรับสร้าง UI คำนวณน้ำเกลือแบบง่าย (backward compatibility)
function createAdvancedIVCalculatorUI() {
  // ใช้ระบบใหม่แทน
  if (typeof window.ivCalculatorSystem !== 'undefined') {
    window.ivCalculatorSystem.createAdvancedCalculatorModal();
    return '';
  }

  return `
    <div class="iv-calculator" style="text-align: center; padding: 40px;">
      <h3>🧮 เครื่องคำนวณน้ำเกลืออัจฉริยะ</h3>
      <p style="color: #64748b; margin-bottom: 20px;">ระบบใหม่พร้อมการแจ้งเตือนความปลอดภัย</p>
      <button onclick="openAdvancedIVCalculator()" style="
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
      ">
        🚀 เปิดเครื่องคำนวณใหม่
      </button>
    </div>
  `;
}

// ฟังก์ชันคำนวณขั้นสูง - ใช้ระบบใหม่
function calculateAdvancedIV() {
  // เรียกใช้ระบบใหม่
  openAdvancedIVCalculator();
}

// ฟังก์ชันตรวจสอบ Drop Factor - ใช้ระบบใหม่
function detectDropFactor() {
  openAdvancedIVCalculator();
}

// ฟังก์ชันล้างข้อมูล - สำหรับ backward compatibility
function clearIVCalculator() {
  if (typeof window.ivCalculatorSystem !== 'undefined') {
    // ปิด modal ถ้าเปิดอยู่
    if (typeof window.alertSystemManager !== 'undefined') {
      window.alertSystemManager.closeModal('advancedIVCalculator');
    }
  }

  // ล้างข้อมูลแบบเก่าถ้ามี
  const fields = ['totalVolume', 'dropPerMin', 'ccPerHr', 'patientWeight'];
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.value = '';
  });

  const dropFactor = document.getElementById('dropFactor');
  const fluidType = document.getElementById('fluidType');
  const ivResults = document.getElementById('ivResults');
  const safetyWarning = document.getElementById('safetyWarning');

  if (dropFactor) dropFactor.selectedIndex = 2;
  if (fluidType) fluidType.selectedIndex = 0;
  if (ivResults) ivResults.style.display = 'none';
  if (safetyWarning) safetyWarning.style.display = 'none';
}

// โหลดระบบ IV Calculator ใหม่
if (typeof document !== 'undefined') {
  // โหลดระบบ IV Calculator ใหม่
  loadIVCalculatorSystem();

  // เพิ่ม CSS สำหรับความเข้ากันได้แบบเก่า
  const existingStyle = document.querySelector('#iv-calculator-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.id = 'iv-calculator-style';
  style.textContent = `
    .iv-calculator {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 25px;
      border-radius: 15px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      text-align: center;
    }

    .iv-calculator h3 {
      color: #1e293b;
      margin-bottom: 15px;
      font-size: 24px;
    }

    .iv-calculator button {
      transition: all 0.3s ease;
    }

    .iv-calculator button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
    }
  `;
  document.head.appendChild(style);
}

// Export สำหรับใช้งาน
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IVCalculator, createAdvancedIVCalculatorUI, calculateAdvancedIV };
}