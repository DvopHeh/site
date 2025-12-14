CREATE TABLE IF NOT EXISTS blog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  published BOOLEAN DEFAULT 0,
  tags TEXT DEFAULT '[]',
  author TEXT DEFAULT 'dvop',
  featured_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slug ON blog(slug);
CREATE INDEX idx_published ON blog(published);
