
const LIMITS = { name: 100, contact: 150, message: 3000, items: 40 };
const s = (v, n) => String(v ?? '').trim().slice(0, n);
const jsonA = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const now = () => Math.floor(Date.now() / 1000);
const bg = (ctx, p) => { if (ctx && ctx.waitUntil) ctx.waitUntil(p); return p; };
async function sha256(str) { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)); return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function randToken(n = 24) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); }

// ===== Chat-Tabellen + Rate-Limit =====
let chatReady = false;
async function ensureChat(env) {
  if (chatReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, name TEXT, email TEXT, lang TEXT DEFAULT 'de', inquiry_id INTEGER, closed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_msg_at TEXT NOT NULL DEFAULT (datetime('now')), admin_seen_id INTEGER NOT NULL DEFAULT 0, customer_seen_id INTEGER NOT NULL DEFAULT 0, customer_ping INTEGER NOT NULL DEFAULT 0, notified_cust_at INTEGER NOT NULL DEFAULT 0, notified_admin_at INTEGER NOT NULL DEFAULT 0)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS chat_msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, sender TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_chat_msgs ON chat_msgs(chat_id, id)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS rate_limits (k TEXT NOT NULL, t INTEGER NOT NULL)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_rate ON rate_limits(k, t)')
  ]);
  chatReady = true;
}
async function rateLimit(env, request, name, max, sec) {
  const ip = request.headers.get('cf-connecting-ip'); if (!ip) return true;
  const k = name + ':' + (await sha256(ip)).slice(0, 16), t = now();
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM rate_limits WHERE t < ?').bind(t - 86400).run().catch(() => {});
  const r = await env.DB.prepare('SELECT COUNT(*) AS c FROM rate_limits WHERE k = ? AND t > ?').bind(k, t - sec).first();
  if (r && r.c >= max) return false;
  await env.DB.prepare('INSERT INTO rate_limits (k, t) VALUES (?, ?)').bind(k, t).run();
  return true;
}

// ===== Benachrichtigungen: E-Mail (Resend) + Telegram =====
const webhookReady = env => !!(env.MAIL_WEBHOOK_URL && env.MAIL_WEBHOOK_SECRET);
const mailReady = env => webhookReady(env) || !!(env.RESEND_API_KEY && env.EMAIL_FROM);
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Versand: 1) Google-Apps-Script-Webhook (Gmail, kostenlos, keine Domain nötig) 2) Resend (eigene Domain nötig)
async function sendMail(env, to, subject, text, html) {
  if (!mailReady(env) || !MAIL_RE.test(to || '')) return false;
  const replyTo = env.SUPPORT_EMAIL && to !== env.SUPPORT_EMAIL ? env.SUPPORT_EMAIL : undefined;
  try {
    if (webhookReady(env)) {
      const r = await fetch(env.MAIL_WEBHOOK_URL, { method: 'POST', redirect: 'follow', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ secret: env.MAIL_WEBHOOK_SECRET, to, subject, text, html, replyTo, fromName: env.MAIL_FROM_NAME || 'Z1PC' }) });
      const j = await r.json().catch(() => null);
      return r.ok && !!(j && j.ok);
    }
    const payload = { from: env.EMAIL_FROM, to: [to], subject, text };
    if (html) payload.html = html; if (replyTo) payload.reply_to = replyTo;
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return r.ok;
  } catch { return false; }
}
// Schönes HTML-Mail-Layout im Z1PC-Look (alle Werte werden escaped)
function mailLayout({ title, intro, ref, rows = [], items = [], total, steps = [], link, linkText, outro }) {
  const td = 'padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#222';
  return `<!doctype html><html><body style="margin:0;background:#f3f3f6"><div style="padding:24px 12px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08)">
<div style="background:#0b0b10;padding:20px 26px;border-bottom:4px solid #e8192c"><span style="font:italic 800 28px Arial,sans-serif;color:#fff;letter-spacing:-1px">Z1<span style="color:#e8192c">PC</span></span></div>
<div style="padding:28px 26px;color:#222;line-height:1.6;font-size:15px">
<h1 style="margin:0 0 10px;font-size:22px;color:#111">${esc(title)}</h1><p style="margin:0 0 18px">${esc(intro)}</p>
${ref ? `<div style="background:#fff1f2;border:1px solid #ffd0d4;border-radius:10px;padding:14px 18px;margin:0 0 20px"><div style="font-size:12px;color:#a8121f;text-transform:uppercase;letter-spacing:1px">Bestellnummer</div><div style="font-size:24px;font-weight:700;color:#e8192c;letter-spacing:.5px">${esc(ref)}</div></div>` : ''}
${items.length ? `<table style="width:100%;border-collapse:collapse;margin:0 0 6px">${items.map(it => `<tr><td style="${td}">${esc(it.qty)}× ${esc(it.name)}</td><td style="${td};text-align:right;white-space:nowrap">${esc(it.price)}</td></tr>`).join('')}${total ? `<tr><td style="padding:12px 0;font-weight:700">Summe</td><td style="padding:12px 0;font-weight:700;text-align:right;color:#e8192c;white-space:nowrap">${esc(total)}</td></tr>` : ''}</table>` : ''}
${rows.length ? `<table style="width:100%;border-collapse:collapse;margin:0 0 18px">${rows.map(r => `<tr><td style="${td};color:#777;width:38%">${esc(r[0])}</td><td style="${td}">${esc(r[1])}</td></tr>`).join('')}</table>` : ''}
${steps.length ? `<div style="margin:0 0 20px"><div style="font-weight:700;margin-bottom:6px">Wie geht es weiter?</div>${steps.map((x, n) => `<div style="margin:4px 0"><span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;background:#e8192c;color:#fff;border-radius:50%;font-size:12px;margin-right:8px">${n + 1}</span>${esc(x)}</div>`).join('')}</div>` : ''}
${link ? `<p style="margin:22px 0"><a href="${esc(link)}" style="background:#e8192c;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:700;display:inline-block">${esc(linkText || 'Zum Live-Chat')}</a></p>` : ''}
${outro ? `<p style="margin:0;color:#555">${esc(outro)}</p>` : ''}
</div><div style="background:#f7f7f9;padding:16px 26px;font-size:12px;color:#888">Z1PC · PC Systems aus Dortmund · Diese E-Mail wurde automatisch erstellt. Du kannst direkt darauf antworten.</div></div></div></body></html>`;
}
async function tgNotify(env, text) {
  if (!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)) return false;
  try { const r = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: text.slice(0, 3500), disable_web_page_preview: true }) }); return r.ok; } catch { return false; }
}
async function notifyAdmin(env, subject, text, html) {
  const a = await tgNotify(env, subject + '\n\n' + text);
  const b = env.SUPPORT_EMAIL ? await sendMail(env, env.SUPPORT_EMAIL, subject, text, html) : false;
  return a || b;
}

