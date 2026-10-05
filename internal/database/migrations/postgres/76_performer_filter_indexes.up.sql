-- queryPerformers applies these filters only to active performers. Individual
-- indexes let PostgreSQL combine selective predicates with bitmap scans while
-- keeping each index small.
CREATE INDEX performers_height_idx ON performers (height) WHERE NOT deleted;
CREATE INDEX performers_band_size_idx ON performers (band_size) WHERE NOT deleted;
CREATE INDEX performers_waist_size_idx ON performers (waist_size) WHERE NOT deleted;
CREATE INDEX performers_hip_size_idx ON performers (hip_size) WHERE NOT deleted;
CREATE INDEX performers_career_start_year_idx ON performers (career_start_year) WHERE NOT deleted;
CREATE INDEX performers_career_end_year_idx ON performers (career_end_year) WHERE NOT deleted;

CREATE INDEX performers_eye_color_idx ON performers (eye_color) WHERE NOT deleted;
CREATE INDEX performers_hair_color_idx ON performers (hair_color) WHERE NOT deleted;
CREATE INDEX performers_breast_type_idx ON performers (breast_type) WHERE NOT deleted;

-- Existing trigram indexes cover name and disambiguation searches. These
-- btree indexes cover the remaining scalar filters and their null modifiers.
CREATE INDEX performers_gender_idx ON performers (gender) WHERE NOT deleted;
CREATE INDEX performers_ethnicity_idx ON performers (ethnicity) WHERE NOT deleted;
CREATE INDEX performers_country_idx ON performers (country) WHERE NOT deleted;
CREATE INDEX performers_birthdate_idx ON performers (birthdate) WHERE NOT deleted;
CREATE INDEX performers_deathdate_idx ON performers (deathdate) WHERE NOT deleted;

-- Equality and ordered cup-size comparisons use different expressions in
-- queryPerformers, so both expression indexes are required.
CREATE INDEX performers_cup_size_eq_idx
    ON performers ((UPPER(TRIM(cup_size))))
    INCLUDE (cup_size)
    WHERE NOT deleted;

CREATE INDEX performers_cup_size_order_idx
    ON performers (((CASE UPPER(TRIM(cup_size))
        WHEN 'AAA' THEN 'A'
        WHEN 'A' THEN 'AAA'
        ELSE UPPER(TRIM(cup_size))
    END) COLLATE "C"))
    INCLUDE (cup_size)
    WHERE NOT deleted;

-- The existing unique index starts with performer_id. Favorite filtering
-- starts with the current user, so it needs the reverse column order.
CREATE INDEX performer_favorites_user_performer_idx
    ON performer_favorites (user_id, performer_id);
