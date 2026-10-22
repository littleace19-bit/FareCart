CREATE TABLE savings_decisions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id           UUID,
  original_store_id   UUID REFERENCES stores(id) ON DELETE SET NULL,
  original_store_name TEXT NOT NULL,
  chosen_store_id     UUID REFERENCES stores(id) ON DELETE SET NULL,
  chosen_store_name   TEXT NOT NULL,
  original_total      NUMERIC(8, 2) NOT NULL,
  alternative_total   NUMERIC(8, 2) NOT NULL,
  price_savings       NUMERIC(8, 2) NOT NULL,
  net_savings         NUMERIC(8, 2),
  transit_cost        NUMERIC(8, 2),
  is_walkable         BOOLEAN,
  distance_meters     INTEGER,
  item_count          INTEGER NOT NULL,
  items_matched       INTEGER NOT NULL,
  items_missing       INTEGER NOT NULL,
  recommendation      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_savings_decisions_created_at ON savings_decisions (created_at DESC);