async function handleInquiry({ request, env, ctx }) {
  if (!env.DB) return jsonA({ error: 'not_configured' }, 503);
  let b; try { b = await request.json(); } catch { return jsonA({ error: 'bad_json' }, 400); }
  if (b.website) return jsonA({ ok: true, ref: 'Z1PC-0' });            // Honeypot: Bots still bestätigen
  await ensureChat(env); await ensureInq(env);
  if (!(await rateLimit(env, request, 'inq', 8, 3600))) return jsonA({ error: 'rate_limited' }, 429);
  const kind = 'inquiry';
  const d = { name: s(b.name, LIMITS.name), contact: s(b.contact, LIMITS.contact), message: s(b.message, LIMITS.message) };
  if (!d.name || !d.contact || !b.consent) return jsonA({ error: 'missing_fields' }, 422);
  if (kind === 'inquiry') {
    await ensureProducts(env);
    const cart = []; let total = 0;
    for (const x of (Array.isArray(b.cart) ? b.cart : []).slice(0, LIMITS.items)) {
      const qty = Math.min(9, Math.max(1, parseInt(x && x.qty) || 1)); let name = s(x && x.name, 120), price = null, category = '', id = null;
      if (x && Number.isInteger(x.id)) { const p = await env.DB.prepare("SELECT id, name, price, category FROM products WHERE id = ? AND status = 'active'").bind(x.id).first().catch(() => null); if (p) { id = p.id; name = p.name; price = p.price; category = p.category; } }
      let est = false;
      if (id == null && x && x.est && Number.isFinite(Number(x.price))) { price = Math.min(50000, Math.max(0, Math.round(Number(x.price)))); est = true; }
      if (!name) continue; cart.push({ id, name, qty, price, est, category, detail: s(x && x.detail, 1500), note: s(x && x.note, 1600) }); if (price != null) total += price * qty;
    }
    if (!cart.length) return jsonA({ error: 'empty_cart' }, 422);
    d.cart = cart; d.total = Math.round(total * 100) / 100; d.estTotal = cart.some(c => c.est);
    d.items = cart.map(c => `${c.qty}x ${c.name}${c.price != null ? ' - ' + (c.est ? 'ca. ' : '') + c.price + ' EUR' : ''}${c.detail ? ' (' + c.detail + ')' : ''}${c.note ? ' [' + c.note + ']' : ''}`);
    const PAY = ['Barzahlung vor Ort', 'Überweisung', 'PayPal'], DEL = ['Abholung', 'Lieferung (Dortmund, bis 30 km, kostenlos)', 'Versand (Kosten nach Absprache)'];
    d.payment = PAY.includes(b.payment) ? b.payment : PAY[0]; d.delivery = DEL.includes(b.delivery) ? b.delivery : DEL[0];
    if (!d.delivery.startsWith('Abholung')) { d.address = [s(b.street, 120), [s(b.zip, 10), s(b.city, 80)].filter(Boolean).join(' ')].filter(Boolean).join(', '); if (!d.address) return jsonA({ error: 'address_missing' }, 422); }
  }
  const lang = ['de', 'ru', 'uk', 'en'].includes(b.lang) ? b.lang : 'de';
  const r = await env.DB.prepare('INSERT INTO inquiries (kind, lang, payload) VALUES (?, ?, ?)')
    .bind(kind, lang, JSON.stringify(d)).run();
  const id = r.meta.last_row_id;
  const ref = `Z1PC-${kind === 'tradein' ? 'TI-' : ''}${new Date().getUTCFullYear()}-${String(id).padStart(6, '0')}`;
  await env.DB.prepare('UPDATE inquiries SET ref = ? WHERE id = ?').bind(ref, id).run();
  const email = MAIL_RE.test(d.contact) ? d.contact.toLowerCase() : '';
  const token = randToken(24);
  await env.DB.prepare('INSERT INTO chats (token, name, email, lang, inquiry_id) VALUES (?, ?, ?, ?, ?)').bind(token, d.name, email || null, lang, id).run();
  const origin = new URL(request.url).origin, link = `${origin}/?chat=${token}`, sumTxt = `${d.estTotal ? 'ca. ' : ''}${d.total} EUR`;
  bg(ctx, (async () => {
    await notifyAdmin(env, `🛒 Neue Z1PC Bestellung ${ref}`, `Name: ${d.name}\nKontakt: ${d.contact}\nLieferung: ${d.delivery} ${d.address || ''}\nZahlung: ${d.payment}\nNachricht: ${d.message}\nProdukte:\n${(d.items || []).join('\n')}\nSumme: ${sumTxt}\n\nAdmin: ${origin}/admin/#/orders`);
    if (email) {
      const itemsH = (d.cart || []).map(c => ({ qty: c.qty, name: c.name, price: c.price != null ? (c.est ? 'ca. ' : '') + (c.price * c.qty).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : 'Preis auf Anfrage' }));
      const rowsH = [['Zahlung', d.payment], ['Lieferung', d.delivery + (d.address ? ' – ' + d.address : '')]];
      const html = mailLayout({ title: `Danke für deine Bestellung, ${d.name}! 🎉`, intro: 'Wir haben deine Bestellung erhalten und kümmern uns jetzt darum.', ref, items: itemsH, total: (d.estTotal ? 'ca. ' : '') + Number(d.total).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €', rows: rowsH, steps: ['Wir prüfen deine Bestellung (Verfügbarkeit, Konfiguration).', 'Wir melden uns persönlich mit dem verbindlichen Endpreis.', 'Du bestätigst, und wir bereiten alles für Abholung, Lieferung oder Versand vor.'], link, linkText: 'Fragen? Zum Live-Chat', outro: 'Der Chat-Link funktioniert auch später noch, ganz ohne Anmeldung.' });
      const text = `Hallo ${d.name},\n\nvielen Dank für deine Bestellung!\n\nBestellnummer: ${ref}\n\n${(d.items || []).join('\n')}\nSumme: ${sumTxt}\nZahlung: ${d.payment}\nLieferung: ${d.delivery}${d.address ? ' – ' + d.address : ''}\n\nWie geht es weiter?\n1. Wir prüfen deine Bestellung.\n2. Wir melden uns persönlich mit dem verbindlichen Endpreis.\n3. Du bestätigst, wir bereiten alles vor.\n\nFragen? Live-Chat (auch später, ohne Anmeldung):\n${link}\n\nHerzliche Grüße\nDein Z1PC-Team`;
      await sendMail(env, email, `Z1PC: Deine Bestellung ${ref} ist eingegangen`, text, html);
    }
  })());
  return jsonA({ ok: true, ref, token, emailConfigured: mailReady(env) });
}

const STATUS = ['Neu', 'In Prüfung', 'Angebot gesendet', 'Angenommen', 'Versendet', 'Abgelehnt'];
const jsonB = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function authorized(request, env) {
  const t = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 24 || !t) return false;
  const h = async x => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(x)));
  const [a, b] = [await h(t), await h(env.ADMIN_TOKEN)];
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

