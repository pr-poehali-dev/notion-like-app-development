CREATE TABLE IF NOT EXISTS t_p68193026_notion_like_app_deve.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Без названия',
  emoji TEXT NOT NULL DEFAULT '📝',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p68193026_notion_like_app_deve.blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES t_p68193026_notion_like_app_deve.pages(id),
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL DEFAULT '',
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON t_p68193026_notion_like_app_deve.blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_position ON t_p68193026_notion_like_app_deve.blocks(page_id, position);
