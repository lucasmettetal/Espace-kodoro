CREATE TABLE IF NOT EXISTS organizers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  day TEXT NOT NULL,
  year TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  spots_total INTEGER NOT NULL DEFAULT 0,
  spots_taken INTEGER NOT NULL DEFAULT 0,
  organizer_id INTEGER REFERENCES organizers(id),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
