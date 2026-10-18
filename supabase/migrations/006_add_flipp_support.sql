ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS sale_story TEXT;
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS flyer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_items_source ON grocery_items (source);
CREATE INDEX IF NOT EXISTS idx_items_flyer_id ON grocery_items (flyer_id);
