CREATE TABLE grocery_items (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  external_id       TEXT NOT NULL,
  source            TEXT NOT NULL,
  name              TEXT NOT NULL,
  price             NUMERIC(8, 2) NOT NULL,
  original_price    NUMERIC(8, 2),
  unit_of_measure   TEXT,
  category          TEXT,
  image_url         TEXT,
  is_future_deal    BOOLEAN DEFAULT FALSE,
  deal_start_date   DATE,
  deal_end_date     DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (store_id, external_id, source)
);
