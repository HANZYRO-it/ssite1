// Z1PC: Produkte aus dem Admin, je Kategorie ein eigener Bereich (leere Kategorien werden nicht angezeigt)
(async function () {
  const X = {
    de: { catOther: 'Sonstiges', priceReq: 'Preis auf Anfrage', soldOut: 'Verkauft', details: 'Details' },
    en: { catOther: 'Other', priceReq: 'Price on request', soldOut: 'Sold', details: 'Details' },
    ru: { catOther: 'Другое', priceReq: 'Цена по запросу', soldOut: 'Продано', details: 'Подробнее' },
    uk: { catOther: 'Інше', priceReq: 'Ціна за запитом', soldOut: 'Продано', details: 'Детальніше' }
  };
  for (const l in X) Object.assign(dict[l], X[l]);
  const host = document.querySelector('#systems .cards'), sec = document.getElementById('systems');
  const hide = () => { if (sec) sec.hidden = true; document.querySelectorAll('nav a[href="#systems"]').forEach(a => a.hidden = true); };
  let list; try { const r = await fetch('/api/products'); if (!r.ok) return hide(); list = await r.json(); } catch { return hide(); }
  if (!Array.isArray(list) || !list.length || !host) return hide();
  const t = k => dict[langSelect.value][k], mk = (tag, c, x) => { const e = document.createElement(tag); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const CATS = [['gaming', 'gaming'], ['creator', 'creator'], ['monitor', 'monitors'], ['peripherals', 'peripherals'], ['accessories', 'accessories'], ['other', 'catOther']];
  const LEGACY = { individual: 'gaming', hardware: 'other' };
  list.forEach(p => { p.category = LEGACY[p.category] || (CATS.some(c => c[0] === p.category) ? p.category : 'other'); });
  const wrap = mk('div', 'pwrap');
  function draw() {
    wrap.replaceChildren(); const bar = mk('div', 'catbar'); wrap.append(bar);
    for (const [k, key] of CATS) {
      const items = list.filter(p => p.category === k); if (!items.length) continue;
      const a = mk('a', 'pchip', t(key)); a.href = '#cat-' + k; bar.append(a);
      const s = mk('div', 'catsec'); s.id = 'cat-' + k; s.append(mk('h3', '', t(key))); const grid = mk('div', 'pgrid'); s.append(grid);
      for (const p of items) {
        const sold = p.status === 'sold', url = '/product.html?id=' + encodeURIComponent(p.id), c = mk('article', 'pcard' + (sold ? ' sold' : '')), im = mk('div', 'pimg');
        const img = p.has_img ? '/api/product-image?id=' + p.id + '&v=' + encodeURIComponent(p.updated_at) : null;
        const link = mk('a'); link.href = url; link.setAttribute('aria-label', p.name);
        if (img) { const i = document.createElement('img'); i.loading = 'lazy'; i.alt = p.name; i.src = img; link.append(i); }
        else { const i = document.createElement('img'); i.src = '/logo-128.png'; i.alt = p.name; i.className = 'is-logo'; link.append(i); }
        im.append(link); if (sold) im.append(mk('span', 'pbadge', t('soldOut')));
        const body = mk('div', 'card-body'), h = mk('h3'), ha = mk('a', '', p.name); ha.href = url; h.append(ha); body.append(h);
        const lines = (p.specs || '').split('\n').map(x => x.trim()).filter(Boolean);
        if (lines.length) { const ul = mk('ul', 'pspecs'); lines.slice(0, 3).forEach(x => ul.append(mk('li', '', x))); body.append(ul); } else if (p.description) { const d = p.description.replace(/\s+/g, ' ').trim(), cut = d.length > 110 ? d.slice(0, 110).replace(/[\s,.;:–-]+\S*$/, '') + ' …' : d; body.append(mk('p', 'pteaser', cut)); }
        const foot = mk('div', 'pfoot'); foot.append(mk('div', 'pprice', p.price == null ? t('priceReq') : Cart.eur(p.price)));
        const detail = mk('a', 'small-btn', t('details')); detail.href = url;
        const btn = mk('button', 'small-btn add', t('addInquiry')); btn.disabled = sold;
        btn.onclick = () => Cart.add({ id: p.id, name: p.name, price: p.price, img, sub: lines.slice(0, 2).join(' · ') });
        foot.append(detail, btn); body.append(foot); c.append(im, body); grid.append(c);
      }
      wrap.append(s);
    }
  }
  draw(); host.replaceWith(wrap); langSelect.addEventListener('change', draw);
})();
