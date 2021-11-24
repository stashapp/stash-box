UPDATE edits SET status = 'REJECTED', updated_at = NOW() WHERE status = 'PENDING';

CREATE TABLE "edit_votes" (
  "edit_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP NOT NULL,
  "vote" TEXT NOT NULL,
  PRIMARY KEY("edit_id", "user_id"),
  FOREIGN KEY("user_id") REFERENCES "users"("id"),
  FOREIGN KEY("edit_id") REFERENCES "edits"("id")
);

CREATE OR REPLACE FUNCTION update_vote_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE edits SET votes = SUBQUERY.votesum
  FROM (
    SELECT SUM(
      CASE
        WHEN vote = 'ACCEPT' THEN 1
        WHEN vote = 'REJECT' THEN -1
        ELSE 0
      END
    ) as votesum
    FROM edit_votes
    WHERE edit_id = NEW.edit_id
  ) SUBQUERY
  WHERE id = NEW.edit_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

DROP TRIGGER IF EXISTS update_edit_vote_count ON edit_votes;
DROP TRIGGER IF EXISTS insert_edit_vote_count ON edit_votes;
CREATE TRIGGER update_edit_vote_count AFTER UPDATE ON edit_votes FOR EACH ROW EXECUTE PROCEDURE update_vote_count();
CREATE TRIGGER insert_edit_vote_count AFTER INSERT ON edit_votes FOR EACH ROW EXECUTE PROCEDURE update_vote_count();
