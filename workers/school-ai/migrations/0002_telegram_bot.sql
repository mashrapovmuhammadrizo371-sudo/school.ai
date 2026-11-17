CREATE TABLE IF NOT EXISTS telegram_links (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL UNIQUE,
  school_id TEXT NOT NULL REFERENCES schools(id),
  link_type TEXT NOT NULL CHECK(link_type IN ('student','staff','application')),
  linked_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_telegram_links_school_type ON telegram_links(school_id,link_type);
CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS book_competition (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  video_file_id TEXT NOT NULL,
  book_number INTEGER NOT NULL,
  book_name TEXT NOT NULL,
  pages INTEGER NOT NULL,
  total_score REAL NOT NULL DEFAULT 0,
  teacher_comment TEXT NOT NULL DEFAULT '',
  scored INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_book_competition_school_student ON book_competition(school_id,student_id,created_at);
