// Z1PC v2: Warenkorb (gespeichert, mit Senden per WhatsApp/Telegram), Kontakt-Dock, Kontaktkarten
(function () {
  const $ = id => document.getElementById(id);
  let wa = '', tg = '';
  const X = {
    de: { waDesc: 'Schnelle Antwort – auch Fotos und Sprachnachrichten.', tgDesc: 'Direkt schreiben – auch Screenshots und Dateien.', chatStart: 'Chat starten', cartSend: 'Anfrage senden', cartClear: 'Alles leeren', emptyT: 'Dein Warenkorb ist leer', emptyS: 'Wähle ein System oder stell dir deinen PC zusammen.', copied: 'Text kopiert – in Telegram einfügen und senden.', greet: 'Hallo Z1PC, ich habe eine Frage.', intro: 'Hallo Z1PC, ich interessiere mich für:', cfg: 'PC-Konfiguration' },
    en: { waDesc: 'Quick replies – photos and voice messages welcome.', tgDesc: 'Message us directly – screenshots and files welcome.', chatStart: 'Start chat', cartSend: 'Send enquiry', cartClear: 'Clear all', emptyT: 'Your cart is empty', emptyS: 'Pick a system or put your PC together.', copied: 'Text copied – paste it in Telegram and send.', greet: 'Hello Z1PC, I have a question.', intro: 'Hello Z1PC, I am interested in:', cfg: 'PC configuration' },
    ru: { waDesc: 'Быстрый ответ – можно фото и голосовые.', tgDesc: 'Пишите напрямую – скриншоты и файлы тоже можно.', chatStart: 'Начать чат', cartSend: 'Отправить запрос', cartClear: 'Очистить всё', emptyT: 'Корзина пуста', emptyS: 'Выберите систему или соберите свой ПК.', copied: 'Текст скопирован – вставьте в Telegram и отправьте.', greet: 'Здравствуйте, Z1PC, у меня вопрос.', intro: 'Здравствуйте, Z1PC, меня интересует:', cfg: 'Конфигурация ПК' },
    uk: { waDesc: 'Швидка відповідь – можна фото й голосові.', tgDesc: 'Пишіть напряму – скриншоти й файли теж можна.', chatStart: 'Почати чат', cartSend: 'Надіслати запит', cartClear: 'Очистити все', emptyT: 'Кошик порожній', emptyS: 'Оберіть систему або зберіть свій ПК.', copied: 'Текст скопійовано – вставте в Telegram і надішліть.', greet: 'Вітаю, Z1PC, у мене запитання.', intro: 'Вітаю, Z1PC, мене цікавить:', cfg: 'Конфігурація ПК' }
  };
  for (const l in X) Object.assign(dict[l], X[l]);
  const t = k => dict[langSelect.value][k];
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  const icon = id => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.append(u); return s; };



  // Kontaktkarten + schwebender Dock
  function setHrefs() {
    if (wa) { $('ccWa').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(t('greet')); $('hWa').textContent = '+' + wa; }
    if (tg) { $('ccTg').href = 'https://t.me/' + encodeURIComponent(tg); $('hTg').textContent = '@' + tg; }
    const d = document.querySelector('.dock'); if (d) { d.children[0].style.display = wa ? '' : 'none'; d.children[1].style.display = tg ? '' : 'none'; if (wa) d.children[0].href = $('ccWa').href; if (tg) d.children[1].href = $('ccTg').href; }
  }
  const dock = mk('div', 'dock');
  for (const [cls, ic, lab] of [['wa', 'i-wa', 'WhatsApp'], ['tg', 'i-tg', 'Telegram']]) {
    const a = mk('a', cls); a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', lab); a.append(icon(ic), mk('span', '', lab)); dock.append(a);
  }
  document.body.append(dock); setHrefs(); setLang(langSelect.value);
  window.z1Contact = (w, g) => { wa = (w || '').replace(/\D/g, ''); tg = (g || '').replace('@', ''); setHrefs(); };
  langSelect.addEventListener('change', setHrefs);
})();
