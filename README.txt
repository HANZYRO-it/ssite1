Z1PC v13
========

DEPLOY (Cloudflare Pages + D1-Binding "DB")
-------------------------------------------
Secrets (Settings > Variables and Secrets):
  ADMIN_TOKEN        mind. 24 Zeichen (Login fürs Dashboard)
  MAIL_WEBHOOK_URL    URL deiner Google-Web-App (siehe unten, KEINE Domain nötig)
  MAIL_WEBHOOK_SECRET das Passwort aus mail-script.gs
  (Alternative nur mit eigener Domain: RESEND_API_KEY + EMAIL_FROM)
  SUPPORT_EMAIL      deine E-Mail (bekommt Bestellungen, Fragen, Chat-Nachrichten)
  TELEGRAM_BOT_TOKEN (optional, empfohlen) Token von @BotFather
  TELEGRAM_CHAT_ID   (optional, empfohlen) deine Chat-ID (Bot anschreiben, dann api.telegram.org/bot<TOKEN>/getUpdates)

Telegram braucht keine Domain und pusht Bestellungen, Fragen und Chat-Nachrichten direkt aufs Handy.

E-MAIL OHNE DOMAIN (Gmail über Google Apps Script, kostenlos)
------------------------------------------------------------
1. Auf script.google.com einloggen (mit dem Gmail-Konto, von dem die Mails kommen sollen) > Neues Projekt.
2. Inhalt von mail-script.gs hineinkopieren, SECRET durch ein langes Zufallspasswort ersetzen, speichern.
3. Bereitstellen > Neue Bereitstellung > Typ "Web-App" > Ausführen als: Ich > Zugriff: Jeder > Bereitstellen.
   Berechtigungen erlauben (Google warnt, weil die App ungeprüft ist: "Erweitert" > "Weiter").
4. Die Web-App-URL kopieren. In Cloudflare Pages > Settings > Variables and Secrets eintragen:
   MAIL_WEBHOOK_URL = diese URL, MAIL_WEBHOOK_SECRET = dein Passwort. Neu deployen.
5. Absender ist dein Gmail-Konto. Limit bei normalem Gmail: ca. 100 Mails pro Tag (reicht für einen Shop).
Hinweis: Kunden-Mails kommen von deiner Gmail-Adresse, Antworten landen in deinem Postfach.

LIVE-CHAT
---------
- Kein Login. Kunde gibt Name + E-Mail an und bekommt einen persönlichen Chat-Link (Token im Browser).
- Schreibt der Kunde: Admin bekommt Telegram + E-Mail (max. alle 2 Minuten) und Ton/Badge im Dashboard.
- Antwortet der Admin und der Kunde ist nicht im Chat: Kunde bekommt eine E-Mail mit Link zum Chat.
- Bestellbestätigungen enthalten den Chat-Link. "Preis senden" schreibt in den Chat und mailt den Kunden.

ADMIN-SEITEN
------------
#/orders Bestellungen | #/help Help-Center | #/chat Live-Chat | #/prod Produkte | #/settings Website & Betreiber

SICHERHEIT
----------
- Alte Konto-/Gast-Logins entfernt (Gast-Übernahme-Lücke). Alte Tabellen users/chat_* bleiben ungenutzt in der DB.
- Rate-Limits (Bestellung, Frage, Chat), Security-Header + CSP, README/schema.sql nicht öffentlich abrufbar.

OFFEN / HINWEISE
----------------
- Rechtstexte sind Entwürfe: vor Livegang rechtlich prüfen lassen (Impressum braucht eine ladungsfähige Anschrift).
- Konfigurator-Preise sind ca.-Richtwerte (Stand 23.11.2026, Speicherkrise: RAM/SSD/Grafikkarten schwanken stark). In shop.js unter PARTS anpassen.
- Google Fonts werden noch von Google geladen (im Datenschutz erwähnt). Besser: Schriften lokal hosten.
