-- Create enum for moderator audit action types
CREATE TYPE mod_audit_action AS ENUM (
    'EDIT_DELETE'
);

-- Create mod_audit table for tracking moderator actions
CREATE TABLE mod_audit (
    id UUID PRIMARY KEY,
    action mod_audit_action NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_id UUID NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX mod_audit_user_id_idx ON mod_audit(user_id);
CREATE INDEX mod_audit_target_id_idx ON mod_audit(target_id);
CREATE INDEX mod_audit_action_idx ON mod_audit(action);
CREATE INDEX mod_audit_created_at_idx ON mod_audit(created_at DESC);

-- Fix missing CASCADE on edit_votes
ALTER TABLE edit_votes
  DROP CONSTRAINT IF EXISTS edit_votes_edit_id_fkey,
  ADD CONSTRAINT edit_votes_edit_id_fkey
    FOREIGN KEY (edit_id) REFERENCES edits(id) ON DELETE CASCADE;
