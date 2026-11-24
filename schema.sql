CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT,
  kind TEXT NOT NULL,            -- 'inquiry' | 'tradein'
  lang TEXT,
  payload TEXT NOT NULL,         -- JSON
  status TEXT NOT NULL DEFAULT 'Neu',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- v8: zusätzliche Spalten (werden vom Worker automatisch ergänzt, falls sie fehlen)
-- ALTER TABLE inquiries ADD COLUMN final_price REAL;
-- ALTER TABLE inquiries ADD COLUMN decided_at TEXT;


-- v12: Live-Chat (wird vom Worker automatisch angelegt)
CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, name TEXT, email TEXT, lang TEXT DEFAULT 'de', inquiry_id INTEGER, closed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_msg_at TEXT NOT NULL DEFAULT (datetime('now')), admin_seen_id INTEGER NOT NULL DEFAULT 0, customer_seen_id INTEGER NOT NULL DEFAULT 0, customer_ping INTEGER NOT NULL DEFAULT 0, notified_cust_at INTEGER NOT NULL DEFAULT 0, notified_admin_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS chat_msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, sender TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS rate_limits (k TEXT NOT NULL, t INTEGER NOT NULL);
