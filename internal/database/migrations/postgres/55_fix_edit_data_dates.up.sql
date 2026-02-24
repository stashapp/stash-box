-- Related to migration 42_date_columns.up.sql

-- Transform scene date in edit data (date, date_accuracy)
UPDATE edits
SET data =
      data
      ||
      CASE
        WHEN data->'old_data' ? 'date_accuracy' THEN
          -- build `{'old_data': <object>}` to replace the existing object
          jsonb_build_object(
            'old_data',
            ( -- base object: the existing 'old_data', without `date_accuracy`
              (data->'old_data') - 'date_accuracy'
            )
            ||
            -- override object: `{'date': <new value>}` to replace the existing value in `new_data`
            jsonb_build_object(
              'date',
              CASE data->'old_data'->>'date_accuracy'
                WHEN 'YEAR'  THEN left(data->'old_data'->>'date', 4)
                WHEN 'MONTH' THEN left(data->'old_data'->>'date', 7)
                ELSE data->'old_data'->>'date'
              END
            )
          )
        -- if `date_accuracy` does not exist, override nothing and continue
        ELSE '{}'::jsonb
      END
      ||
      CASE
        WHEN data->'new_data' ? 'date_accuracy' THEN
          -- build `{'new_data': <object>}` to replace the existing object
          jsonb_build_object(
            'new_data',
            ( -- base object: the existing 'new_data', without `date_accuracy`
              (data->'new_data') - 'date_accuracy'
            )
            ||
            -- override object: `{'date': <new value>}` to replace the existing value in `new_data`
            jsonb_build_object(
              'date',
              CASE data->'new_data'->>'date_accuracy'
                WHEN 'YEAR'  THEN left(data->'new_data'->>'date', 4)
                WHEN 'MONTH' THEN left(data->'new_data'->>'date', 7)
                ELSE data->'new_data'->>'date'
              END
            )
          )
        -- if `date_accuracy` does not exist, override nothing and continue
        ELSE '{}'::jsonb
      END
WHERE
    (data->'old_data' ? 'date_accuracy')
    OR
    (data->'new_data' ? 'date_accuracy');


-- Transform performers birthdate in edit data (birthdate, birthdate_accuracy)
UPDATE edits
SET data =
      data
      ||
      CASE
        WHEN data->'old_data' ? 'birthdate_accuracy' THEN
          -- build `{'old_data': <object>}` to replace the existing object
          jsonb_build_object(
            'old_data',
            ( -- base object: the existing 'old_data', without `birthdate_accuracy`
              (data->'old_data') - 'birthdate_accuracy'
            )
            ||
            -- override object: `{'birthdate': <new value>}` to replace the existing value in `new_data`
            jsonb_build_object(
              'birthdate',
              CASE data->'old_data'->>'birthdate_accuracy'
                WHEN 'YEAR'  THEN left(data->'old_data'->>'birthdate', 4)
                WHEN 'MONTH' THEN left(data->'old_data'->>'birthdate', 7)
                ELSE data->'old_data'->>'birthdate'
              END
            )
          )
        -- if `birthdate_accuracy` does not exist, override nothing and continue
        ELSE '{}'::jsonb
      END
      ||
      CASE
        WHEN data->'new_data' ? 'birthdate_accuracy' THEN
          -- build `{'new_data': <object>}` to replace the existing object
          jsonb_build_object(
            'new_data',
            ( -- base object: the existing 'new_data', without `birthdate_accuracy`
              (data->'new_data') - 'birthdate_accuracy'
            )
            ||
            -- build `{'birthdate': <new value>}` to replace the existing value in `new_data`
            jsonb_build_object(
              'birthdate',
              CASE data->'new_data'->>'birthdate_accuracy'
                WHEN 'YEAR'  THEN left(data->'new_data'->>'birthdate', 4)
                WHEN 'MONTH' THEN left(data->'new_data'->>'birthdate', 7)
                ELSE data->'new_data'->>'birthdate'
              END
            )
          )
        -- if `birthdate_accuracy` does not exist, override nothing and continue
        ELSE '{}'::jsonb
      END
WHERE
    (data->'old_data' ? 'birthdate_accuracy')
    OR
    (data->'new_data' ? 'birthdate_accuracy');
