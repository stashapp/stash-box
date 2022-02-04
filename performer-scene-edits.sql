SELECT id
FROM edits
WHERE
	target_type = 'SCENE' AND
	(jsonb_path_query_array("data", '$.new_data.added_performers[*].performer_id')
	 || jsonb_path_query_array("data", '$.new_data.removed_performers[*].performer_id')
	) ? $1
GROUP BY id
