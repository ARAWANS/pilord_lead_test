(function () {
  const config = window.PILORD_CONFIG || {};
  const form = document.getElementById('lead-form');
  const emailInput = document.getElementById('email');
  const submitButton = document.getElementById('submit-button');
  const status = document.getElementById('form-status');
  const quoteText = document.getElementById('quote-text');
  const formData = form ? form.dataset : {};

  const lineLink = document.getElementById('line-link');
  const telegramLink = document.getElementById('telegram-link');
  const telegramCardLink = document.getElementById('telegram-card-link');

  let quotes = [
    '“It feels like a spellbook disguised as a math game.”',
    '“The battles make practice feel surprisingly exciting.”',
    '“I wanted one more stage every time I cleared a level.”',
    '“The atmosphere makes learning feel adventurous, not repetitive.”',
  ];

  if (formData.quotes) {
    try {
      const parsedQuotes = JSON.parse(formData.quotes);
      if (Array.isArray(parsedQuotes) && parsedQuotes.length > 0) {
        quotes = parsedQuotes;
      }
    } catch (error) {
      void error;
    }
  }

  let quoteIndex = 0;
  window.setInterval(function rotateQuote() {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteText.style.opacity = '0';
    window.setTimeout(function swapText() {
      quoteText.textContent = quotes[quoteIndex];
      quoteText.style.opacity = '1';
    }, 180);
  }, 3600);

  if (config.lineUrl && lineLink) {
    lineLink.href = config.lineUrl;
  }
  if (config.telegramUrl && telegramLink) {
    telegramLink.href = config.telegramUrl;
  }
  if (config.telegramUrl && telegramCardLink) {
    telegramCardLink.href = config.telegramUrl;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = 'form-status';
    if (type) {
      status.classList.add(type);
    }
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function submitLead(email) {
    const url = (config.supabaseUrl || '').replace(/\/$/, '');
    const anonKey = config.supabaseAnonKey || '';
    const table = config.leadsTable || 'closed_test_leads';

    if (!url || !anonKey) {
      throw new Error(formData.configError || 'Landing page is not configured yet. Add Supabase URL and anon key in config.js.');
    }

    const response = await fetch(url + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: 'Bearer ' + anonKey,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email: email,
        source: formData.leadSource || 'landing_page',
        note: formData.leadNote || 'Request Play Store install link for closed test',
        request_locale: navigator.language || '',
        user_agent: navigator.userAgent || '',
        referrer: document.referrer || '',
      }),
    });

    if (response.ok) {
      return 'success';
    }

    if (response.status === 409) {
      return 'duplicate';
    }

    let message = 'Could not submit your request right now.';
    try {
      const payload = await response.json();
      if (payload && payload.message) {
        message = payload.message;
      }
    } catch (error) {
      void error;
    }
    throw new Error(message);
  }

  form.addEventListener('submit', async function handleSubmit(event) {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();

    if (!validateEmail(email)) {
      setStatus(formData.invalidEmail || 'Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    submitButton.disabled = true;
    setStatus(formData.sending || 'Sending your request...', null);

    try {
      const result = await submitLead(email);
      if (result === 'duplicate') {
        setStatus(formData.duplicate || 'You are already on the list. Please wait for the install link by email.', 'success');
      } else {
        form.reset();
        setStatus(formData.success || 'Please wait for the install link by email.', 'success');
      }
    } catch (error) {
      setStatus(error.message || formData.errorFallback || 'Something went wrong. Please try again later.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
})();