let inqReady = false;
async function ensureInq(env) {
  if (inqReady) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT, kind TEXT NOT NULL, lang TEXT, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Neu', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))").run();
  for (const c of ['final_price REAL', 'decided_at TEXT', 'tracking TEXT']) { try { await env.DB.prepare('ALTER TABLE inquiries ADD COLUMN ' + c).run(); } catch {} }
  inqReady = true;
}
async function handleAdmin({ request, env }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  if (!(await authorized(request, env))) return jsonB({ error: 'unauthorized' }, 401);
  await ensureInq(env);
  const m = request.method;
  if (m === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, ref, kind, lang, payload, status, notes, final_price, decided_at, tracking, created_at FROM inquiries ORDER BY id DESC LIMIT 2000').all();
    return jsonB({ results });
  }
  if (m === 'PATCH') {
    const b = await request.json().catch(() => ({}));
    if (!Number.isInteger(b.id) || !STATUS.includes(b.status)) return jsonB({ error: 'bad_request' }, 400);
    let fp = null; if (b.final_price !== '' && b.final_price != null) { fp = Number(String(b.final_price).replace(',', '.')); if (!(fp >= 0 && fp < 1e7)) return jsonB({ error: 'bad_price' }, 422); }
    await env.DB.prepare("UPDATE inquiries SET status = ?, notes = ?, final_price = ?, tracking = ?, decided_at = CASE WHEN ? IN ('Angenommen','Versendet') THEN COALESCE(decided_at, datetime('now')) ELSE NULL END WHERE id = ?").bind(b.status, String(b.notes ?? '').slice(0, 2000), fp, s(b.tracking, 80), b.status, b.id).run();
    return jsonB({ ok: true });
  }
  if (m === 'DELETE') {
    const q = new URL(request.url).searchParams, ids = (q.get('ids') || q.get('id') || '').split(',').map(Number).filter(Number.isInteger).slice(0, 200);
    if (!ids.length) return jsonB({ error: 'bad_request' }, 400);
    await ensureChat(env);
    for (const id of ids) { await env.DB.prepare('DELETE FROM chat_msgs WHERE chat_id IN (SELECT id FROM chats WHERE inquiry_id = ?)').bind(id).run(); await env.DB.prepare('DELETE FROM chats WHERE inquiry_id = ?').bind(id).run(); await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run(); }
    return jsonB({ ok: true, deleted: ids.length });
  }
  if (m === 'POST') { // E-Mail-Antwort an Kunden (Resend)
    const b = await request.json().catch(() => ({}));
    const to = s(b.to, 150), subject = s(b.subject, 200), text = s(b.text, 5000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject || !text) return jsonB({ error: 'bad_request' }, 400);
    if (!mailReady(env)) return jsonB({ error: 'email_not_configured' }, 503);
    const ok = await sendMail(env, to, subject, text, mailLayout({ title: subject, intro: text.split('\n')[0] || '', outro: '' }).replace(/<p style="margin:0 0 18px">[\s\S]*?<\/p>/, '<div style="margin:0 0 18px;white-space:pre-wrap">' + esc(text) + '</div>'));
    return ok ? jsonB({ ok: true }) : jsonB({ error: 'send_failed' }, 502);
  }
  return jsonB({ error: 'method' }, 405);
}

