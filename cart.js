/* Z1PC Warenkorb – Drawer, Warenkorbseite, Richtpreise */
(function () {
  const L = {
    de: { t: 'Warenkorb', empty: 'Dein Warenkorb ist leer', emptySub: 'Wähle ein System oder konfiguriere deinen eigenen PC.', sum: 'Gesamt', sumApprox: 'Gesamt (ca.)', go: 'Zum Warenkorb', more: 'Weiter stöbern', rq: 'Preis auf Anfrage', rm: 'Entfernen', note: 'Richtpreis – den Endpreis bestätigen wir dir nach Prüfung. Bezahlt wird erst nach deiner Bestätigung.', qty: 'Menge' },
    en: { t: 'Cart', empty: 'Your cart is empty', emptySub: 'Pick a system or configure your own PC.', sum: 'Total', sumApprox: 'Total (approx.)', go: 'Go to cart', more: 'Keep browsing', rq: 'Price on request', rm: 'Remove', note: 'Guide price – we confirm the final price after review. You only pay after your confirmation.', qty: 'Qty' },
    ru: { t: 'Корзина', empty: 'Корзина пуста', emptySub: 'Выберите систему или соберите свой ПК.', sum: 'Итого', sumApprox: 'Итого (прим.)', go: 'В корзину', more: 'Продолжить', rq: 'Цена по запросу', rm: 'Удалить', note: 'Ориентировочная цена – итоговую подтвердим после проверки. Оплата только после вашего подтверждения.', qty: 'Кол-во' },
    uk: { t: 'Кошик', empty: 'Кошик порожній', emptySub: 'Оберіть систему або зберіть свій ПК.', sum: 'Разом', sumApprox: 'Разом (прибл.)', go: 'До кошика', more: 'Продовжити', rq: 'Ціна за запитом', rm: 'Видалити', note: 'Орієнтовна ціна – остаточну підтвердимо після перевірки. Оплата лише після вашого підтвердження.', qty: 'К-сть' }
  };
  const lang = () => localStorage.getItem('z1pc-lang') || 'de';
  const t = k => (L[lang()] || L.de)[k];
  const K = 'z1pc-cart-v2';
  const eur = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  let items = [];
  try { items = JSON.parse(localStorage.getItem(K) || '[]').filter(x => x && x.name).slice(0, 40); } catch {}
  try { localStorage.removeItem('z1pc-cart'); } catch {}

  const subs = [];
  const total = () => items.reduce((s, x) => s + (x.price != null ? x.price * x.qty : 0), 0);
  const count = () => items.reduce((s, x) => s + x.qty, 0);
  const hasEst = () => items.some(x => x.est);
  const priceText = x => x.price == null ? t('rq') : (x.est ? 'ca. ' : '') + eur(x.price * x.qty);

  function save() {
    try { localStorage.setItem(K, JSON.stringify(items)); } catch {}
    const c = document.getElementById('cartCount');
    if (c) { c.textContent = count(); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    subs.forEach(f => f());
  }

  function list(host) {
    host.replaceChildren();
    if (!items.length) {
      const e = mk('div', 'cart-empty');
      const logo = mk('img'); logo.src = '/logo-128.png'; logo.alt = ''; logo.width = 72; logo.height = 72;
      e.append(logo, mk('b', '', t('empty')), mk('span', '', t('emptySub')));
      host.append(e); return;
    }
    items.forEach((x, i) => {
      const r = mk('div', 'ci'), im = mk('div', 'ci-img');
      const g = mk('img'); g.alt = ''; g.src = x.img || '/logo-128.png'; if (!x.img) im.classList.add('is-logo'); im.append(g);
      const b = mk('div', 'ci-body');
      b.append(mk('b', '', x.name));
      if (x.sub) b.append(mk('small', '', x.sub));
      if (x.detail) { const d = mk('div', 'chips'); x.detail.split(' | ').forEach(p => d.append(mk('span', 'chip', p))); b.append(d); }
      if (x.note) b.append(mk('p', 'ci-note', x.note));
      const q = mk('select', 'ci-qty'); q.setAttribute('aria-label', t('qty'));
      for (let n = 1; n <= 9; n++) { const o = mk('option', '', n); o.value = n; o.selected = n === x.qty; q.append(o); }
      q.onchange = () => { x.qty = +q.value; save(); };
      const rm = mk('button', 'ci-rm', '✕'); rm.type = 'button'; rm.title = t('rm'); rm.setAttribute('aria-label', t('rm'));
      rm.onclick = () => { items.splice(i, 1); save(); };
      const p = mk('div', 'ci-price', priceText(x));
      const row = mk('div', 'ci-row'); row.append(q, p);
      b.append(row); r.append(im, b, rm); host.append(r);
    });
  }

  /* Drawer */
  const dr = mk('aside', 'drawer'), bd = mk('div', 'drawer-backdrop');
  dr.id = 'drawer'; dr.setAttribute('aria-label', 'Warenkorb');
  const hd = mk('div', 'drawer-head'), h2 = mk('h2'), x = mk('button', '', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
  hd.append(h2, x);
  const body = mk('div'), ft = mk('div', 'cart-foot'), sum = mk('div', 'ci-sum'), go = mk('a', 'cbtn main'), more = mk('button', 'cart-clear'), note = mk('p', 'tiny');
  body.id = 'cartItems'; go.href = '/cart.html'; more.type = 'button';
  ft.append(sum, go, more, note); dr.append(hd, body, ft);

  const open = () => { dr.classList.add('show'); bd.classList.add('show'); };
  const close = () => { dr.classList.remove('show'); bd.classList.remove('show'); };
  function paint() {
    h2.textContent = t('t'); go.textContent = t('go'); more.textContent = t('more'); note.textContent = t('note');
    list(body); ft.hidden = !items.length;
    sum.replaceChildren(mk('span', '', hasEst() ? t('sumApprox') : t('sum')), mk('b', '', (hasEst() ? 'ca. ' : '') + eur(total())));
  }
  subs.push(paint);
  x.onclick = close; bd.onclick = close; more.onclick = close;
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  function init() {
    document.body.append(bd, dr);
    const o = document.getElementById('cartOpen'); if (o) o.onclick = open;
    const c = document.getElementById('cartCount'); if (c) c.textContent = count();
    paint();
  }

  window.Cart = {
    items,
    add(p) {
      const f = p.id && items.find(i => i.id === p.id);
      if (f) f.qty = Math.min(9, f.qty + 1); else items.push({ qty: 1, ...p });
      save(); open();
    },
    clear() { items.length = 0; save(); },
    save, list, total, count, eur, open, close, hasEst, priceText, sub: f => subs.push(f), t
  };

  /* Kopfzeile: beim Runterscrollen ausblenden, beim Hochscrollen einblenden */
  (function () {
    let last = scrollY;
    const f = () => {
      const h = document.querySelector('.topbar'); if (!h) return;
      const y = scrollY; h.classList.toggle('scrolled', y > 30);
      const hide = y > last && y > 260 && !document.getElementById('nav')?.classList.contains('open');
      h.classList.toggle('hide', hide); last = y;
    };
    addEventListener('scroll', f, { passive: true }); document.addEventListener('DOMContentLoaded', f);
  })();

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  addEventListener('storage', e => { if (e.key === K) { try { items.splice(0, items.length, ...JSON.parse(e.newValue || '[]')); save(); } catch {} } });
})();
