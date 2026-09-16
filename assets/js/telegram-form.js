/* ---- Конфигурация ---- */
// ВСТАВЬТЕ СЮДА ВАШИ ДАННЫЕ
const TG_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; 
const TG_CHAT_ID = 'YOUR_CHAT_ID_HERE';

if (!TG_BOT_TOKEN || !TG_CHAT_ID || TG_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.warn('Telegram Bot Token or Chat ID is not configured in assets/js/telegram-form.js');
}

const TG_URL = `https://t.me/${TG_BOT_TOKEN ? TG_BOT_TOKEN.split(':')[0] : ''}?start=`; 
// Примечание: Для отправки сообщения боту лучше использовать прямую ссылку на бота, 
// но ваш скрипт формирует сообщение для отправки КОНКРЕТНОМУ ПОЛЬЗОВАТЕЛЮ (себе) или в канал?
// Если вы хотите отправлять заявку СЕБЕ (в личку), то ссылка должна вести на ваш юзернейм или использовать бота как прокси.
// Ваш код использует TG_URL + message. Это работает, если TG_URL ведет на ваш личный контакт или бота, который пересылает.
// Стандартный способ отправки себе через бота требует backend или использования метода sendMessage API.
// Однако, ваш код эмулирует "написать мне в телеграм". 
// Давайте скорректируем TG_URL под формат "написать пользователю/боту с текстом".
// Формат: https://t.me/USERNAME?start=TEXT (для ботов) или https://t.me/USERNAME?text=TEXT (для личных контактов, но text не всегда поддерживается официально в web).
// Самый надежный вариант для "отправить заявку себе" без бэкенда:
// 1. Ссылка на бота: https://t.me/YOUR_BOT_USERNAME?start=... (бот должен парсить start)
// 2. Ссылка на личный контакт: tg://resolve?domain=USERNAME&text=... (работает только в приложении)
// 3. Ссылка на личный контакт https://t.me/USERNAME (текст предзаполнить нельзя официально через URL scheme для веба reliably).

// ИСПРАВЛЕНИЕ: Ваш код предполагает, что TG_URL уже содержит базовый адрес.
// Давайте определим его правильно. Если цель - чтобы клиент написал ВАМ в личку с готовым текстом:
// К сожалению, web-ссылка t.me/username?text=... работает нестабильно во всех ОС.
// Но раз вы просили именно этот скрипт, я оставлю логику формирования URL, вам нужно будет вставить правильную базу.
// Рекомендуемый формат для TG_URL, чтобы работало ваше concat:
// const TG_URL = "https://t.me/YOUR_USERNAME?text="; // Работает на мобильных часто, на десктопе может игнорировать text.
// ИЛИ, если это бот: "https://t.me/YOUR_BOT_USERNAME?start="; 

// ДЛЯ ДЕМОНСТРАЦИИ РАБОТЫ СКРИПТА (заглушка):
// Замените YOUR_TELEGRAM_USERNAME на ваш реальный юзернейм (без @)
const MY_TELEGRAM_USERNAME = 'YOUR_TELEGRAM_USERNAME'; 
const BASE_TG_URL = `https://t.me/${MY_TELEGRAM_USERNAME}?text=`;

/* ---- Элементы формы (универсальные) ---- */
// Скрипт ищет форму с id="telegram-request-form" на странице
// Или создает её динамически, если нет (опционально, но лучше иметь в HTML)

let modal = null;
let form = null;
let nameInput = null;
let phoneInput = null;
let fallbackTimer = null;

/* ---- Инициализация ---- */
document.addEventListener('DOMContentLoaded', () => {
  createModal();
  attachListeners();
});

/* ---- Создание модального окна ---- */
function createModal() {
  if (document.getElementById('tg-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'tg-modal-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(30, 29, 26, 0.6); backdrop-filter: blur(4px);
    z-index: 9998; display: none; justify-content: center; align-items: center;
    opacity: 0; transition: opacity 0.3s ease;
  `;

  const modalBox = document.createElement('div');
  modalBox.id = 'tg-modal-box';
  modalBox.style.cssText = `
    background: #FFFFFF; padding: 40px; border-radius: 4px;
    width: 100%; max-width: 480px; position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    transform: translateY(20px); transition: transform 0.3s ease;
    font-family: 'Inter', sans-serif; color: #1E1D1A;
  `;

  // Заголовок
  const title = document.createElement('h3');
  title.textContent = 'Обсудить задачу';
  title.style.cssText = `
    font-family: 'Cormorant Garamond', serif; font-size: 32px; 
    margin: 0 0 10px 0; color: #1E1D1A; line-height: 1.1;
  `;

  // Подзаголовок
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Оставьте контакты, я свяжусь с вами в Telegram';
  subtitle.style.cssText = `
    font-size: 14px; color: #777269; margin: 0 0 24px 0;
  `;

  // Форма
  form = document.createElement('form');
  form.id = 'telegram-request-form';
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '16px';

  // Инпут имени
  nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Ваше имя';
  nameInput.required = true;
  styleInput(nameInput);

  // Инпут телефона
  phoneInput = document.createElement('input');
  phoneInput.type = 'tel';
  phoneInput.placeholder = 'Телефон';
  phoneInput.required = true;
  styleInput(phoneInput);

  // Кнопка отправки
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Отправить в Telegram';
  submitBtn.style.cssText = `
    background: #A65338; color: #fff; border: none;
    padding: 16px 24px; border-radius: 4px; font-size: 16px;
    font-weight: 500; cursor: pointer; transition: background 0.2s;
    font-family: 'Inter', sans-serif; margin-top: 8px;
  `;
  submitBtn.onmouseover = () => submitBtn.style.background = '#8F462F';
  submitBtn.onmouseout = () => submitBtn.style.background = '#A65338';

  // Кнопка закрытия (крестик)
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    position: absolute; top: 16px; right: 20px;
    background: none; border: none; font-size: 28px;
    color: #777269; cursor: pointer; line-height: 1;
  `;
  closeBtn.onclick = closeModal;

  form.appendChild(nameInput);
  form.appendChild(phoneInput);
  form.appendChild(submitBtn);
  
  modalBox.appendChild(title);
  modalBox.appendChild(subtitle);
  modalBox.appendChild(form);
  modalBox.appendChild(closeBtn);
  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  modal = overlay;

  // Логика формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    // Берем тему из data-атрибута формы или дефолтную
    const topic = form.dataset.topic || 'Заявка с сайта BrokerBuro';
    const plan = form.dataset.plan || '';

    let message = `Здравствуйте! ${topic}\n`;
    if (plan) message += `Интересует: ${plan}\n`;
    message += `Имя: ${name}\n`;
    message += `Телефон: ${phone}`;

    const url = BASE_TG_URL + encodeURIComponent(message);

    console.log('Telegram URL:', url);

    // Надёжное открытие через <a>
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Fallback
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
    delete form.dataset.topic;

    showToast('Telegram открыт — отправьте сообщение в чат 💬');
  });
}

