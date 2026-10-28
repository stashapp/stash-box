-- Image type vocabulary queries
--
-- The vocabulary is seeded by migration and only sort_order is writable at
-- runtime, so there is no create or delete here

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

-- name: CreateImageTypeAssignments :execrows
INSERT INTO image_type_assignments (image_id, type_id)
SELECT sqlc.arg(image_id)::uuid, it.id
FROM unnest(sqlc.arg(type_keys)::text[]) AS requested(key)
JOIN image_types it ON it.key = requested.key;

-- name: DeleteImageTypeAssignments :exec
DELETE FROM image_type_assignments WHERE image_id = $1;

-- name: FindImageTypesByImageIds :many
-- Ordered by the vocabulary rather than alphabetically, so an image's labels
-- read in the same priority order the admin set
SELECT ita.image_id, it.key AS type_key
FROM image_type_assignments ita
JOIN image_types it ON it.id = ita.type_id
JOIN image_type_groups itg ON itg.key = it.group_key
WHERE ita.image_id = ANY(sqlc.arg(image_ids)::UUID[])
ORDER BY itg.sort_order ASC, it.sort_order ASC;

-- User preferences

-- name: GetUserImageTypePreferences :many
SELECT it.key FROM user_image_type_preferences preference
JOIN image_types it ON it.id = preference.type_id
WHERE preference.user_id = $1
ORDER BY preference.sort_order ASC;

-- name: DeleteUserImageTypePreferences :exec
DELETE FROM user_image_type_preferences WHERE user_id = $1;

-- name: CreateUserImageTypePreferences :execrows
INSERT INTO user_image_type_preferences (user_id, type_id, sort_order)
SELECT sqlc.arg(user_id)::uuid, it.id, requested.ordinality - 1
FROM unnest(sqlc.arg(type_keys)::text[]) WITH ORDINALITY AS requested(key, ordinality)
JOIN image_types it ON it.key = requested.key;

-- name: GetUserImageTypeGroupPreferences :many
SELECT group_key FROM user_image_type_group_preferences
WHERE user_id = $1
ORDER BY sort_order ASC;

-- name: DeleteUserImageTypeGroupPreferences :exec
DELETE FROM user_image_type_group_preferences WHERE user_id = $1;

-- name: CreateUserImageTypeGroupPreferences :copyfrom
INSERT INTO user_image_type_group_preferences (user_id, group_key, sort_order) VALUES ($1, $2, $3);

-- Enabling

-- name: SetImageTypeGroupsEnabled :exec
-- Takes the complete set of disabled keys, so a group absent from the list is
-- enabled. A type added to the vocabulary later is therefore on by default,
-- which an "enabled set" would have silently reversed
--
-- COALESCE because an array arriving as SQL NULL would set enabled = NULL on
-- every row rather than enabling them: NOT (key = ANY(NULL)) is NULL, not true
UPDATE image_type_groups SET enabled = NOT ("key" = ANY(COALESCE(sqlc.arg(disabled)::text[], '{}')));

-- name: SetImageTypesEnabled :exec
UPDATE image_types SET enabled = NOT ("key" = ANY(COALESCE(sqlc.arg(disabled)::text[], '{}')));
