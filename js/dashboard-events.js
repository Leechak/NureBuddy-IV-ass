// Dashboard Event Handlers Module

class DashboardEventHandlers {
  constructor(dashboardManager) {
    this.dashboard = dashboardManager;
    this.activeDataManager = window.dataManager || window.activeDataManager;
    this.init();
  }

  init() {
    this.setupGlobalEventListeners();
    this.setupFormValidation();
    this.setupKeyboardShortcuts();
  }

  setupGlobalEventListeners() {
    // Modal backdrop clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.handleModalBackdropClick(e);
      }
    });

    // Form input changes
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[type="number"]')) {
        this.handleNumericInput(e);
      }
    });

    // Button clicks with data attributes
    document.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleActionClick(action, e);
      }
    });
  }

  setupFormValidation() {
    // Real-time validation for forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('input', (e) => {
        this.validateField(e.target);
      });

      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+N: New patient
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.dashboard.showQuickAdd();
      }

      // Ctrl+I: I/O Entry
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        this.dashboard.showIOEntry();
      }

      // Ctrl+B: Beds Overview
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.dashboard.showBedsOverview();
      }

      // F1: Help
      if (e.key === 'F1') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
    });
  }

  handleModalBackdropClick(e) {
    const modal = e.target;
    if (modal.classList.contains('modal')) {
      modal.style.display = 'none';
    }
  }

  handleNumericInput(e) {
    const input = e.target;
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    // Remove invalid characters
    input.value = input.value.replace(/[^0-9.]/g, '');

    // Validate range
    if (min !== undefined && value < min) {
      input.setCustomValidity(`ค่าต้องไม่น้อยกว่า ${min}`);
    } else if (max !== undefined && value > max) {
      input.setCustomValidity(`ค่าต้องไม่มากกว่า ${max}`);
    } else {
      input.setCustomValidity('');
    }
  }

  handleActionClick(action, e) {
    e.preventDefault();

    switch (action) {
      case 'quick-add':
        this.dashboard.showQuickAdd();
        break;
      case 'io-entry':
        this.dashboard.showIOEntry();
        break;
      case 'beds-overview':
        this.dashboard.showBedsOverview();
        break;
      case 'logout':
        this.dashboard.logout();
        break;
      case 'close-modal':
        this.dashboard.closeActiveModal();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  validateField(field) {
    const validationRules = {
      'patientId': {
        required: true,
        pattern: /^[A-Za-z0-9]+$/,
        message: 'รหัสผู้ป่วยต้องเป็นตัวอักษรและตัวเลขเท่านั้น'
      },
      'patientName': {
        required: true,
        minLength: 2,
        message: 'ชื่อผู้ป่วยต้องมีความยาวอย่างน้อย 2 ตัวอักษร'
      },
      'rate': {
        required: true,
        min: 1,
        max: 200,
        message: 'อัตราการหยดต้องอยู่ระหว่าง 1-200 ดรอป/นาที'
      },
      'volume': {
        required: true,
        min: 1,
        max: 5000,
        message: 'ปริมาณต้องอยู่ระหว่าง 1-5000 mL'
      }
    };

    const rule = validationRules[field.id];
    if (!rule) return;

    let isValid = true;
    let message = '';

    if (rule.required && !field.value.trim()) {
      isValid = false;
      message = 'ฟิลด์นี้จำเป็นต้องกรอก';
    } else if (rule.pattern && !rule.pattern.test(field.value)) {
      isValid = false;
      message = rule.message;
    } else if (rule.minLength && field.value.length < rule.minLength) {
      isValid = false;
      message = rule.message;
    } else if (rule.min && parseFloat(field.value) < rule.min) {
      isValid = false;
      message = rule.message;
    } else if (rule.max && parseFloat(field.value) > rule.max) {
      isValid = false;
      message = rule.message;
    }

    this.setFieldValidation(field, isValid, message);
  }

  setFieldValidation(field, isValid, message) {
    field.setCustomValidity(isValid ? '' : message);

    // Visual feedback
    field.classList.toggle('is-invalid', !isValid);
    field.classList.toggle('is-valid', isValid && field.value.trim());

    // Show/hide error message
    let errorDiv = field.parentNode.querySelector('.error-message');
    if (!isValid && message) {
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 4px;';
        field.parentNode.appendChild(errorDiv);
      }
      errorDiv.textContent = message;
    } else if (errorDiv) {
      errorDiv.remove();
    }
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      this.validateField(input);
      if (!input.checkValidity()) {
        isValid = false;
      }
    });

    return isValid;
  }

  showKeyboardShortcuts() {
    const shortcuts = {
      'Ctrl + N': 'เพิ่มผู้ป่วยใหม่',
      'Ctrl + I': 'บันทึก I/O',
      'Ctrl + B': 'ภาพรวมเตียง',
      'Escape': 'ปิด Modal',
      'F1': 'แสดงคำแนะนำ'
    };

    let content = '<div style="padding: 20px;"><h4>Keyboard Shortcuts</h4><ul style="list-style: none; padding: 0;">';
    Object.entries(shortcuts).forEach(([key, description]) => {
      content += `<li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
        <kbd style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${key}</kbd>
        <span>${description}</span>
      </li>`;
    });
    content += '</ul></div>';

    // Show in a simple modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: white; border-radius: 12px; max-width: 500px; width: 90%;">${content}</div>`;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.remove(), 10000); // Auto close after 10 seconds
  }

  handleActionClick(action, e) {
    e.preventDefault();

    switch (action) {
      case 'quick-add':
        this.dashboard.showQuickAdd();
        break;
      case 'io-entry':
        this.dashboard.showIOEntry();
        break;
      case 'beds-overview':
        this.dashboard.showBedsOverview();
        break;
      case 'logout':
        this.dashboard.logout();
        break;
      case 'close-modal':
        this.dashboard.closeActiveModal();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
}

// Make DashboardEventHandlers globally available
window.DashboardEventHandlers = DashboardEventHandlers;