// ===== Produkte =====
const CATS = ['gaming', 'creator', 'monitor', 'peripherals', 'accessories', 'other'], PST = ['active', 'hidden', 'sold'];
let schemaReady = false;
async function ensureProducts(env) {
  if (schemaReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'gaming',
    description TEXT DEFAULT '', specs TEXT DEFAULT '', price REAL, status TEXT NOT NULL DEFAULT 'active',
    sort INTEGER NOT NULL DEFAULT 0, image TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  try { await env.DB.prepare('ALTER TABLE products ADD COLUMN parts TEXT').run(); } catch {}
  try { await env.DB.prepare('ALTER TABLE products ADD COLUMN images TEXT').run(); } catch {}
  await env.DB.prepare("UPDATE products SET category = 'gaming' WHERE category = 'individual'").run();
  await env.DB.prepare("UPDATE products SET category = 'other' WHERE category = 'hardware'").run();
  schemaReady = true;
}
const IMG_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

async function handlePublicProducts({ env }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  await ensureProducts(env);
  const { results } = await env.DB.prepare(`SELECT id, name, category, description, specs, parts, price, status, updated_at,
    (image IS NOT NULL AND image != '') AS has_img, (CASE WHEN images IS NULL OR images = '' THEN 0 ELSE json_array_length(images) END) AS extra_n FROM products WHERE status IN ('active','sold') AND category != 'refurb' ORDER BY sort ASC, id DESC LIMIT 200`).all();
  return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' } });
}

async function handleProductImage({ request, env }) {
  if (!env.DB) return new Response('', { status: 503 });
  await ensureProducts(env);
  const id = Number(new URL(request.url).searchParams.get('id'));
  const r = Number.isInteger(id) ? await env.DB.prepare("SELECT image, images FROM products WHERE id = ? AND status IN ('active','sold')").bind(id).first() : null;
  const n = Number(new URL(request.url).searchParams.get('n')) || 0; let src = (r && r.image) || ''; if (r && n > 0) { try { src = JSON.parse(r.images || '[]')[n - 1] || ''; } catch { src = ''; } }
  const m = r && IMG_RE.exec(src);
  if (!m) return new Response('', { status: 404 });
  const bin = atob(m[2]), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'content-type': m[1], 'cache-control': 'public, max-age=86400' } });
}

async function handleAdminProducts({ request, env }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  if (!(await authorized(request, env))) return jsonB({ error: 'unauthorized' }, 401);
  await ensureProducts(env);
  const m = request.method;
  if (m === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, name, category, description, specs, parts, price, status, sort, image, images, created_at, updated_at FROM products ORDER BY sort ASC, id DESC LIMIT 300').all();
    return jsonB({ results });
  }
  if (m === 'DELETE') {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) return jsonB({ error: 'bad_request' }, 400);
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return jsonB({ ok: true });
  }
  if (m === 'POST' || m === 'PUT') {
    const b = await request.json().catch(() => null);
    if (!b) return jsonB({ error: 'bad_json' }, 400);
    const name = s(b.name, 120);
    if (!name) return jsonB({ error: 'name_missing' }, 422);
    const category = CATS.includes(b.category) ? b.category : 'other', status = PST.includes(b.status) ? b.status : 'active';
    let price = null;
    if (b.price !== '' && b.price != null) { price = Number(String(b.price).replace(',', '.')); if (!(price >= 0 && price < 1e6)) return jsonB({ error: 'bad_price' }, 422); }
    const sort = Number.isInteger(b.sort) ? b.sort : 0, description = s(b.description, 2000), specs = s(b.specs, 1500), parts = s(b.parts, 2500);
    let image; // undefined = unverändert
    if (b.image === '') image = '';
    else if (typeof b.image === 'string') { if (!IMG_RE.test(b.image) || b.image.length > 700000) return jsonB({ error: 'bad_image' }, 422); image = b.image; }
    let images; if (Array.isArray(b.images)) { if (b.images.length > 4 || b.images.reduce((a, u) => a + (typeof u === 'string' ? u.length : 0), 0) > 1200000 || b.images.some(u => typeof u !== 'string' || !IMG_RE.test(u) || u.length > 400000)) return jsonB({ error: 'bad_image' }, 422); images = JSON.stringify(b.images); }
    if (m === 'POST') {
      const r = await env.DB.prepare('INSERT INTO products (name, category, description, specs, parts, price, status, sort, image) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(name, category, description, specs, parts, price, status, sort, image || '').run();
      if (images !== undefined) await env.DB.prepare('UPDATE products SET images=? WHERE id=?').bind(images, r.meta.last_row_id).run();
      return jsonB({ ok: true, id: r.meta.last_row_id });
    }
    if (!Number.isInteger(b.id)) return jsonB({ error: 'bad_request' }, 400);
    if (image === undefined) await env.DB.prepare("UPDATE products SET name=?, category=?, description=?, specs=?, parts=?, price=?, status=?, sort=?, updated_at=datetime('now') WHERE id=?").bind(name, category, description, specs, parts, price, status, sort, b.id).run();
    else await env.DB.prepare("UPDATE products SET name=?, category=?, description=?, specs=?, parts=?, price=?, status=?, sort=?, image=?, updated_at=datetime('now') WHERE id=?").bind(name, category, description, specs, parts, price, status, sort, image, b.id).run();
    if (images !== undefined) await env.DB.prepare('UPDATE products SET images=? WHERE id=?').bind(images, b.id).run();
    return jsonB({ ok: true });
  }
  return jsonB({ error: 'method' }, 405);
}


