-- WARNING: Destructive migration examples

-- This will trigger an error in the safety checker
DROP TABLE old_analytics;

-- This will trigger a warning
ALTER TABLE users DROP COLUMN deprecated_field;

-- This will trigger an error
TRUNCATE TABLE temp_data;

-- This will trigger a warning
ALTER TABLE posts RENAME COLUMN content TO body;

-- This will trigger a warning
CREATE UNIQUE INDEX idx_users_username ON users(name);
