CREATE TABLE prep_ingredients (
  inventory_id BIGINT PRIMARY KEY,
  base_unit VARCHAR(8) NOT NULL,
  purchase_increment_base DECIMAL(20,6) NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  FOREIGN KEY (inventory_id) REFERENCES inventory_items(id),
  CHECK (purchase_increment_base >= 0)
);
CREATE TABLE stock_lots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  inventory_id BIGINT NOT NULL,
  initial_quantity_base DECIMAL(20,6) NOT NULL,
  remaining_quantity_base DECIMAL(20,6) NOT NULL,
  input_unit VARCHAR(20) NOT NULL,
  unit_cost DECIMAL(18,4) NOT NULL,
  supplier VARCHAR(160),
  received_date DATE NOT NULL,
  label_date DATE,
  date_type VARCHAR(30) NOT NULL,
  opening_balance BOOLEAN NOT NULL DEFAULT FALSE,
  draft_line_id BIGINT,
  created_at DATETIME(6) NOT NULL,
  FOREIGN KEY (inventory_id) REFERENCES inventory_items(id),
  CHECK (remaining_quantity_base >= 0),
  CHECK (remaining_quantity_base <= initial_quantity_base),
  CHECK (unit_cost >= 0)
);
CREATE TABLE stock_movements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  inventory_id BIGINT NOT NULL,
  lot_id BIGINT NOT NULL,
  kind VARCHAR(30) NOT NULL,
  quantity_base DECIMAL(20,6) NOT NULL,
  reason VARCHAR(40),
  note VARCHAR(2000),
  actor VARCHAR(120) NOT NULL,
  request_key VARCHAR(100) NOT NULL UNIQUE,
  payload_hash CHAR(64) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  FOREIGN KEY (inventory_id) REFERENCES inventory_items(id),
  FOREIGN KEY (lot_id) REFERENCES stock_lots(id)
);
INSERT INTO prep_ingredients(inventory_id,base_unit)
SELECT id, CASE LOWER(unit) WHEN 'kg' THEN 'g' WHEN 'g' THEN 'g' WHEN 'l' THEN 'ml' WHEN 'liters' THEN 'ml' WHEN 'litres' THEN 'ml' WHEN 'ml' THEN 'ml' WHEN 'pieces' THEN 'count' WHEN 'count' THEN 'count' ELSE 'UNKNOWN' END
FROM inventory_items;
INSERT INTO stock_lots(inventory_id,initial_quantity_base,remaining_quantity_base,input_unit,unit_cost,received_date,label_date,date_type,opening_balance,created_at)
SELECT id,
  CAST(quantity_in_stock * CASE WHEN LOWER(unit) IN ('kg','l','liters','litres') THEN 1000 ELSE 1 END AS DECIMAL(20,6)),
  CAST(quantity_in_stock * CASE WHEN LOWER(unit) IN ('kg','l','liters','litres') THEN 1000 ELSE 1 END AS DECIMAL(20,6)),
  unit,unit_price,COALESCE(DATE(created_at),CURRENT_DATE),expiry_date,'UNKNOWN',TRUE,CURRENT_TIMESTAMP(6)
FROM inventory_items WHERE quantity_in_stock > 0;
