CREATE TABLE guidance_photos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT NOT NULL,
  content_type VARCHAR(40) NOT NULL,
  photo_bytes LONGBLOB NOT NULL,
  caption VARCHAR(240) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  is_demo BOOLEAN NOT NULL,
  created_at DATETIME(6) NOT NULL,
  deleted_at DATETIME(6) NULL,
  CONSTRAINT fk_guidance_photo_document FOREIGN KEY(document_id) REFERENCES guidance_documents(id) ON DELETE CASCADE,
  INDEX idx_guidance_photos_document(document_id,id)
);

CREATE TABLE guidance_escalations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipe_id BIGINT NOT NULL,
  meal_date DATE NOT NULL,
  question VARCHAR(2000) NOT NULL,
  reported_by VARCHAR(120) NOT NULL,
  request_key VARCHAR(100) NOT NULL UNIQUE,
  payload_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  resolution_note VARCHAR(2000) NULL,
  created_at DATETIME(6) NOT NULL,
  resolved_at DATETIME(6) NULL,
  CONSTRAINT fk_escalation_recipe FOREIGN KEY(recipe_id) REFERENCES prep_recipes(id) ON DELETE CASCADE,
  INDEX idx_escalation_queue(created_at,id)
);
