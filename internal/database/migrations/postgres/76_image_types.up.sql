-- The vocabulary is seeded here. String keys are stable across instances;
-- numeric IDs are local.

CREATE TABLE image_type_groups (
  "key" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  -- Lower values rank first.
  "sort_order" integer NOT NULL,
  -- Whether the group allows only one assigned type per image.
  "exclusive" boolean NOT NULL,
  -- Disabled groups are excluded from selection and ranking; assignments remain.
  "enabled" boolean NOT NULL DEFAULT true,
  -- Defer uniqueness checks to allow reordering within one transaction.
  CONSTRAINT image_type_groups_sort_order_key UNIQUE ("sort_order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE image_types (
  "id" smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  -- Priority within the group; lower values rank first.
  "sort_order" integer NOT NULL,
  "entity_type" text NOT NULL CHECK ("entity_type" IN ('SCENE', 'PERFORMER', 'STUDIO')),
  -- Disabling a group preserves the individual type flags.
  "enabled" boolean NOT NULL DEFAULT true,
  -- Conflicting type keys, declared once per pair and checked in both directions.
  "conflicts" text[],
  CONSTRAINT image_types_group_sort_order_key UNIQUE ("group_key", "sort_order") DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX image_types_group_key_idx ON image_types (group_key);

INSERT INTO image_type_groups ("key", "name", "description", "sort_order", "exclusive") VALUES
  ('SHOT',    'Style',          'What type of image is this?',                   0, true),
  ('CROP',    'Crop',           'How much of the model is visible?',             1, true),
  ('VIEW',    'View',           'Which side of the model is facing the camera?', 2, true),
  ('POSTURE', 'Posture',        'How is the model''s body positioned?',          3, true),
  ('DRESS',   'State of dress', 'How much clothing is the model wearing?',       4, true);

INSERT INTO image_types ("key", "name", "description", "group_key", "sort_order", "entity_type") VALUES
  ('SHOT_PORTRAIT',           'Portrait',             'Posed and professional: photo galleries, glamour shots, etc.',          'SHOT',  0, 'PERFORMER'),
  ('SHOT_CANDID',             'Candid',               'Unposed or unprofessional: screenshots, selfies, behind-the-scenes, etc.', 'SHOT', 1, 'PERFORMER'),
  ('SHOT_DETAIL',             'Identifying detail',   'Close-up of a distinguishing feature, not the whole model: tattoo, piercing, scar, etc.', 'SHOT', 2, 'PERFORMER'),

  ('CROP_FACE',               'Face',                 'Collarbone and up, tight one-quarter headshot',                         'CROP',  0, 'PERFORMER'),
  ('CROP_HEADSHOT',           'Headshot',             'Shoulders and up, standard one-quarter headshot',                       'CROP',  1, 'PERFORMER'),
  ('CROP_BUST',               'Bust',                 'Waist and up, standard half-body portrait',                             'CROP',  2, 'PERFORMER'),
  ('CROP_TORSO',              'Torso',                'Hips and up, wide half-body portrait',                                  'CROP',  3, 'PERFORMER'),
  ('CROP_THREE_QUARTER',      'Three-quarter',        'Mid-thigh and up, standard three-quarter portrait',                     'CROP',  4, 'PERFORMER'),
  ('CROP_THREE_QUARTER_PLUS', 'Three-quarter plus',   'Knee and up, wide three-quarter portrait',                              'CROP',  5, 'PERFORMER'),
  ('CROP_FULL_BODY',          'Full body',            'Feet and up, full-length headshot',                                     'CROP',  6, 'PERFORMER'),
  ('CROP_WIDE',               'Wide',                 'Landscape image, horizontal model',                                     'CROP',  7, 'PERFORMER'),

  ('VIEW_FRONT',              'Front',                'Chest and genitals are mostly facing the camera',                       'VIEW',  0, 'PERFORMER'),
  ('VIEW_SIDE',               'Side',                 'One shoulder and hip are mostly facing the camera',                     'VIEW',  1, 'PERFORMER'),
  ('VIEW_BACK',               'Behind',               'Back and butt are mostly facing the camera',                            'VIEW',  2, 'PERFORMER'),

  ('POSTURE_STANDING',        'Standing',             'Upright on feet',                                                       'POSTURE', 0, 'PERFORMER'),
  ('POSTURE_SITTING',         'Sitting',              'Seated on a chair, bed, floor, etc.',                                   'POSTURE', 1, 'PERFORMER'),
  ('POSTURE_KNEELING',        'Kneeling',             'Weight on knees, torso upright',                                        'POSTURE', 2, 'PERFORMER'),
  ('POSTURE_SQUATTING',       'Squatting',            'Crouched on feet, knees bent and off the ground',                       'POSTURE', 3, 'PERFORMER'),
  ('POSTURE_ON_ALL_FOURS',    'On all fours',         'Weight on both hands and knees',                                        'POSTURE', 4, 'PERFORMER'),
  ('POSTURE_LYING',           'Lying',                'Horizontal: on the front, back or side',                                'POSTURE', 5, 'PERFORMER'),
  ('POSTURE_SUSPENDED',       'Airborne',             'Off the ground entirely: jumping, suspended, etc.',                     'POSTURE', 6, 'PERFORMER'),

  ('DRESS_NON_NUDE',          'Fully clothed',        'Chest and genitals fully covered: shirts, shorts, skirts, etc.',        'DRESS', 0, 'PERFORMER'),
  ('DRESS_UNDERWEAR',         'Underwear',            'Chest and genitals barely covered: lingerie, swimwear, undershirts, pasties, etc.', 'DRESS', 1, 'PERFORMER'),
  ('DRESS_TOPLESS',           'Topless',              'Chest uncovered, genitals covered',                                     'DRESS', 2, 'PERFORMER'),
  ('DRESS_BOTTOMLESS',        'Bottomless',           'Genitals uncovered, chest covered',                                     'DRESS', 3, 'PERFORMER'),
  ('DRESS_NUDE',              'Nude',                 'Uncovered chest and genitals',                                          'DRESS', 4, 'PERFORMER'),
  ('DRESS_EXPLICIT',          'Explicit',             'Nude, with significant focus on genitals',                              'DRESS', 5, 'PERFORMER');

-- Face and headshot crops cannot show these clothing states or rear views.
UPDATE image_types SET conflicts =
  ARRAY['DRESS_TOPLESS', 'DRESS_BOTTOMLESS', 'DRESS_NUDE', 'DRESS_EXPLICIT', 'VIEW_BACK']
WHERE key IN ('CROP_FACE', 'CROP_HEADSHOT');

-- Bust and torso crops cannot show these lower-body clothing states.
UPDATE image_types SET conflicts =
  ARRAY['DRESS_BOTTOMLESS', 'DRESS_NUDE', 'DRESS_EXPLICIT']
WHERE key IN ('CROP_BUST', 'CROP_TORSO');

CREATE TABLE image_type_assignments (
  "image_id" uuid NOT NULL REFERENCES images("id") ON DELETE CASCADE,
  "type_id" smallint NOT NULL REFERENCES image_types("id"),
  PRIMARY KEY ("image_id", "type_id")
);
CREATE INDEX image_type_assignments_type_id_idx ON image_type_assignments (type_id);

-- Partial ISO date: YYYY, YYYY-MM, or YYYY-MM-DD.
ALTER TABLE images ADD COLUMN "date" text;

-- Categorization is locked until a moderator withdraws this mark.
ALTER TABLE images ADD COLUMN "organized" boolean NOT NULL DEFAULT false;

-- Current categorization metadata, kept independently of audit retention.
ALTER TABLE images ADD COLUMN "categorized_at" timestamp;
ALTER TABLE images ADD COLUMN "categorized_by" uuid REFERENCES users("id") ON DELETE SET NULL;

CREATE INDEX images_review_feed_idx ON images (categorized_at DESC)
  WHERE organized = false AND categorized_at IS NOT NULL;

-- Categorization changes bypass the edit queue and are recorded here.
-- Type values in audit JSON use stable keys.
CREATE TABLE image_audit (
    id UUID PRIMARY KEY,
    action TEXT NOT NULL CHECK (action IN ('CATEGORIZE', 'ORGANIZE')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Latest change first; UUIDv7 IDs break timestamp ties.
CREATE INDEX image_audit_image_idx ON image_audit (image_id, created_at DESC, id DESC);

CREATE TABLE user_image_type_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "type_id" smallint NOT NULL REFERENCES image_types("id"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "type_id")
);

CREATE TABLE user_image_type_group_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "group_key")
);
