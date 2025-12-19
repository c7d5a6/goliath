-- Insert initial users for testing
-- Note: In production, users should be created through registration endpoint

-- Admin user
INSERT INTO user (email, role, created_when, modified_when)
VALUES ('admin@goliath.com', 'ADMIN', datetime('now'), datetime('now'));

-- Regular user
INSERT INTO user (email, role, created_when, modified_when)
VALUES ('user@goliath.com', 'USER', datetime('now'), datetime('now'));

