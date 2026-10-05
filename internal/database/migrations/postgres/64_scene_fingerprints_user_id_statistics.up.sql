-- Some users have significant numbers of fingerprint submissions.
-- Raise the analyze target so these users are correctly taken into account.
ALTER TABLE scene_fingerprints ALTER COLUMN user_id SET STATISTICS 1000;
ANALYZE scene_fingerprints;
