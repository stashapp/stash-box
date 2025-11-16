-- Rename SiteID to site_id in URL objects within JSONB data

-- Update added_urls in new_data
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data,added_urls}',
  (
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN elem ? 'SiteID' THEN
          (elem - 'SiteID') || jsonb_build_object('site_id', elem->'SiteID')
        ELSE elem
      END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(data->'new_data'->'added_urls') elem
  )
)
WHERE data->'new_data' ? 'added_urls'
  AND jsonb_typeof(data->'new_data'->'added_urls') = 'array';

-- Update removed_urls in new_data
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data,removed_urls}',
  (
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN elem ? 'SiteID' THEN
          (elem - 'SiteID') || jsonb_build_object('site_id', elem->'SiteID')
        ELSE elem
      END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(data->'new_data'->'removed_urls') elem
  )
)
WHERE data->'new_data' ? 'removed_urls'
  AND jsonb_typeof(data->'new_data'->'removed_urls') = 'array';