// ===== Admin-verwaltbare Betreiber-/Kontaktinformationen =====
const SETTINGS_DEFAULT = {businessName:'Z1PC', operatorName:'', publicEmail:'', phone:'', whatsapp:'', telegram:'', region:'Dortmund, NRW', radiusKm:'30', street:'', postalCity:'', supportEmail:'', taxNote:''};
async function ensureSettings(env){ await env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')) )`).run(); }
async function handleSettings({request,env}){ if(!env.DB) return jsonB({error:'not_configured'},503); await ensureSettings(env); const p=new URL(request.url).pathname;
 if(p==='/api/settings' && request.method==='GET'){ const {results}=await env.DB.prepare('SELECT key,value FROM site_settings').all(); const out={...SETTINGS_DEFAULT}; for(const r of results){try{out[r.key]=JSON.parse(r.value)}catch{out[r.key]=r.value}} const publicKeys=['businessName','operatorName','publicEmail','phone','whatsapp','telegram','region','radiusKm','street','postalCity','taxNote']; const pub={}; for(const k of publicKeys)pub[k]=out[k]; return jsonB(pub); }
 if(p==='/api/admin/settings'){ if(!(await authorized(request,env))) return jsonB({error:'unauthorized'},401); if(request.method==='GET'){ const {results}=await env.DB.prepare('SELECT key,value FROM site_settings').all(); const out={...SETTINGS_DEFAULT}; for(const r of results){try{out[r.key]=JSON.parse(r.value)}catch{out[r.key]=r.value}} return jsonB(out); }
 if(request.method==='PUT'){ const b=await request.json().catch(()=>null); if(!b) return jsonB({error:'bad_json'},400); const out={}; for(const k of Object.keys(SETTINGS_DEFAULT)) out[k]=s(b[k], (k==='street'||k==='taxNote')?200:120); for(const [k,v] of Object.entries(out)) await env.DB.prepare('INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=datetime(\'now\')').bind(k,JSON.stringify(v)).run(); return jsonB({ok:true}); } } return jsonB({error:'method'},405); }

// ===== Help Center: Fragen von Kunden, Antworten im Admin =====
let qReady = false;
async function ensureQuestions(env) {
  if (qReady) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT, name TEXT NOT NULL, contact TEXT NOT NULL, text TEXT NOT NULL, lang TEXT, answer TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'Offen', created_at TEXT NOT NULL DEFAULT (datetime('now')), answered_at TEXT)").run();
  try {
    const old = await env.DB.prepare("SELECT id, ref, payload, created_at FROM inquiries WHERE payload LIKE '%[Help-Center]%'").all();
    for (const o of (old.results || [])) {
      let p = {}; try { p = JSON.parse(o.payload); } catch {}
      const text = String(p.message || '').replace('[Help-Center]', '').trim(); if (!text) continue;
      const r = await env.DB.prepare('INSERT INTO questions (ref, name, contact, text, lang, created_at) VALUES (?,?,?,?,?,?)').bind(o.ref || '', s(p.name, 100) || 'Kunde', s(p.contact, 150) || '-', text.slice(0, 2000), 'de', o.created_at).run();
      if (!o.ref) await env.DB.prepare('UPDATE questions SET ref = ? WHERE id = ?').bind(`Z1PC-Q-${new Date().getUTCFullYear()}-${String(r.meta.last_row_id).padStart(6, '0')}`, r.meta.last_row_id).run();
      await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(o.id).run();
    }
  } catch {}
  qReady = true;
}
const normC = v => String(v || '').toLowerCase().replace(/\s+/g, '');
const isMail = v => MAIL_RE.test(v);
async function handleQuestion({ request, env, ctx }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  await ensureQuestions(env); await ensureChat(env);
  if (!(await rateLimit(env, request, request.method === 'GET' ? 'qget' : 'qpost', request.method === 'GET' ? 40 : 6, request.method === 'GET' ? 600 : 3600))) return jsonB({ error: 'rate_limited' }, 429);
  if (request.method === 'GET') {
    const q = new URL(request.url).searchParams, ref = s(q.get('ref'), 40), contact = normC(q.get('contact'));
    if (!ref || !contact) return jsonB({ error: 'bad_request' }, 400);
    const r = await env.DB.prepare('SELECT ref, contact, text, answer, status, created_at, answered_at FROM questions WHERE ref = ?').bind(ref).first();
    if (!r || normC(r.contact) !== contact) return jsonB({ error: 'not_found' }, 404);
    delete r.contact; return jsonB(r);
  }
  if (request.method !== 'POST') return jsonB({ error: 'method' }, 405);
  const b = await request.json().catch(() => null); if (!b) return jsonB({ error: 'bad_json' }, 400);
  if (b.website) return jsonB({ ok: true, ref: 'Z1PC-Q-0' });
  const name = s(b.name, 100), contact = s(b.contact, 150), text = s(b.text, 2000);
  if (name.length < 2 || contact.length < 5 || text.length < 10 || !b.consent) return jsonB({ error: 'missing_fields' }, 422);
  const lang = ['de', 'ru', 'uk', 'en'].includes(b.lang) ? b.lang : 'de';
  const r = await env.DB.prepare('INSERT INTO questions (name, contact, text, lang) VALUES (?,?,?,?)').bind(name, contact, text, lang).run();
  const id = r.meta.last_row_id, ref = `Z1PC-Q-${new Date().getUTCFullYear()}-${String(id).padStart(6, '0')}`;
  await env.DB.prepare('UPDATE questions SET ref = ? WHERE id = ?').bind(ref, id).run();
  const origin = new URL(request.url).origin;
  bg(ctx, (async () => {
    await notifyAdmin(env, `❓ Z1PC Help-Center ${ref}`, `Von: ${name}\nKontakt: ${contact}\n\n${text}\n\nAntworten: ${origin}/admin/#/help`);
    if (isMail(contact)) await sendMail(env, contact.toLowerCase(), `Z1PC: Deine Frage ${ref} ist angekommen`, `Hallo ${name},\n\nvielen Dank für deine Frage (${ref})! Wir antworten dir persönlich. Die Antwort findest du auch im Help Center auf unserer Website.\n\nHerzliche Grüße\nDein Z1PC-Team`);
  })());
  return jsonB({ ok: true, ref });
}
async function handleAdminQuestions({ request, env }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  if (!(await authorized(request, env))) return jsonB({ error: 'unauthorized' }, 401);
  await ensureQuestions(env);
  const m = request.method;
  if (m === 'GET') { const { results } = await env.DB.prepare('SELECT id, ref, name, contact, text, lang, answer, status, created_at, answered_at FROM questions ORDER BY (status = \'Offen\') DESC, id DESC LIMIT 500').all(); return jsonB({ results }); }
  if (m === 'PATCH') {
    const b = await request.json().catch(() => ({})); if (!Number.isInteger(b.id)) return jsonB({ error: 'bad_request' }, 400);
    const answer = s(b.answer, 4000), status = answer ? 'Beantwortet' : 'Offen';
    await env.DB.prepare("UPDATE questions SET answer = ?, status = ?, answered_at = CASE WHEN ? != '' THEN datetime('now') ELSE NULL END WHERE id = ?").bind(answer, status, answer, b.id).run();
    let emailSent = false;
    if (b.notify && answer) {
      const row = await env.DB.prepare('SELECT ref, name, contact, text FROM questions WHERE id = ?').bind(b.id).first();
      if (row && isMail(row.contact)) emailSent = await sendMail(env, row.contact, `Z1PC Support: Antwort auf deine Frage ${row.ref}`, `Hallo ${row.name},\n\nvielen Dank für deine Frage:\n\n"${row.text}"\n\nUnsere Antwort:\n\n${answer}\n\nDu findest die Antwort auch im Help Center auf unserer Website (Nummer ${row.ref}).\n\nHerzliche Grüße\nDein Z1PC-Team`);
    }
    return jsonB({ ok: true, emailSent });
  }
  if (m === 'DELETE') {
    const q = new URL(request.url).searchParams, ids = (q.get('ids') || q.get('id') || '').split(',').map(Number).filter(Number.isInteger).slice(0, 200);
    if (!ids.length) return jsonB({ error: 'bad_request' }, 400);
    for (const id of ids) await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(id).run();
    return jsonB({ ok: true, deleted: ids.length });
  }
  return jsonB({ error: 'method' }, 405);
}


