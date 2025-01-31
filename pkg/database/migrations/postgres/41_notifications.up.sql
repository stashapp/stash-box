DROP TYPE IF EXISTS notification_type;
CREATE TYPE notification_type AS ENUM (
  'FAVORITE_PERFORMER_SCENE',
  'FAVORITE_PERFORMER_EDIT',
  'FAVORITE_STUDIO_SCENE',
  'FAVORITE_STUDIO_EDIT',
  'COMMENT_OWN_EDIT',
  'DOWNVOTE_OWN_EDIT',
  'FAILED_OWN_EDIT',
  'COMMENT_COMMENTED_EDIT',
  'COMMENT_VOTED_EDIT',
  'UPDATED_EDIT'
);

CREATE TABLE notifications (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP
);
CREATE INDEX notifications_user_read_idx ON notifications (user_id, read_at);

CREATE TABLE user_notifications (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL
);
CREATE INDEX user_notifications_user_id_idx ON user_notifications (user_id);
CREATE INDEX user_notifications_type_idx ON user_notifications (type);

INSERT INTO user_notifications
SELECT id, type FROM unnest(enum_range(NULL::notification_type)) AS type CROSS JOIN users;
