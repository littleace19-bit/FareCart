CREATE INDEX idx_stores_location ON stores USING GIST (location);
CREATE INDEX idx_stores_active ON stores (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_items_deal_dates ON grocery_items (deal_start_date, deal_end_date);
CREATE INDEX idx_items_store_id ON grocery_items (store_id);
CREATE INDEX idx_items_category ON grocery_items (category);