// ===== Live-Chat (Kunde: Token im Header, Admin: ADMIN_TOKEN) =====
const MSG_MAX = 2000;
async function chatByToken(request, env) {
  const t = request.headers.get('x-chat-token') || '';
  if (!/^[a-f0-9]{48}$/.test(t)) return null;
  return env.DB.prepare('SELECT * FROM chats WHERE token = ? AND closed = 0').bind(t).first();
}
async function handleChat({ request, env, ctx }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  await ensureChat(env);
  const url = new URL(request.url), p = url.pathname, m = request.method;
  if (p === '/api/chat/start' && m === 'POST') {
    if (!(await rateLimit(env, request, 'chatstart', 10, 3600))) return jsonB({ error: 'rate_limited' }, 429);
    const b = await request.json().catch(() => ({})) || {};
    const name = s(b.name, 80), email = s(b.email, 120).toLowerCase();
    if (name.length < 2) return jsonB({ error: 'name_required' }, 422);
    if (!MAIL_RE.test(email)) return jsonB({ error: 'email_required' }, 422);
    const lang = ['de', 'en', 'ru', 'uk'].includes(b.lang) ? b.lang : 'de', token = randToken(24);
    await env.DB.prepare('INSERT INTO chats (token, name, email, lang) VALUES (?, ?, ?, ?)').bind(token, name, email, lang).run();
    return jsonB({ ok: true, token });
  }
  const c = await chatByToken(request, env);
  if (!c) return jsonB({ error: 'unauthorized' }, 401);
  if (p === '/api/chat/me' && m === 'GET') return jsonB({ name: c.name, email: c.email || '' });
  if (p === '/api/chat/email' && m === 'POST') {
    const b = await request.json().catch(() => ({})) || {}, email = s(b.email, 120).toLowerCase();
    if (!MAIL_RE.test(email)) return jsonB({ error: 'email_required' }, 422);
    await env.DB.prepare('UPDATE chats SET email = ? WHERE id = ?').bind(email, c.id).run();
    return jsonB({ ok: true });
  }
  if (p === '/api/chat/unread' && m === 'GET') {
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM chat_msgs WHERE chat_id = ? AND sender = 'admin' AND id > ?").bind(c.id, c.customer_seen_id).first();
    return jsonB({ unread: r ? r.n : 0 });
  }
  if (p === '/api/chat/messages' && m === 'GET') {
    const after = Number(url.searchParams.get('after')) || 0, active = url.searchParams.get('active') === '1';
    const { results } = await env.DB.prepare('SELECT id, sender, body, created_at FROM chat_msgs WHERE chat_id = ? AND id > ? ORDER BY id ASC LIMIT 200').bind(c.id, after).all();
    if (active) {
      let mx = c.customer_seen_id; for (const x of results) if (x.sender === 'admin') mx = Math.max(mx, x.id);
      await env.DB.prepare('UPDATE chats SET customer_ping = ?, customer_seen_id = ? WHERE id = ?').bind(now(), mx, c.id).run();
    }
    return jsonB({ results });
  }
  if (p === '/api/chat/messages' && m === 'POST') {
    if (!(await rateLimit(env, request, 'chatmsg', 40, 600))) return jsonB({ error: 'rate_limited' }, 429);
    const b = await request.json().catch(() => ({})) || {}, body = s(b.body, MSG_MAX);
    if (!body) return jsonB({ error: 'empty' }, 422);
    await env.DB.prepare("INSERT INTO chat_msgs (chat_id, sender, body) VALUES (?, 'customer', ?)").bind(c.id, body).run();
    await env.DB.prepare("UPDATE chats SET last_msg_at = datetime('now'), customer_ping = ? WHERE id = ?").bind(now(), c.id).run();
    const origin = url.origin;
    bg(ctx, (async () => {
      const fresh = await env.DB.prepare('SELECT notified_admin_at FROM chats WHERE id = ?').bind(c.id).first();
      if (fresh && now() - fresh.notified_admin_at < 120) return;       // nicht jede Nachricht einzeln pushen
      await env.DB.prepare('UPDATE chats SET notified_admin_at = ? WHERE id = ?').bind(now(), c.id).run();
      await notifyAdmin(env, `💬 Z1PC Live-Chat: ${c.name || 'Kunde'}`, `${body}\n\nAntworten: ${origin}/admin/#/chat/${c.id}`);
    })());
    return jsonB({ ok: true });
  }
  return jsonB({ error: 'not_found' }, 404);
}

