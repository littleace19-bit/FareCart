CREATE TABLE stores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id     TEXT NOT NULL,
  source          TEXT NOT NULL,
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  city            TEXT NOT NULL DEFAULT 'Bronx',
  state           TEXT NOT NULL DEFAULT 'NY',
  zip_code        TEXT NOT NULL,
  phone           TEXT,
  location        GEOGRAPHY(Point, 4326) NOT NULL,
  chain_name      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (source, platform_id)
);

ALTER TABLE stores ADD COLUMN lat DOUBLE PRECISION
  GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED;
ALTER TABLE stores ADD COLUMN lng DOUBLE PRECISION
  GENERATED ALWAYS AS (ST_X(location::geometry)) STORED;
