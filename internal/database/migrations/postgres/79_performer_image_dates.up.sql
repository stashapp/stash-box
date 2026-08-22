-- When an image is from, as a partial ISO 8601 string: 2019,
-- 2019-06 or 2019-06-15. This is the idiom the schema already uses for
-- uncertain dates (scenes.production_date, performers.birth_date), rather than
-- the deprecated FuzzyDate pairing of a date with an accuracy column.
--
-- It sits on the join row rather than on performer_image_types because it is a
-- property of the image's presence on the performer, not of any one label: an
-- image with three labels has one date.
ALTER TABLE performer_images ADD COLUMN "date" text;