const CHAT_MAIL = {
  de: { s: 'Z1PC: neue Nachricht von uns', t: (n, b, l) => `Hallo ${n},\n\nwir haben dir im Z1PC Live-Chat geschrieben:\n\n„${b}“\n\nAntworten kannst du hier, ganz ohne Anmeldung:\n${l}\n\nHerzliche Grüße\nDein Z1PC-Team` },
  en: { s: 'Z1PC: new message from us', t: (n, b, l) => `Hi ${n},\n\nwe sent you a message in the Z1PC live chat:\n\n"${b}"\n\nReply here, no login needed:\n${l}\n\nBest regards\nYour Z1PC team` },
  ru: { s: 'Z1PC: новое сообщение', t: (n, b, l) => `Здравствуйте, ${n}!\n\nМы написали вам в чате Z1PC:\n\n«${b}»\n\nОтветить можно здесь, без регистрации:\n${l}\n\nС уважением,\nкоманда Z1PC` },
  uk: { s: 'Z1PC: нове повідомлення', t: (n, b, l) => `Вітаємо, ${n}!\n\nМи написали вам у чаті Z1PC:\n\n«${b}»\n\nВідповісти можна тут, без реєстрації:\n${l}\n\nЗ повагою,\nкоманда Z1PC` }
};
// Antwort des Admins -> Kunde per E-Mail, falls er gerade nicht im Chat ist
async function notifyCustomer(env, c, body, origin, force) {
  if (!c.email) return 'no_email';
  if (!mailReady(env)) return 'not_configured';
  if (!force && now() - c.customer_ping < 45) return 'active';
  if (!force && now() - c.notified_cust_at < 120) return 'debounced';
  const T = CHAT_MAIL[c.lang] || CHAT_MAIL.de;
  const ok = await sendMail(env, c.email, T.s, T.t(c.name || '', body.slice(0, 800), `${origin}/?chat=${c.token}`));
  if (ok) await env.DB.prepare('UPDATE chats SET notified_cust_at = ? WHERE id = ?').bind(now(), c.id).run();
  return ok ? 'sent' : 'failed';
}
async function handleAdminChat({ request, env }) {
  if (!env.DB) return jsonB({ error: 'not_configured' }, 503);
  if (!(await authorized(request, env))) return jsonB({ error: 'unauthorized' }, 401);
  await ensureChat(env);
  const url = new URL(request.url), p = url.pathname, m = request.method, origin = url.origin;
  if (p === '/api/admin/chat/list' && m === 'GET') {
    const { results } = await env.DB.prepare(`SELECT c.id, c.name, c.email, c.inquiry_id, c.last_msg_at, c.created_at, c.customer_ping,
      (SELECT COUNT(*) FROM chat_msgs x WHERE x.chat_id = c.id AND x.sender = 'customer' AND x.id > c.admin_seen_id) AS unread,
      (SELECT body FROM chat_msgs x WHERE x.chat_id = c.id ORDER BY x.id DESC LIMIT 1) AS last_body,
      (SELECT sender FROM chat_msgs x WHERE x.chat_id = c.id ORDER BY x.id DESC LIMIT 1) AS last_sender,
      (SELECT MAX(id) FROM chat_msgs x WHERE x.chat_id = c.id) AS last_id
      FROM chats c WHERE c.closed = 0 AND EXISTS (SELECT 1 FROM chat_msgs x WHERE x.chat_id = c.id) ORDER BY c.last_msg_at DESC LIMIT 200`).all();
    return jsonB({ results, now: now() });
  }
  if (p === '/api/admin/chat/open' && m === 'POST') {      // Chat zu einer Bestellung/Frage öffnen, optional mit erster Nachricht
    const b = await request.json().catch(() => ({})) || {};
    const iid = Number.isInteger(b.inquiry_id) ? b.inquiry_id : null, msg = s(b.msg, MSG_MAX);
    const em0 = s(b.email, 120).toLowerCase();
    let c = iid ? await env.DB.prepare('SELECT * FROM chats WHERE inquiry_id = ? AND closed = 0 ORDER BY id DESC LIMIT 1').bind(iid).first() : null;
    if (!c && MAIL_RE.test(em0)) c = await env.DB.prepare('SELECT * FROM chats WHERE email = ? AND closed = 0 ORDER BY id DESC LIMIT 1').bind(em0).first();
    if (!c) {
      const email = s(b.email, 120).toLowerCase(), name = s(b.name, 80) || 'Kunde', token = randToken(24);
      const r = await env.DB.prepare('INSERT INTO chats (token, name, email, lang, inquiry_id) VALUES (?, ?, ?, ?, ?)').bind(token, name, MAIL_RE.test(email) ? email : null, 'de', iid).run();
      c = await env.DB.prepare('SELECT * FROM chats WHERE id = ?').bind(r.meta.last_row_id).first();
    }
    let emailed = 'none';
    if (msg) {
      await env.DB.prepare("INSERT INTO chat_msgs (chat_id, sender, body) VALUES (?, 'admin', ?)").bind(c.id, msg).run();
      await env.DB.prepare("UPDATE chats SET last_msg_at = datetime('now') WHERE id = ?").bind(c.id).run();
      emailed = await notifyCustomer(env, c, msg, origin, true);
    }
    return jsonB({ ok: true, chat_id: c.id, emailed, link: `${origin}/?chat=${c.token}` });
  }
  const mm = p.match(/^\/api\/admin\/chat\/(\d+)(\/messages)?$/);
  if (!mm) return jsonB({ error: 'not_found' }, 404);
  const id = Number(mm[1]);
  const c = await env.DB.prepare('SELECT * FROM chats WHERE id = ?').bind(id).first();
  if (!c) return jsonB({ error: 'not_found' }, 404);
  if (!mm[2] && m === 'DELETE') {
    await env.DB.batch([env.DB.prepare('DELETE FROM chat_msgs WHERE chat_id = ?').bind(id), env.DB.prepare('DELETE FROM chats WHERE id = ?').bind(id)]);
    return jsonB({ ok: true });
  }
  if (mm[2] && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, sender, body, created_at FROM chat_msgs WHERE chat_id = ? ORDER BY id ASC LIMIT 500').bind(id).all();
    const mx = results.reduce((a, x) => Math.max(a, x.sender === 'customer' ? x.id : 0), c.admin_seen_id);
    if (mx > c.admin_seen_id) await env.DB.prepare('UPDATE chats SET admin_seen_id = ? WHERE id = ?').bind(mx, id).run();
    return jsonB({ results, chat: { id, name: c.name, email: c.email, inquiry_id: c.inquiry_id, customer_seen_id: c.customer_seen_id, online: now() - c.customer_ping < 45 } });
  }
  if (mm[2] && m === 'POST') {
    const b = await request.json().catch(() => ({})) || {}, body = s(b.body, MSG_MAX);
    if (!body) return jsonB({ error: 'empty' }, 422);
    await env.DB.prepare("INSERT INTO chat_msgs (chat_id, sender, body) VALUES (?, 'admin', ?)").bind(id, body).run();
    await env.DB.prepare("UPDATE chats SET last_msg_at = datetime('now') WHERE id = ?").bind(id).run();
    return jsonB({ ok: true, emailed: await notifyCustomer(env, c, body, origin, false) });
  }
  return jsonB({ error: 'method' }, 405);
}

