ALTER TYPE notification_type ADD VALUE 'FINGERPRINT_MOVED';

ALTER TABLE notifications ADD COLUMN data JSONB;

-- Subscribe all existing users to this personal notification
INSERT INTO user_notifications
SELECT id, 'FINGERPRINT_MOVED'::notification_type FROM users;
