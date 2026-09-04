-- The image type vocabulary. Keyed by stable strings rather than generated ids
-- so a key means the same thing on every instance, and so edit payloads stay
-- readable. Rows are seeded here and never created or destroyed at runtime,
-- hence no created_at/updated_at and no soft delete.

CREATE TABLE image_type_groups (
  "key" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  -- Dimension priority when ranking images; lower wins. Admin-writable.
  "sort_order" integer NOT NULL,
  -- At most one type from this group may be assigned to an image. Fixed.
  "exclusive" boolean NOT NULL,
  -- Admin-writable. A disabled group is not offered when labelling and takes
  -- no part in ranking, but its rows and any assignments made while it was on
  -- are kept, so switching it back on restores what an instance had. The
  -- taxonomy is meant to be complete; an instance is not obliged to use all
  -- of it.
  "enabled" boolean NOT NULL DEFAULT true,
  -- The ranking has no tiebreak below it but the entity's aspect-ratio
  -- comparator, so two rows sharing a sort_order would make the order of two
  -- differently-typed images arbitrary. Deferred so a full reorder can be one
  -- UPDATE per row in a single transaction, without contriving a
  -- collision-free intermediate permutation.
  CONSTRAINT image_type_groups_sort_order_key UNIQUE ("sort_order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE image_types (
  "key" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  -- Value priority within the group; lower wins. Admin-writable.
  "sort_order" integer NOT NULL,
  -- Which entity kinds this type may be applied to. Fixed. Always
  -- ['PERFORMER'] today: this is NOT a generalizable cross-entity field like
  -- sites.valid_types, which it otherwise resembles down to the containment
  -- check. When scenes and studios get image labelling, they get their own
  -- separate types and groups, not rows here with SCENE or STUDIO added.
  "valid_types" text[] NOT NULL CHECK ("valid_types" <@ ARRAY['SCENE', 'PERFORMER', 'STUDIO']),
  -- Admin-writable, as on the group. Disabling a group disables its types by
  -- implication rather than by cascade, so the two can be reasoned about
  -- separately and re-enabling a group does not resurrect a type that was
  -- switched off on its own.
  "enabled" boolean NOT NULL DEFAULT true,
  CONSTRAINT image_types_group_sort_order_key UNIQUE ("group_key", "sort_order") DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX image_types_group_key_idx ON image_types (group_key);

-- Pairs that cannot both describe one image, across groups. Exclusivity within
-- a group is a property of the group; this is the cross-group case, and every
-- pair here follows one rule: a value requires the crop to include the anatomy
-- it describes.
--
-- Deliberately confined to the impossible. A combination that is merely
-- unlikely, or that a tight crop happens not to establish, is left to the
-- labeller -- rejecting a correct label is worse than rejecting nothing, and a
-- rule tightened later would strand rows already stored.
--
-- Stored one way round and checked both ways, so a pair cannot be half-seeded.
CREATE TABLE image_type_conflicts (
  "type_key" text NOT NULL REFERENCES image_types("key"),
  "conflicts_with_key" text NOT NULL REFERENCES image_types("key"),
  PRIMARY KEY ("type_key", "conflicts_with_key"),
  CONSTRAINT image_type_conflicts_not_self CHECK ("type_key" <> "conflicts_with_key")
);

-- Every group key is a literal prefix of its type keys. That is a rule rather
-- than a convention, and an integration test asserts it.
INSERT INTO image_type_groups ("key", "name", "description", "sort_order", "exclusive") VALUES
  ('SHOT',    'Style',          'What type of image is this?',                   0, true),
  ('CROP',    'Crop',           'How much of the model is visible?',             1, true),
  ('VIEW',    'View',           'Which side of the model is facing the camera?', 2, true),
  ('POSTURE', 'Posture',        'How is the model''s body positioned?',          3, true),
  ('DRESS',   'State of dress', 'How much clothing is the model wearing?',       4, true);

INSERT INTO image_types ("key", "name", "description", "group_key", "sort_order", "valid_types") VALUES
  ('SHOT_PORTRAIT',           'Portrait',             'Posed and professional: photo galleries, glamour shots, etc.',          'SHOT',  0, ARRAY['PERFORMER']),
  ('SHOT_CANDID',             'Candid',               'Unposed or unprofessional: screenshots, selfies, behind-the-scenes, etc.', 'SHOT', 1, ARRAY['PERFORMER']),
  ('SHOT_DETAIL',             'Identifying detail',   'Close-up of a distinguishing feature, not the whole model: tattoo, piercing, scar, etc.', 'SHOT', 2, ARRAY['PERFORMER']),

  ('CROP_FACE',               'Face',                 'Collarbone and up, tight one-quarter headshot',                         'CROP',  0, ARRAY['PERFORMER']),
  ('CROP_HEADSHOT',           'Headshot',             'Shoulders and up, standard one-quarter headshot',                       'CROP',  1, ARRAY['PERFORMER']),
  ('CROP_BUST',               'Bust',                 'Waist and up, standard half-body portrait',                             'CROP',  2, ARRAY['PERFORMER']),
  ('CROP_TORSO',              'Torso',                'Hips and up, wide half-body portrait',                                  'CROP',  3, ARRAY['PERFORMER']),
  ('CROP_THREE_QUARTER',      'Three-quarter',        'Mid-thigh and up, standard three-quarter portrait',                     'CROP',  4, ARRAY['PERFORMER']),
  ('CROP_THREE_QUARTER_PLUS', 'Three-quarter plus',   'Knee and up, wide three-quarter portrait',                              'CROP',  5, ARRAY['PERFORMER']),
  ('CROP_FULL_BODY',          'Full body',            'Feet and up, full-length headshot',                                     'CROP',  6, ARRAY['PERFORMER']),
  ('CROP_WIDE',               'Wide',                 'Landscape image, horizontal model',                                     'CROP',  7, ARRAY['PERFORMER']),

  ('VIEW_FRONT',              'Front',                'Chest and genitals are mostly facing the camera',                       'VIEW',  0, ARRAY['PERFORMER']),
  ('VIEW_SIDE',               'Side',                 'One shoulder and hip are mostly facing the camera',                     'VIEW',  1, ARRAY['PERFORMER']),
  ('VIEW_BACK',               'Behind',               'Back and butt are mostly facing the camera',                            'VIEW',  2, ARRAY['PERFORMER']),

  ('POSTURE_STANDING',        'Standing',             'Upright on feet',                                                       'POSTURE', 0, ARRAY['PERFORMER']),
  ('POSTURE_SITTING',         'Sitting',              'Seated on a chair, bed, floor, etc.',                                   'POSTURE', 1, ARRAY['PERFORMER']),
  ('POSTURE_KNEELING',        'Kneeling',             'Weight on knees, torso upright',                                        'POSTURE', 2, ARRAY['PERFORMER']),
  ('POSTURE_SQUATTING',       'Squatting',            'Crouched on feet, knees bent and off the ground',                       'POSTURE', 3, ARRAY['PERFORMER']),
  ('POSTURE_ON_ALL_FOURS',    'On all fours',         'Weight on both hands and knees',                                        'POSTURE', 4, ARRAY['PERFORMER']),
  ('POSTURE_LYING',           'Lying',                'Horizontal: on the front, back or side',                                'POSTURE', 5, ARRAY['PERFORMER']),
  ('POSTURE_SUSPENDED',       'Airborne',             'Off the ground entirely: jumping, suspended, etc.',                     'POSTURE', 6, ARRAY['PERFORMER']),

  ('DRESS_NON_NUDE',          'Fully clothed',        'Chest and genitals fully covered: shirts, shorts, skirts, etc.',        'DRESS', 0, ARRAY['PERFORMER']),
  ('DRESS_UNDERWEAR',         'Underwear',            'Chest and genitals barely covered: lingerie, swimwear, undershirts, pasties, etc.', 'DRESS', 1, ARRAY['PERFORMER']),
  ('DRESS_TOPLESS',           'Topless',              'Chest uncovered, genitals covered',                                     'DRESS', 2, ARRAY['PERFORMER']),
  ('DRESS_BOTTOMLESS',        'Bottomless',           'Genitals uncovered, chest covered',                                     'DRESS', 3, ARRAY['PERFORMER']),
  ('DRESS_NUDE',              'Nude',                 'Uncovered chest and genitals',                                          'DRESS', 4, ARRAY['PERFORMER']),
  ('DRESS_EXPLICIT',          'Explicit',             'Nude, with significant focus on genitals',                              'DRESS', 5, ARRAY['PERFORMER']);

-- Two anatomical lines generate all of these. Topless needs the chest in
-- frame, so it needs Bust or looser. Nude and Explicit both need the chest
-- and the genital area, and Bottomless needs the genital area alone; every
-- crop down to and including Torso stops at the hips rather than past them,
-- so all three need Three-quarter or looser. Face and Headshot are the
-- exception in kind rather than degree: both are defined by having a face in
-- the frame, which a shot from behind does not have.
INSERT INTO image_type_conflicts ("type_key", "conflicts_with_key") VALUES
  ('CROP_FACE',     'DRESS_TOPLESS'),
  ('CROP_HEADSHOT', 'DRESS_TOPLESS'),
  ('CROP_FACE',     'DRESS_BOTTOMLESS'),
  ('CROP_HEADSHOT', 'DRESS_BOTTOMLESS'),
  ('CROP_BUST',     'DRESS_BOTTOMLESS'),
  ('CROP_TORSO',    'DRESS_BOTTOMLESS'),
  ('CROP_FACE',     'DRESS_NUDE'),
  ('CROP_HEADSHOT', 'DRESS_NUDE'),
  ('CROP_BUST',     'DRESS_NUDE'),
  ('CROP_TORSO',    'DRESS_NUDE'),
  ('CROP_FACE',     'DRESS_EXPLICIT'),
  ('CROP_HEADSHOT', 'DRESS_EXPLICIT'),
  ('CROP_BUST',     'DRESS_EXPLICIT'),
  ('CROP_TORSO',    'DRESS_EXPLICIT'),
  ('CROP_FACE',     'VIEW_BACK'),
  ('CROP_HEADSHOT', 'VIEW_BACK');

-- Labels describe the photograph, not any one entity's use of it: performer,
-- scene and studio images never share bytes in practice, so there is no case
-- where the same stored image legitimately means two different things.
CREATE TABLE image_type_assignments (
  "image_id" uuid NOT NULL REFERENCES images("id") ON DELETE CASCADE,
  "type_key" text NOT NULL REFERENCES image_types("key"),
  PRIMARY KEY ("image_id", "type_key")
);
CREATE INDEX image_type_assignments_type_key_idx ON image_type_assignments (type_key);

-- When an image is from, as a partial ISO 8601 string: 2019, 2019-06 or
-- 2019-06-15. This is the idiom the schema already uses for uncertain dates
-- (scenes.production_date, performers.birth_date), rather than the
-- deprecated FuzzyDate pairing of a date with an accuracy column. A property
-- of the photograph, same as its labels, so it lives on images rather than
-- on any entity-image join.
ALTER TABLE images ADD COLUMN "date" text;

-- A per-user reordering of the image types, applied server-side so existing
-- scraping clients benefit without a release. Paired with
-- user_image_type_group_preferences below, which orders the dimensions
-- themselves; this table only orders values inside one. No rows for a user
-- means no preference, which is the default for every existing user; unlike
-- user_notifications this table is deliberately not seeded.
--
-- No separate user_id index: the primary key's btree already leads with
-- user_id, so it serves every lookup the resolver makes. user_notifications
-- needs one only because it has no primary key at all.
CREATE TABLE user_image_type_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "type_key" text NOT NULL REFERENCES image_types("key"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "type_key")
);

-- Which dimension a user compares first, the same choice the admin makes
-- instance-wide. Separate from the type table rather than sharing one with a
-- discriminator: the keys come from different vocabularies and reference
-- different tables, so a single column could not carry both foreign keys.
--
-- This is the stronger of the two preferences -- group order decides which
-- dimension wins, type order only breaks ties inside one -- so withholding it
-- left preferences unable to express themselves at all whenever the dimension
-- someone cared about was compared last.
CREATE TABLE user_image_type_group_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "group_key")
);

-- The images an edit results in, stated once.
--
-- GetImagesForEdit needs this set, and it is written as a view rather than
-- inlined into that query so the same definition can be reused elsewhere
-- without a second copy to keep in step.
--
-- A view rather than a function taking the edit id, which is what this wants
-- to be. sqlc will not type a table-returning function's columns, so a query
-- selecting from one does not compile.
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