// ===== Routing + Security-Header =====
const HIDDEN_FILES = ['/mail-script.gs', '/README.txt', '/DEPLOY.md', '/schema.sql', '/translations.json', '/_worker.js'];
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
async function route(request, env, ctx) {
  const p = new URL(request.url).pathname;
  if (HIDDEN_FILES.includes(p)) return new Response('Not found', { status: 404 });
  if (p === '/api/inquiry') return request.method === 'POST' ? handleInquiry({ request, env, ctx }) : new Response('Method not allowed', { status: 405 });
  if (p === '/api/question') return handleQuestion({ request, env, ctx });
  if (p === '/api/admin/questions') return handleAdminQuestions({ request, env });
  if (p === '/api/admin/inquiries') return handleAdmin({ request, env });
  if (p === '/api/admin/products') return handleAdminProducts({ request, env });
  if (p === '/api/settings' || p === '/api/admin/settings') return handleSettings({ request, env });
  if (p === '/api/products') return request.method === 'GET' ? handlePublicProducts({ env }) : new Response('Method not allowed', { status: 405 });
  if (p === '/api/product-image') return handleProductImage({ request, env });
  if (p.startsWith('/api/chat/')) return handleChat({ request, env, ctx });
  if (p.startsWith('/api/admin/chat/')) return handleAdminChat({ request, env });
  if (p.startsWith('/api/')) return jsonB({ error: 'not_found' }, 404);
  if (p.startsWith('/products/')) { const pid = p.split('/').pop(); return env.ASSETS.fetch(new Request(new URL('/product.html?id=' + encodeURIComponent(pid), request.url), request)); }
  return env.ASSETS.fetch(request);
}
export default {
  async fetch(request, env, ctx) {
    let res; try { res = await route(request, env, ctx); } catch (e) { res = jsonB({ error: 'server_error' }, 500); }
    const h = new Headers(res.headers);
    h.set('x-content-type-options', 'nosniff'); h.set('x-frame-options', 'DENY'); h.set('referrer-policy', 'strict-origin-when-cross-origin');
    h.set('permissions-policy', 'camera=(), microphone=(), geolocation=()'); h.set('content-security-policy', CSP);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }
};
