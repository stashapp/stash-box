DROP TRIGGER IF EXISTS update_edit_vote_count ON edit_votes;
DROP TRIGGER IF EXISTS insert_edit_vote_count ON edit_votes;

DROP FUNCTION IF EXISTS update_vote_count();

ALTER TABLE "edits" DROP COLUMN "votes";
