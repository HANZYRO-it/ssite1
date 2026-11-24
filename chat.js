/* Z1PC Live-Chat (Kunde): kein Login nötig. Persönlicher Chat-Link = Token. Antworten kommen auch per E-Mail. */
(function () {
  const K = 'z1pc-chat';
  let token = localStorage.getItem(K) || '', open = false, lastId = 0, poll = null, unreadTimer = null, seen = 0, emailKnown = true;
  const I = {
    de: { title: 'Z1PC Live-Chat', ph: 'Nachricht schreiben…', send: 'Senden', intro: 'Schreib uns direkt. Unsere Antwort bekommst du hier im Chat und zusätzlich per E-Mail, auch wenn du nicht auf der Website bist.', name: 'Dein Name', email: 'Deine E-Mail', start: 'Chat starten', errName: 'Bitte Namen eingeben (min. 2 Zeichen).', errMail: 'Bitte eine gültige E-Mail eingeben.', errGen: 'Das hat leider nicht geklappt. Bitte später nochmal versuchen.', loading: 'Chat wird geladen…', empty: 'Schreib uns, wir antworten so schnell wie möglich.', me: 'Du', copy: 'Chat-Link kopieren', copied: 'Link kopiert ✓', mailAsk: 'Optional: E-Mail für Benachrichtigungen bei Antworten', mailSave: 'Speichern', limit: 'Zu viele Nachrichten. Bitte kurz warten.' },
    en: { title: 'Z1PC Live Chat', ph: 'Type a message…', send: 'Send', intro: 'Write to us directly. You get our reply here and by e-mail, even when you are not on the website.', name: 'Your name', email: 'Your e-mail', start: 'Start chat', errName: 'Please enter your name (min. 2 characters).', errMail: 'Please enter a valid e-mail.', errGen: 'Something went wrong. Please try again later.', loading: 'Loading chat…', empty: 'Write to us, we reply as soon as possible.', me: 'You', copy: 'Copy chat link', copied: 'Link copied ✓', mailAsk: 'Optional: e-mail to get notified about replies', mailSave: 'Save', limit: 'Too many messages. Please wait a moment.' },
    ru: { title: 'Z1PC Live-чат', ph: 'Напишите сообщение…', send: 'Отправить', intro: 'Пишите нам напрямую. Ответ придёт в чат и на e-mail, даже если вы не на сайте.', name: 'Ваше имя', email: 'Ваш e-mail', start: 'Начать чат', errName: 'Введите имя (мин. 2 символа).', errMail: 'Введите корректный e-mail.', errGen: 'Не получилось. Попробуйте позже.', loading: 'Загрузка чата…', empty: 'Напишите нам, ответим как можно скорее.', me: 'Вы', copy: 'Скопировать ссылку на чат', copied: 'Ссылка скопирована ✓', mailAsk: 'Необязательно: e-mail для уведомлений об ответах', mailSave: 'Сохранить', limit: 'Слишком много сообщений. Подождите немного.' },
    uk: { title: 'Z1PC Live-чат', ph: 'Напишіть повідомлення…', send: 'Надіслати', intro: 'Пишіть нам напряму. Відповідь прийде в чат і на e-mail, навіть якщо вас немає на сайті.', name: 'Ваше ім’я', email: 'Ваш e-mail', start: 'Почати чат', errName: 'Введіть ім’я (мін. 2 символи).', errMail: 'Введіть коректний e-mail.', errGen: 'Не вийшло. Спробуйте пізніше.', loading: 'Завантаження чату…', empty: 'Напишіть нам, відповімо якнайшвидше.', me: 'Ви', copy: 'Скопіювати посилання на чат', copied: 'Посилання скопійовано ✓', mailAsk: 'Необов’язково: e-mail для сповіщень про відповіді', mailSave: 'Зберегти', limit: 'Забагато повідомлень. Зачекайте трохи.' }
  };
  const lang = () => localStorage.getItem('z1pc-lang') || 'de', t = k => (I[lang()] || I.de)[k];
  const api = async (path, opts = {}) => {
    const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
    if (token) headers['x-chat-token'] = token;
    const r = await fetch(path, { ...opts, headers }), d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'err'), { status: r.status, data: d });
    return d;
  };
  const setToken = v => { token = v || ''; if (v) localStorage.setItem(K, v); else localStorage.removeItem(K); };

  // Chat-Link aus E-Mail (?chat=TOKEN) übernehmen
  let autoOpen = false;
  try { const u = new URL(location.href), q = u.searchParams.get('chat'); if (q && /^[a-f0-9]{48}$/.test(q)) { setToken(q); autoOpen = true; u.searchParams.delete('chat'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); } } catch {}

  const st = document.createElement('style');
  st.textContent = `.z1-chat-btn{position:fixed;right:18px;bottom:150px;z-index:40;width:56px;height:56px;border-radius:50%;border:0;background:linear-gradient(135deg,#e8192c,#c9101f);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 10px 30px #e8192c60;display:grid;place-items:center;transition:.2s}
  .z1-chat-btn:hover{transform:scale(1.06)}.z1-chat-btn b{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;padding:0 4px;background:#fff;color:#e8192c;border-radius:10px;font-size:12px;display:none;place-items:center;font-weight:700}
  .z1-panel{position:fixed;right:18px;bottom:220px;z-index:41;width:min(380px,calc(100vw - 24px));height:min(540px,72vh);background:#12121a;border:1px solid #34343f;border-radius:16px;display:none;flex-direction:column;box-shadow:0 24px 60px #000c;overflow:hidden}.z1-panel.open{display:flex}
  .z1-ph{padding:14px 16px;border-bottom:1px solid #2c3038;display:flex;align-items:center;justify-content:space-between;gap:8px}.z1-ph strong{font:italic 800 19px var(--display,'Saira Condensed',sans-serif);letter-spacing:.3px}.z1-ph span{display:flex;gap:4px}
  .z1-ph button{background:none;border:0;color:#aaa;cursor:pointer;font-size:17px;padding:2px 6px}.z1-ph button:hover{color:#fff}
  .z1-body{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .z1-msg{max-width:85%;padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
  .z1-msg.customer{align-self:flex-end;background:#2a1117;border:1px solid #5a2430}.z1-msg.admin{align-self:flex-start;background:#1a1d25;border:1px solid #333}
  .z1-msg small{display:block;font-size:10px;color:#7a808a;margin-top:4px}
  .z1-foot{padding:12px;border-top:1px solid #2c3038;display:flex;gap:8px}.z1-foot input{flex:1;min-width:0;padding:11px 12px;background:#0b0d11;border:1px solid #3a404b;border-radius:10px;color:#fff;font:inherit}
  .z1-foot button{background:var(--red,#e8192c);border:0;color:#fff;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}
  .z1-auth{padding:18px;display:flex;flex-direction:column;gap:10px}.z1-auth input{width:100%;padding:11px 12px;background:#0b0d11;border:1px solid #3a404b;border-radius:10px;color:#fff;font:inherit}
  .z1-auth button,.z1-mail button{background:#e8192c;border:0;color:#fff;border-radius:10px;padding:11px;font-weight:700;cursor:pointer}.z1-auth p{font-size:13px;color:#aab0bb;margin:0;line-height:1.5}
  .z1-mail{padding:8px 12px;border-top:1px solid #2c3038;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:11px;color:#8a909b}.z1-mail input{flex:1;min-width:120px;padding:7px 9px;background:#0b0d11;border:1px solid #3a404b;border-radius:8px;color:#fff;font:inherit}.z1-mail button{padding:7px 10px}`;
  document.head.append(st);

  const btn = document.createElement('button'); btn.className = 'z1-chat-btn'; btn.setAttribute('aria-label', 'Live-Chat'); btn.innerHTML = '💬<b></b>'; document.body.append(btn);
  const badge = btn.querySelector('b');
  const fixPos = () => { if (!document.querySelector('.dock')) { btn.style.bottom = '18px'; } };
  const panel = document.createElement('div'); panel.className = 'z1-panel';
  panel.innerHTML = `<div class="z1-ph"><strong></strong><span><button type="button" class="z1-link" title="">🔗</button><button type="button" class="z1-close" aria-label="Close">✕</button></span></div><div class="z1-body"></div><div class="z1-mail" hidden></div><div class="z1-foot" style="display:none"><input maxlength="2000"><button type="button"></button></div>`;
  document.body.append(panel);
  const body = panel.querySelector('.z1-body'), foot = panel.querySelector('.z1-foot'), input = foot.querySelector('input'), sendBtn = foot.querySelector('button'), mailBar = panel.querySelector('.z1-mail'), linkBtn = panel.querySelector('.z1-link');
  const txt = (tag, cls, s) => { const e = document.createElement(tag); if (cls) e.className = cls; if (s != null) e.textContent = s; return e; };
  function paintStatic() { panel.querySelector('strong').textContent = t('title'); input.placeholder = t('ph'); sendBtn.textContent = t('send'); linkBtn.title = t('copy'); linkBtn.style.display = token ? '' : 'none'; }
  const fmt = s => { try { return new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

  function showStart() {
    foot.style.display = 'none'; mailBar.hidden = true; clearInterval(poll); paintStatic(); body.replaceChildren();
    const w = txt('div', 'z1-auth'), n = txt('input'), e = txt('input'), err = txt('p'), go = txt('button', '', t('start'));
    n.placeholder = t('name'); n.maxLength = 80; n.autocomplete = 'name'; e.placeholder = t('email'); e.type = 'email'; e.maxLength = 120; e.autocomplete = 'email'; err.style.color = '#ff8a94';
    go.onclick = async () => {
      const name = n.value.trim(), email = e.value.trim();
      if (name.length < 2) { err.textContent = t('errName'); return; } if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = t('errMail'); return; }
      go.disabled = true;
      try { const d = await api('/api/chat/start', { method: 'POST', body: JSON.stringify({ name, email, lang: lang() }) }); setToken(d.token); showChat(); }
      catch (x) { err.textContent = x.status === 429 ? t('limit') : t('errGen'); go.disabled = false; }
    };
    w.append(txt('p', '', t('intro')), n, e, go, err); body.append(w);
  }
  function add(m) {
    const d = txt('div', 'z1-msg ' + (m.sender === 'admin' ? 'admin' : 'customer'), m.body);
    d.append(txt('small', '', (m.sender === 'admin' ? 'Z1PC' : t('me')) + ' · ' + fmt(m.created_at))); body.append(d);
  }
  async function load(reset) {
    if (!token) return;
    try {
      const d = await api('/api/chat/messages?active=1&after=' + (reset ? 0 : lastId));
      if (reset) { body.replaceChildren(); lastId = 0; if (!d.results.length) body.append(txt('p', '', t('empty'))); }
      const stick = body.scrollHeight - body.scrollTop - body.clientHeight < 80 || reset;
      if (d.results.length && !reset && body.querySelector('p')) body.replaceChildren();
      for (const m of d.results) { add(m); lastId = Math.max(lastId, m.id); }
      if (d.results.length && stick) body.scrollTop = body.scrollHeight;
      badge.style.display = 'none'; document.title = document.title.replace(/^\(\d+\) /, '');
    } catch (e) { if (e.status === 401) { setToken(''); showStart(); } }
  }
  async function showChat() {
    paintStatic(); foot.style.display = 'flex'; body.replaceChildren(txt('p', '', t('loading')));
    try {
      const me = await api('/api/chat/me'); emailKnown = !!me.email; drawMail();
      await load(true); clearInterval(poll); poll = setInterval(() => { if (open && !document.hidden) load(false); }, 3000); input.focus();
    } catch (e) { if (e.status === 401) { setToken(''); showStart(); } else body.replaceChildren(txt('p', '', t('errGen'))); }
  }
  function drawMail() {
    mailBar.hidden = emailKnown; if (emailKnown) return; mailBar.replaceChildren();
    const i = txt('input'); i.type = 'email'; i.placeholder = t('mailAsk'); i.maxLength = 120; const b = txt('button', '', t('mailSave'));
    b.onclick = async () => { try { await api('/api/chat/email', { method: 'POST', body: JSON.stringify({ email: i.value.trim() }) }); emailKnown = true; drawMail(); } catch { i.style.borderColor = '#e8192c'; } };
    mailBar.append(i, b);
  }
  async function send() {
    const v = input.value.trim(); if (!v || !token) return; input.value = '';
    try { await api('/api/chat/messages', { method: 'POST', body: JSON.stringify({ body: v }) }); await load(false); }
    catch (e) { input.value = v; if (e.status === 429) alert(t('limit')); else if (e.status === 401) { setToken(''); showStart(); } }
  }
  async function checkUnread() {
    if (!token || open || document.hidden) return;
    try { const d = await api('/api/chat/unread'); const n = d.unread || 0; badge.textContent = n; badge.style.display = n ? 'grid' : 'none';
      document.title = document.title.replace(/^\(\d+\) /, ''); if (n) document.title = '(' + n + ') ' + document.title; seen = n; } catch (e) { if (e.status === 401) setToken(''); }
  }
  function toggle(v) {
    panel.style.bottom = btn.style.bottom === '18px' ? '86px' : '';
    open = v === undefined ? !open : v; panel.classList.toggle('open', open); if (!open) return;
    if (token) showChat(); else showStart();
  }
  btn.onclick = () => toggle(); panel.querySelector('.z1-close').onclick = () => toggle(false);
  linkBtn.onclick = async () => { try { await navigator.clipboard.writeText(location.origin + '/?chat=' + token); linkBtn.textContent = '✓'; alert(t('copied')); setTimeout(() => linkBtn.textContent = '🔗', 1500); } catch { prompt(t('copy'), location.origin + '/?chat=' + token); } };
  sendBtn.onclick = send; input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  window.addEventListener('z1pc-lang', paintStatic); paintStatic();
  fixPos(); window.addEventListener('load', fixPos);
  window.Z1Chat = { setToken, open: () => toggle(true) };
  unreadTimer = setInterval(checkUnread, 20000); setTimeout(checkUnread, 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (open) load(false); else checkUnread(); } });
  if (autoOpen) setTimeout(() => toggle(true), 400);
})();
