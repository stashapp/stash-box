-- Edit queries

-- name: CreateEdit :one
INSERT INTO edits (
    id, user_id, target_type, operation, data, votes, status, applied,
    created_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
RETURNING *;

-- name: UpdateEdit :one
UPDATE edits 
SET data = $2, votes = $3,
    status = $4, applied = $5, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteEdit :exec
DELETE FROM edits WHERE id = $1;

-- name: FindEdit :one
SELECT * FROM edits WHERE id = $1;

-- name: CancelUserEdits :exec
UPDATE edits SET status = 'CANCELED', updated_at = NOW() WHERE user_id = $1;

-- name: FindPendingPerformerCreation :many
SELECT * FROM edits
WHERE status = 'PENDING'
AND target_type = 'PERFORMER'
AND (
    (sqlc.narg('name')::text IS NOT NULL AND data->'new_data'->>'name' = sqlc.narg('name'))
    OR
    (sqlc.narg('urls')::text[] IS NOT NULL AND jsonb_exists_any(jsonb_path_query_array(data, '$.new_data.added_urls[*].url'), sqlc.narg('urls')))
);

-- name: FindPendingSceneCreation :many
SELECT * FROM edits
WHERE status = 'PENDING'
AND target_type = 'SCENE'
AND (
    (sqlc.narg('title')::text IS NOT NULL AND sqlc.narg('studio_id')::uuid IS NOT NULL
     AND data->'new_data'->>'title' = sqlc.narg('title')
     AND (data->'new_data'->>'studio_id')::uuid = sqlc.narg('studio_id'))
    OR
    (sqlc.narg('hashes')::text[] IS NOT NULL AND jsonb_exists_any(jsonb_path_query_array(data, '$.new_data.added_fingerprints[*].hash'), sqlc.narg('hashes')))
);

-- name: GetEditsByPerformer :many
SELECT e.* FROM edits e
JOIN performer_edits pe ON e.id = pe.edit_id
WHERE pe.performer_id = $1
ORDER BY e.created_at DESC;

-- name: GetEditsByStudio :many
SELECT e.* FROM edits e
JOIN studio_edits se ON e.id = se.edit_id
WHERE se.studio_id = $1
ORDER BY e.created_at DESC;

-- name: CreateTagEdit :exec
INSERT INTO tag_edits (edit_id, tag_id) VALUES ($1, $2);

-- name: CreateStudioEdit :exec
INSERT INTO studio_edits (edit_id, studio_id) VALUES ($1, $2);

-- name: CreateSceneEdit :exec
INSERT INTO scene_edits (edit_id, scene_id) VALUES ($1, $2);

-- name: CreatePerformerEdit :exec
INSERT INTO performer_edits (edit_id, performer_id) VALUES ($1, $2);

-- name: GetEditsByTag :many
SELECT e.* FROM edits e
JOIN tag_edits te ON e.id = te.edit_id
WHERE te.tag_id = $1
ORDER BY e.created_at DESC;

-- name: GetEditsByScene :many
SELECT e.* FROM edits e
JOIN scene_edits se ON e.id = se.edit_id
WHERE se.scene_id = $1
ORDER BY e.created_at DESC;

-- Edit comments

-- name: CreateEditComment :one
INSERT INTO edit_comments (id, edit_id, user_id, text, created_at) 
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;

-- name: UpdateEditComment :one
UPDATE edit_comments SET text = $2 WHERE id = $1
RETURNING *;

-- name: DeleteEditComment :exec
DELETE FROM edit_comments WHERE id = $1;

-- name: GetEditComments :many
SELECT * FROM edit_comments WHERE edit_id = $1 ORDER BY created_at ASC;

-- Edit votes

-- name: CreateEditVote :exec
INSERT INTO edit_votes (edit_id, user_id, vote, created_at) VALUES ($1, $2, $3, NOW());

-- name: UpdateEditVote :exec
UPDATE edit_votes SET vote = $3, created_at = now() WHERE edit_id = $1 AND user_id = $2;

-- name: DeleteEditVote :exec
DELETE FROM edit_votes WHERE edit_id = $1 AND user_id = $2;

-- name: GetEditVotes :many
SELECT * FROM edit_votes WHERE edit_id = $1;

-- name: ResetVotes :exec
UPDATE edit_votes
SET vote = 'ABSTAIN'
WHERE edit_id = $1;

-- URL merging queries for edits

-- name: GetMergedURLsForEdit :many
-- Gets current URLs for target entity and merges with edit's added_urls/removed_urls
WITH current_urls AS (
    SELECT su.url, su.site_id FROM edits e
    JOIN scene_edits se ON e.id = se.edit_id 
    JOIN scene_urls su ON se.scene_id = su.scene_id
    WHERE e.id = $1 AND e.target_type = 'SCENE'
    UNION ALL
    SELECT pu.url, pu.site_id FROM edits e  
    JOIN performer_edits pe ON e.id = pe.edit_id
    JOIN performer_urls pu ON pe.performer_id = pu.performer_id  
    WHERE e.id = $1 AND e.target_type = 'PERFORMER'
    UNION ALL
    SELECT stu.url, stu.site_id FROM edits e
    JOIN studio_edits ste ON e.id = ste.edit_id
    JOIN studio_urls stu ON ste.studio_id = stu.studio_id
    WHERE e.id = $1 AND e.target_type = 'STUDIO'
),
removed_urls AS (
    SELECT
        elem->>'url' AS url,
        elem->>'SiteID' AS site_id
    FROM edits, jsonb_array_elements(data->'new_data'->'removed_urls') AS elem
    WHERE id = $1
),
added_urls AS (
    SELECT
        elem->>'url' AS url,
        elem->>'SiteID' AS site_id
    FROM edits, jsonb_array_elements(data->'new_data'->'added_urls') AS elem
    WHERE id = $1
),
final_urls AS (
    SELECT url, site_id FROM current_urls
    WHERE (url, site_id) NOT IN (SELECT url, site_id FROM removed_urls)
    UNION
    SELECT url, site_id FROM added_urls
)
SELECT DISTINCT url, site_id FROM final_urls
ORDER BY url;

-- name: GetImagesForEdit :many
-- Gets current images for target entity and merges with edit's added_images/removed_images
WITH edit AS (
  SELECT * FROM edits WHERE edits.id = $1
), current_images AS (
    SELECT si.image_id FROM edit e
    JOIN scene_edits se ON e.id = se.edit_id
    JOIN scene_images si ON se.scene_id = si.scene_id
    UNION ALL
    SELECT pi.image_id FROM edit e
    JOIN performer_edits pe ON e.id = pe.edit_id
    JOIN performer_images pi ON pe.performer_id = pi.performer_id
    UNION ALL
    SELECT sti.image_id FROM edit e
    JOIN studio_edits ste ON e.id = ste.edit_id
    JOIN studio_images sti ON ste.studio_id = sti.studio_id
),
removed_images AS (
    SELECT jsonb_array_elements_text(data->'new_data'->>'removed_images') AS image_id
    FROM edit
),
added_images AS (
    SELECT jsonb_array_elements_text(data->'new_data'->>'added_images') AS image_id
    FROM edit
),
final_images AS (
    SELECT image_id FROM current_images
    WHERE image_id NOT IN (SELECT image_id FROM removed_images)
    UNION
    SELECT image_id FROM added_images
)
SELECT i.* FROM final_images fi
JOIN images i ON fi.image_id = i.id
ORDER BY i.id;

-- name: GetEditTargetID :one
SELECT CASE e.target_type
            WHEN 'SCENE' THEN se.scene_id
            WHEN 'PERFORMER' THEN pe.performer_id
            WHEN 'STUDIO' THEN ste.studio_id
            WHEN 'TAG' THEN te.tag_id
       END::UUID AS id, e.target_type
FROM edits e
LEFT JOIN scene_edits se ON e.id = se.edit_id
LEFT JOIN performer_edits pe ON e.id = pe.edit_id
LEFT JOIN studio_edits ste ON e.id = ste.edit_id
LEFT JOIN tag_edits te ON e.id = te.edit_id
WHERE e.id = $1;

-- name: GetEditPerformerAliases :many
WITH edit AS (
  SELECT * FROM edits WHERE id = $1
)
(
  SELECT alias
  FROM edit E
  JOIN performer_edits PE ON E.id = PE.edit_id
  JOIN performer_aliases PA ON PE.performer_id = PA.performer_id
  EXCEPT
  SELECT jsonb_array_elements_text(data->'new_data'->>'removed_aliases') AS alias FROM edit
)
UNION
SELECT jsonb_array_elements_text(data->'new_data'->>'added_aliases') AS alias FROM edit;

-- name: GetEditPerformerTattoos :many
WITH edit AS (
  SELECT * FROM edits WHERE id = $1
),
current_tattoos AS (
    SELECT location, description
    FROM edit E
    JOIN performer_edits PE ON E.id = PE.edit_id
    JOIN performer_tattoos PT ON PE.performer_id = PT.performer_id
),
removed_tattoos AS (
    SELECT
        elem->>'location' AS location,
        elem->>'description' AS description
    FROM edit, jsonb_array_elements(data->'new_data'->'removed_tattoos') AS elem
),
added_tattoos AS (
    SELECT
        elem->>'location' AS location,
        elem->>'description' AS description
    FROM edit, jsonb_array_elements(data->'new_data'->'added_tattoos') AS elem
),
final_tattoos AS (
    SELECT * FROM current_tattoos
    EXCEPT
    SELECT * FROM removed_tattoos
    UNION
    SELECT * FROM added_tattoos
)
SELECT DISTINCT location, description FROM final_tattoos;

-- name: GetEditPerformerPiercings :many
WITH edit AS (
  SELECT * FROM edits WHERE id = $1
),
current_piercings AS (
    SELECT location, description
    FROM edit E
    JOIN performer_edits PE ON E.id = PE.edit_id
    JOIN performer_piercings PP ON PE.performer_id = PP.performer_id
),
removed_piercings AS (
    SELECT
        elem->>'location' AS location,
        elem->>'description' AS description
    FROM edit, jsonb_array_elements(data->'new_data'->'removed_piercings') AS elem
),
added_piercings AS (
    SELECT
        elem->>'location' AS location,
        elem->>'description' AS description
    FROM edit, jsonb_array_elements(data->'new_data'->'added_piercings') AS elem
),
final_piercings AS (
    SELECT * FROM current_piercings
    EXCEPT
    SELECT * FROM removed_piercings
    UNION
    SELECT * FROM added_piercings
)
SELECT DISTINCT location, description FROM final_piercings;

-- name: GetMergedTagsForEdit :many
-- Gets current tags for target entity and merges with edit's added_tags/removed_tags
WITH edit AS (
  SELECT * FROM edits WHERE edits.id = $1
), current_tags AS (
    SELECT st.tag_id FROM edit e
    JOIN scene_edits se ON e.id = se.edit_id
    JOIN scene_tags st ON se.scene_id = st.scene_id
    WHERE e.target_type = 'SCENE'
),
removed_tags AS (
    SELECT jsonb_array_elements_text(data->'new_data'->>'removed_tags')::uuid AS tag_id
    FROM edit
),
added_tags AS (
    SELECT jsonb_array_elements_text(data->'new_data'->>'added_tags')::uuid AS tag_id
    FROM edit
),
final_tags AS (
    SELECT tag_id FROM current_tags
    EXCEPT
    SELECT tag_id FROM removed_tags
    UNION
    SELECT tag_id FROM added_tags
)
SELECT t.* FROM final_tags ft
JOIN tags t ON ft.tag_id = t.id
WHERE t.deleted = FALSE
ORDER BY t.name;

-- name: GetMergedPerformersForEdit :many
-- Gets current performers for target entity and merges with edit's added_performers/removed_performers
WITH edit AS (
  SELECT * FROM edits WHERE edits.id = $1
), current_performers AS (
    SELECT sp.performer_id, sp."as" FROM edit e
    JOIN scene_edits se ON e.id = se.edit_id
    JOIN scene_performers sp ON se.scene_id = sp.scene_id
    WHERE e.target_type = 'SCENE'
),
removed_performers AS (
    SELECT
        elem->>'performer_id' AS performer_id,
        elem->>'as' AS "as"
    FROM edit, jsonb_array_elements(data->'new_data'->'removed_performers') AS elem
),
added_performers AS (
    SELECT
        elem->>'performer_id' AS performer_id,
        elem->>'as' AS "as"
    FROM edit, jsonb_array_elements(data->'new_data'->'added_performers') AS elem
),
final_performers AS (
    SELECT performer_id, "as" FROM current_performers
    EXCEPT
    SELECT performer_id, "as" FROM removed_performers
    UNION
    SELECT performer_id, "as" FROM added_performers
)
SELECT sqlc.embed(p), fp."as" FROM final_performers fp
JOIN performers p ON fp.performer_id = p.id
WHERE p.deleted = FALSE
ORDER BY p.name;

-- name: GetMergedStudioAliasesForEdit :many
-- Gets current aliases for target studio entity and merges with edit's added_aliases/removed_aliases
WITH edit AS (
  SELECT * FROM edits WHERE id = $1
)
(
  SELECT alias
  FROM edit E
  JOIN studio_edits SE ON E.id = SE.edit_id
  JOIN studio_aliases SA ON SE.studio_id = SA.studio_id
  WHERE E.target_type = 'STUDIO'
  EXCEPT
  SELECT jsonb_array_elements_text(data->'new_data'->>'removed_aliases') AS alias FROM edit
)
UNION
SELECT jsonb_array_elements_text(data->'new_data'->>'added_aliases') AS alias FROM edit;

-- name: FindCompletedEdits :many
-- Returns pending edits that fulfill one of the criteria for being closed:
-- * The full voting period has passed
-- * The minimum voting period has passed, and the number of votes has crossed the voting threshold.
-- The latter only applies for destructive edits. Non-destructive edits get auto-applied when sufficient votes are cast.
SELECT * FROM edits
WHERE status = 'PENDING'
AND (
    (created_at <= (now()::timestamp - (INTERVAL '1 second' * sqlc.arg('voting_period'))) AND updated_at IS NULL)
    OR
    (updated_at <= (now()::timestamp - (INTERVAL '1 second' * sqlc.arg('voting_period'))) AND updated_at IS NOT NULL)
    OR (
        votes >= sqlc.arg('minimum_votes')
        AND (
            (created_at <= (now()::timestamp - (INTERVAL '1 second' * sqlc.arg('minimum_voting_period'))) AND updated_at IS NULL)
            OR
            (updated_at <= (now()::timestamp - (INTERVAL '1 second' * sqlc.arg('minimum_voting_period'))) AND updated_at IS NOT NULL)
        )
    )
);

-- name: GetEditsByIds :many
SELECT * FROM edits WHERE id = ANY($1::UUID[]);

-- name: GetEditCommentsByIds :many
SELECT * FROM edit_comments WHERE id = ANY($1::UUID[]);
