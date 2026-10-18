CREATE OR REPLACE FUNCTION stores_in_viewport(
  sw_lng DOUBLE PRECISION,
  sw_lat DOUBLE PRECISION,
  ne_lng DOUBLE PRECISION,
  ne_lat DOUBLE PRECISION
)
RETURNS SETOF stores AS $$
  SELECT *
  FROM stores
  WHERE is_active = TRUE
    AND location && ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)::geography
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION stores_within_radius(
  user_lng DOUBLE PRECISION,
  user_lat DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 1609
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  chain_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
) AS $$
  SELECT
    s.id, s.name, s.address, s.chain_name, s.lat, s.lng,
    ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM stores s
  WHERE s.is_active = TRUE
    AND ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION nearest_stores(
  user_lng DOUBLE PRECISION,
  user_lat DOUBLE PRECISION,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  chain_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
) AS $$
  SELECT
    s.id, s.name, s.address, s.chain_name, s.lat, s.lng,
    ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM stores s
  WHERE s.is_active = TRUE
  ORDER BY s.location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
  LIMIT max_results;
$$ LANGUAGE sql STABLE;
