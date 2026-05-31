-- Allow moderators to edit and hide edit comments
ALTER TABLE edit_comments
  ADD COLUMN updated_at TIMESTAMP,
  ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- New moderator audit actions for comment moderation
ALTER TYPE mod_audit_action ADD VALUE IF NOT EXISTS 'EDIT_COMMENT_UPDATE';
ALTER TYPE mod_audit_action ADD VALUE IF NOT EXISTS 'EDIT_COMMENT_HIDE';
