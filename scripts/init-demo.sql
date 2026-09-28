-- Fictional local-only credentials. No production values belong in this repository.
CREATE DATABASE IF NOT EXISTS prep_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS prep_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'prep'@'localhost' IDENTIFIED BY 'prep_demo_local';
CREATE USER IF NOT EXISTS 'prep'@'%' IDENTIFIED BY 'prep_demo_local';
GRANT ALL ON prep_demo.* TO 'prep'@'localhost';
GRANT ALL ON prep_test.* TO 'prep'@'localhost';
GRANT ALL ON prep_demo.* TO 'prep'@'%';
GRANT ALL ON prep_test.* TO 'prep'@'%';
