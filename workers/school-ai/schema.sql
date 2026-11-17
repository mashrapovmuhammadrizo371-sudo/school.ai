-- SCHOOL.AI legacy data model on Cloudflare D1.
-- Apply with: wrangler d1 migrations apply school-ai-db
-- All school-owned records carry school_id for tenant isolation.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  photo_data TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  rejection_reason TEXT NOT NULL DEFAULT '',
  student_id TEXT NOT NULL DEFAULT '',
  is_blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  student_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  photo_data TEXT NOT NULL DEFAULT '',
  is_blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','admin','director')),
  subject TEXT NOT NULL DEFAULT '',
  is_blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  teacher TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  class_name TEXT NOT NULL,
  day INTEGER NOT NULL,
  lesson INTEGER NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_tasks (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  book TEXT NOT NULL DEFAULT '',
  pages INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_info (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL UNIQUE REFERENCES schools(id),
  text TEXT NOT NULL DEFAULT 'Savollar bo‘lsa, maktab administratoriga murojaat qiling.',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  class_name TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 45,
  questions_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  student_id TEXT NOT NULL,
  test_id TEXT REFERENCES tests(id) ON DELETE SET NULL,
  test_title TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'banner' CHECK(type IN ('banner','image')),
  url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_config (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL UNIQUE REFERENCES schools(id),
  bot_username TEXT NOT NULL DEFAULT '',
  mini_app_url TEXT NOT NULL DEFAULT '',
  channel_username TEXT NOT NULL DEFAULT '',
  webhook_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS security_contacts (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL UNIQUE REFERENCES schools(id),
  phone TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_school_status ON applications(school_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, class_name);
CREATE INDEX IF NOT EXISTS idx_staff_school_role ON staff(school_id, role);
CREATE INDEX IF NOT EXISTS idx_announcements_school_created ON announcements(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_books_school_created ON library_books(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subjects_school_name ON subjects(school_id, name);
CREATE INDEX IF NOT EXISTS idx_schedule_school_class_day ON schedule_entries(school_id, class_name, day, lesson);
CREATE INDEX IF NOT EXISTS idx_reading_school_created ON reading_tasks(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tests_school_created ON tests(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_results_school_student ON results(school_id, student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_media_school_created ON media_items(school_id, created_at);

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
