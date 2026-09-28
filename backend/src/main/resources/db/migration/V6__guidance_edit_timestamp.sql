ALTER TABLE guidance_notes ADD COLUMN updated_at DATETIME(6) NULL;
UPDATE guidance_notes SET updated_at=created_at;
ALTER TABLE guidance_notes MODIFY updated_at DATETIME(6) NOT NULL;
