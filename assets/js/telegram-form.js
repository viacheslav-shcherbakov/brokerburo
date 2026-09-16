/* ---- Telegram Form Handler ---- */
// Конфигурация - ваш аккаунт в Telegram
const TG_USERNAME = 'VAShcherbakov';
const TG_URL = `https://t.me/${TG_USERNAME}?text=`;

/* ---- Модальное окно ---- */
function openModal(planName = '') {
  const modal = document.getElementById('tgModal');
  if (!modal) return;

  const form = modal.querySelector('form');
  if (form && planName) {
    form.dataset.plan = planName;
  }

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
    const firstInput = modal.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 10);
}

function closeModal() {
  const modal = document.getElementById('tgModal');
  if (!modal) return;

  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

/* ---- Валидация ---- */
function validate() {
  const modal = document.getElementById('tgModal');
  if (!modal) return false;

  const form = modal.querySelector('form');
  const nameInput = modal.querySelector('input[name="name"]');
  const phoneInput = modal.querySelector('input[name="phone"]');

  if (!nameInput || !phoneInput) return false;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (name.length < 2) {
    showToast('Пожалуйста, введите корректное имя');
    nameInput.focus();
    return false;
  }

  if (phone.length < 5) {
    showToast('Пожалуйста, введите корректный телефон');
    phoneInput.focus();
    return false;
  }

  return true;
}

/* ---- Toast уведомления ---- */
function showToast(message) {
  const old = document.querySelector('.toast-notification');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText =
    'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
    'background:#1E1D1A;color:#fff;padding:14px 24px;border-radius:8px;' +
    'z-index:10000;font-size:14px;font-family:"Inter",sans-serif;' +
    'box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:toastSlide 0.3s ease;';

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---- Submit → открываем Telegram с предзаполненным текстом ---- */
function initTelegramForm() {
  const modal = document.getElementById('tgModal');
  if (!modal) return;

  const form = modal.querySelector('form');
  const nameInput = modal.querySelector('input[name="name"]');
  const phoneInput = modal.querySelector('input[name="phone"]');
  const submitBtn = modal.querySelector('button[type="submit"]');
  const closeBtn = modal.querySelector('.modal-close');

  if (!form || !nameInput || !phoneInput) return;

  // Закрытие по крестику
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Закрытие по клику вне модалки
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  /* ---- Submit handler ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const plan = form.dataset.plan || 'Консультация';

    const message =
      'Здравствуйте! Хочу обсудить задачу.\n' +
      'Интересует: ' + plan + '\n' +
      'Имя: ' + name + '\n' +
      'Телефон: ' + phone;

    const url = TG_URL + encodeURIComponent(message);

    console.log('Telegram URL:', url);

    // Надёжное открытие через <a>, чтобы не блокировалось браузером
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Fallback, если браузер не открыл вкладку
    const fallbackTimer = setTimeout(() => {
      showFallbackLink(url);
    }, 1500);

    window.addEventListener('focus', function onFocus() {
      clearTimeout(fallbackTimer);
      window.removeEventListener('focus', onFocus);
    }, { once: true });

    closeModal();
    form.reset();
    delete form.dataset.plan;

    showToast('Telegram открыт — отправьте сообщение в чат 💬');
  });
}

/* ---- Fallback-ссылка ---- */
function showFallbackLink(url) {
  const old = document.getElementById('tgFallback');
  if (old) old.remove();

  const box = document.createElement('div');
  box.id = 'tgFallback';
  box.style.cssText =
    'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
    'background:#1E1D1A;border:1px solid #A65338;border-radius:12px;' +
    'padding:16px 20px;z-index:3000;max-width:90vw;text-align:center;' +
    'box-shadow:0 10px 40px rgba(166,83,56,0.3);font-size:14px;color:#fff;' +
    'font-family:"Inter",sans-serif;';

  box.innerHTML =
    'Не удалось открыть Telegram автоматически.<br>' +
    '<a href="' + url + '" target="_blank" rel="noopener noreferrer" ' +
    'style="color:#A65338;word-break:break-all;font-weight:600;">' +
    'Нажмите сюда, чтобы открыть чат</a>' +
    '<button onclick="this.parentElement.remove()" ' +
    'style="display:block;margin:10px auto 0;background:transparent;' +
    'border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:6px;' +
    'padding:6px 14px;cursor:pointer;font-family:inherit;">Закрыть</button>';

  document.body.appendChild(box);
}

/* ---- Инициализация кнопок ---- */
function initTelegramButtons() {
  // Кнопки с классом .js-open-tg
  const buttons = document.querySelectorAll('.js-open-tg');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const planName = btn.dataset.plan || btn.getAttribute('title') || 'Консультация';
      openModal(planName);
    });
  });

  // Кнопки внутри форм с data-telegram
  const forms = document.querySelectorAll('form[data-telegram]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = form.querySelector('input[name="name"]') || form.querySelector('input[type="text"]');
      const phoneInput = form.querySelector('input[name="phone"]') || form.querySelector('input[type="tel"]');
      
      if (!nameInput || !phoneInput) {
        showToast('Форма требует поля имени и телефона');
        return;
      }

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const plan = form.dataset.plan || form.dataset.telegram || 'Заявка с сайта';

      const message =
        'Здравствуйте! Заявка с сайта BrokerBuro.\n' +
        'Интересует: ' + plan + '\n' +
        'Имя: ' + name + '\n' +
        'Телефон: ' + phone;

      const url = TG_URL + encodeURIComponent(message);

      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Telegram открыт — отправьте сообщение 💬');
      
      form.reset();
    });
  });
}

/* ---- Инициализация при загрузке ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTelegramForm();
  initTelegramButtons();
});