function styleInput(input) {
  input.style.cssText = `
    width: 100%; padding: 14px 16px; border: 1px solid #D9D3C8;
    border-radius: 4px; font-size: 16px; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box; color: #1E1D1A;
  `;
  input.onfocus = () => {
    input.style.borderColor = '#A65338';
    input.style.boxShadow = '0 0 0 2px rgba(166, 83, 56, 0.1)';
  };
  input.onblur = () => {
    input.style.borderColor = '#D9D3C8';
    input.style.boxShadow = 'none';
  };
}

/* ---- Валидация ---- */
function validate() {
  let isValid = true;
  [nameInput, phoneInput].forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = '#A65338';
      isValid = false;
    } else {
      input.style.borderColor = '#D9D3C8';
    }
  });
  
  if (!isValid) {
    showToast('Пожалуйста, заполните все поля', 'error');
  }
  return isValid;
}

/* ---- Открытие/Закрытие ---- */
function openModal(topic = 'Заявка с сайта', plan = '') {
  if (!modal) createModal();
  
  form.dataset.topic = topic;
  if (plan) form.dataset.plan = plan;
  
  modal.style.display = 'flex';
  // Force reflow
  void modal.offsetWidth;
  modal.style.opacity = '1';
  modal.querySelector('#tg-modal-box').style.transform = 'translateY(0)';
  
  // Фокус на имя
  setTimeout(() => nameInput.focus(), 100);
}

function closeModal() {
  if (!modal) return;
  modal.style.opacity = '0';
  modal.querySelector('#tg-modal-box').style.transform = 'translateY(20px)';
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

/* ---- Fallback-ссылка ---- */
function showFallbackLink(url) {
  const old = document.getElementById('tgFallback');
  if (old) old.remove();

  const box = document.createElement('div');
  box.id = 'tgFallback';
  box.style.cssText =
    'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
    'background:#1E1D1A;border:1px solid #A65338;border-radius:4px;' +
    'padding:16px 20px;z-index:10000;max-width:90vw;text-align:center;' +
    'box-shadow:0 10px 40px rgba(0,0,0,0.2);font-size:14px;color:#fff;' +
    'font-family: "Inter", sans-serif;';

  box.innerHTML =
    'Не удалось открыть Telegram автоматически.<br>' +
    '<a href="' + url + '" target="_blank" rel="noopener noreferrer" ' +
    'style="color:#A65338;word-break:break-all;font-weight:600;display:inline-block;margin-top:8px;">' +
    'Нажмите сюда, чтобы открыть чат</a>' +
    '<button onclick="this.parentElement.remove()" ' +
    'style="display:block;margin:10px auto 0;background:transparent;' +
    'border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;' +
    'padding:6px 14px;cursor:pointer;font-family:inherit;font-size:12px;">Закрыть</button>';

  document.body.appendChild(box);
  
  // Авто-удаление через 10 сек
  setTimeout(() => {
    if (box.parentElement) box.remove();
  }, 10000);
}

/* ---- Toast уведомления ---- */
function showToast(message, type = 'success') {
  const old = document.getElementById('tg-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'tg-toast';
  const bgColor = type === 'error' ? '#A65338' : '#1E1D1A';
  
  toast.style.cssText =
    `position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:${bgColor};color:#fff;padding:12px 24px;
    border-radius:4px;font-size:14px;font-weight:500;
    z-index:10001;box-shadow:0 4px 12px rgba(0,0,0,0.15);
    font-family:'Inter',sans-serif;opacity:0;transition:opacity 0.3s;`;

  toast.textContent = message;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Hide after 3s
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---- Обработчики кнопок ---- */
function attachListeners() {
  // Ищем все кнопки с классом .js-open-tg
  document.querySelectorAll('.js-open-tg').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const topic = btn.dataset.topic || 'Заявка с сайта';
      const plan = btn.dataset.plan || '';
      openModal(topic, plan);
    });
  });
}

// Экспортируем функцию для глобального доступа (если нужно вызывать из inline onclick)
window.openBrokerBuroModal = function(topic, plan) {
  openModal(topic, plan);
};
