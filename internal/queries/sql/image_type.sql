-- Image type vocabulary queries.
--
-- The vocabulary is seeded by migration and only sort_order is writable at
-- runtime, so there is no create or delete here.

-- name: GetAllImageTypeGroups :many
SELECT * FROM image_type_groups ORDER BY sort_order ASC;

-- name: GetAllImageTypes :many
SELECT * FROM image_types ORDER BY group_key ASC, sort_order ASC;

-- name: UpdateImageTypeGroupSortOrder :exec
-- Both sort_order unique constraints are deferred, so a reorder can be one
-- UPDATE per row without contriving a collision-free intermediate permutation.
UPDATE image_type_groups SET sort_order = $2 WHERE key = $1;

-- name: UpdateImageTypeSortOrder :exec
UPDATE image_types SET sort_order = $2 WHERE key = $1;

-- Image assignments

-- name: CreateImageTypeAssignments :copyfrom
INSERT INTO image_type_assignments (image_id, type_key) VALUES ($1, $2);

-- name: DeleteImageTypeAssignments :exec
DELETE FROM image_type_assignments WHERE image_id = $1;

-- name: FindImageTypesByImageIds :many
-- Ordered by the vocabulary rather than alphabetically, so an image's labels
-- read in the same priority order the admin set.
SELECT ita.image_id, ita.type_key
FROM image_type_assignments ita
JOIN image_types it ON it.key = ita.type_key
JOIN image_type_groups itg ON itg.key = it.group_key
WHERE ita.image_id = ANY(sqlc.arg(image_ids)::UUID[])
ORDER BY itg.sort_order ASC, it.sort_order ASC;

-- name: GetImageTypesByTarget :many
-- Types valid for one entity kind. $1 is a bare target name, e.g. 'PERFORMER'.
SELECT * FROM image_types
WHERE sqlc.arg(target)::text = ANY(valid_types)
ORDER BY group_key ASC, sort_order ASC;

-- User preferences

-- name: GetUserImageTypePreferences :many
SELECT type_key FROM user_image_type_preferences
WHERE user_id = $1
ORDER BY sort_order ASC;

-- name: DeleteUserImageTypePreferences :exec
DELETE FROM user_image_type_preferences WHERE user_id = $1;

-- name: CreateUserImageTypePreferences :copyfrom
INSERT INTO user_image_type_preferences (user_id, type_key, sort_order) VALUES ($1, $2, $3);

-- name: GetUserImageTypeGroupPreferences :many
SELECT group_key FROM user_image_type_group_preferences
WHERE user_id = $1
ORDER BY sort_order ASC;

-- name: DeleteUserImageTypeGroupPreferences :exec
DELETE FROM user_image_type_group_preferences WHERE user_id = $1;

-- name: CreateUserImageTypeGroupPreferences :copyfrom
INSERT INTO user_image_type_group_preferences (user_id, group_key, sort_order) VALUES ($1, $2, $3);

-- name: GetAllImageTypeConflicts :many
SELECT type_key, conflicts_with_key FROM image_type_conflicts;

-- Enabling

-- name: SetImageTypeGroupsEnabled :exec
-- Takes the complete set of disabled keys, so a group absent from the list is
-- enabled. A type added to the vocabulary later is therefore on by default,
-- which an "enabled set" would have silently reversed.
--
-- COALESCE because an array arriving as SQL NULL would set enabled = NULL on
-- every row rather than enabling them: NOT (key = ANY(NULL)) is NULL, not true.
UPDATE image_type_groups SET enabled = NOT ("key" = ANY(COALESCE(sqlc.arg(disabled)::text[], '{}')));

-- name: SetImageTypesEnabled :exec
UPDATE image_types SET enabled = NOT ("key" = ANY(COALESCE(sqlc.arg(disabled)::text[], '{}')));
