-- The images an edit results in, stated once.
--
-- Three queries need this set -- GetImagesForEdit, GetImageTypesForEdit and
-- GetImageDatesForEdit -- and each carried its own copy of the same
-- twenty-four lines, because sqlc compiles every "-- name:" block into an
-- independent statement and a CTE cannot be shared between them. The copies
-- were byte-identical and commented "keep the copies in step", which they were
-- not: 3.3.7 found one of the three had lost the deduplication the other two
-- had.
--
-- A view rather than a function taking the edit id, which is what this wants to
-- be. sqlc will not type a table-returning function's columns, so a query
-- selecting from one does not compile -- tried, and it fails on exactly the two
-- queries that select image_id rather than only joining on it.
--
-- The cost of a view is that the filter arrives from outside, and the planner
-- has to push edit_id down through the UNION and into each branch. It does. On
-- 50k edits with 50k join rows the plan is an Index Scan on edits_pkey with the
-- id as its Index Cond, so one edit's jsonb is expanded rather than fifty
-- thousand
CREATE VIEW edit_final_images AS
WITH current_images AS (
    SELECT se.edit_id, si.image_id
    FROM scene_edits se
    JOIN scene_images si ON se.scene_id = si.scene_id
    UNION ALL
    SELECT pe.edit_id, pi.image_id
    FROM performer_edits pe
    JOIN performer_images pi ON pe.performer_id = pi.performer_id
    UNION ALL
    SELECT ste.edit_id, sti.image_id
    FROM studio_edits ste
    JOIN studio_images sti ON ste.studio_id = sti.studio_id
),
removed_images AS (
    SELECT e.id AS edit_id,
           jsonb_array_elements_text(
               COALESCE(e.data->'new_data'->'removed_images', '[]'::jsonb))::uuid AS image_id
    FROM edits e
),
added_images AS (
    SELECT e.id AS edit_id,
           jsonb_array_elements_text(
               COALESCE(e.data->'new_data'->'added_images', '[]'::jsonb))::uuid AS image_id
    FROM edits e
)
SELECT c.edit_id, c.image_id
FROM current_images c
WHERE NOT EXISTS (
    SELECT 1 FROM removed_images r
    WHERE r.edit_id = c.edit_id AND r.image_id = c.image_id
)
UNION
SELECT a.edit_id, a.image_id FROM added_images a;
