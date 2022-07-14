CREATE TABLE notifications (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    edit_id UUID REFERENCES edits(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP NOT NULL,
    read_at TIMESTAMP NOT NULL
);
CREATE INDEX notifications_idx ON notifications (user_id, read_at);
