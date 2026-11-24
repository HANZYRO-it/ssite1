/* Füllt Betreiberangaben in Rechtstexten aus den Admin-Einstellungen (falls vorhanden) */
fetch('/api/settings').then(r => r.ok ? r.json() : {}).then(s => {
  const addr = [s.street, s.postalCity].filter(Boolean).join(', ');
  const contact = [s.publicEmail && 'E-Mail: ' + s.publicEmail, s.phone && 'Tel.: ' + s.phone, s.whatsapp && 'WhatsApp: +' + s.whatsapp.replace(/\D/g, ''), s.telegram && 'Telegram: @' + s.telegram.replace(/^@/, '')].filter(Boolean).join(', ');
  document.querySelectorAll('[data-s="address"]').forEach(e => { if (addr) e.textContent = addr; });
  document.querySelectorAll('[data-s="contactLine"]').forEach(e => { if (contact) e.textContent = contact; });
  if (s.taxNote) document.querySelectorAll('[data-s="taxNote"]').forEach(e => e.textContent = s.taxNote);
}).catch(() => {});
