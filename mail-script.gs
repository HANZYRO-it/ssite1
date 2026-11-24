/**
 * Z1PC Mail-Versand über dein Gmail (kostenlos, KEINE eigene Domain nötig).
 * Einrichtung: siehe README.txt (Abschnitt "E-Mail ohne Domain").
 *
 * 1) SECRET unten durch ein langes, zufälliges Passwort ersetzen (z. B. 30+ Zeichen).
 * 2) Speichern, dann: Bereitstellen > Neue Bereitstellung > Typ "Web-App"
 *    Ausführen als: Ich | Zugriff: Jeder  > Bereitstellen > Berechtigungen erteilen.
 * 3) Die angezeigte Web-App-URL kopieren und in Cloudflare als MAIL_WEBHOOK_URL eintragen,
 *    das Passwort als MAIL_WEBHOOK_SECRET.
 */
const SECRET = 'HIER_EIN_LANGES_GEHEIMES_PASSWORT_EINTRAGEN';

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!SECRET || SECRET.indexOf('HIER_') === 0 || d.secret !== SECRET) return out({ ok: false, error: 'forbidden' });
    if (!d.to || !d.subject || !d.text) return out({ ok: false, error: 'bad_request' });
    const opts = { to: String(d.to), subject: String(d.subject), body: String(d.text), name: String(d.fromName || 'Z1PC') };
    if (d.html) opts.htmlBody = String(d.html);
    if (d.replyTo) opts.replyTo = String(d.replyTo);
    MailApp.sendEmail(opts);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Optionaler Test: im Editor "testMail" ausführen, dann kommt eine Mail an dich selbst.
function testMail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Z1PC Test', 'Wenn du das liest, funktioniert der Versand.');
}
