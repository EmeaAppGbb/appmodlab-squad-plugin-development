-- Safe migration: Adding new column with default
ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT NULL;

-- Safe migration: Adding index
CREATE INDEX idx_users_email ON users(email);

-- Safe migration: Creating new table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
