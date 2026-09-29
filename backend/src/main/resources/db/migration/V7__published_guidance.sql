CREATE TABLE guidance_documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipe_id BIGINT NOT NULL,
  draft_version INT NOT NULL,
  draft_json LONGTEXT NOT NULL,
  published_version INT NULL,
  published_json LONGTEXT NULL,
  published_at DATETIME(6) NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_guidance_recipe FOREIGN KEY(recipe_id) REFERENCES prep_recipes(id) ON DELETE CASCADE,
  CHECK(draft_version > 0),
  CHECK(published_version IS NULL OR published_version > 0),
  INDEX(recipe_id)
);
CREATE TABLE guidance_publications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT NOT NULL,
  version INT NOT NULL,
  content_json LONGTEXT NOT NULL,
  published_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_publication_document FOREIGN KEY(document_id) REFERENCES guidance_documents(id) ON DELETE CASCADE,
  UNIQUE(document_id,version)
);
