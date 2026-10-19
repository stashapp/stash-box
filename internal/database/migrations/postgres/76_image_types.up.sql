-- Image types have local identity-generated smallint ids for compact references.
-- Stable string keys identify types across instances and in GraphQL, edits and
-- audit JSON. Numeric ids are internal and need not match between instances.
-- The vocabulary is seeded here; rows are not created or deleted at runtime.

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
  -- taxonomy is meant to be complete; an instance is not obliged to use all of it.
  "enabled" boolean NOT NULL DEFAULT true,
  -- The ranking has no tiebreak below it but the entity's aspect-ratio
  -- comparator, so two rows sharing a sort_order would make the order of two
  -- differently-typed images arbitrary. Deferred so a full reorder can be one
  -- UPDATE per row in a single transaction, without contriving a
  -- collision-free intermediate permutation.
  CONSTRAINT image_type_groups_sort_order_key UNIQUE ("sort_order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE image_types (
  "id" smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  -- Value priority within the group; lower wins. Admin-writable.
  "sort_order" integer NOT NULL,
  -- Which entity kinds this type may be applied to. Fixed. Always
  -- ['PERFORMER'] today: this is NOT a generalizable cross-entity field like
  -- sites.valid_types, which it otherwise resembles down to the containment
  -- check. When scenes and studios get image labelling, they get their own
  -- separate types and groups, not rows here with SCENE or STUDIO added
  "valid_types" text[] NOT NULL CHECK ("valid_types" <@ ARRAY['SCENE', 'PERFORMER', 'STUDIO']),
  -- Admin-writable, as on the group. Disabling a group disables its types by
  -- implication rather than by cascade, so the two can be reasoned about
  -- separately and re-enabling a group does not resurrect a type that was
  -- switched off on its own
  "enabled" boolean NOT NULL DEFAULT true,
  -- Cross-group impossibilities, stored on either endpoint once and checked
  -- both ways. NULL means no conflicts declared here. Values are enum keys.
  "conflicts" text[],
  CONSTRAINT image_types_group_sort_order_key UNIQUE ("group_key", "sort_order") DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX image_types_group_key_idx ON image_types (group_key);

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
-- Only impossible combinations are excluded; uncertain crops remain the
-- labeller's judgment. Each pair is stored once, here on its crop endpoint.
UPDATE image_types SET conflicts =
  ARRAY['DRESS_TOPLESS', 'DRESS_BOTTOMLESS', 'DRESS_NUDE', 'DRESS_EXPLICIT', 'VIEW_BACK']
WHERE key IN ('CROP_FACE', 'CROP_HEADSHOT');

UPDATE image_types SET conflicts =
  ARRAY['DRESS_BOTTOMLESS', 'DRESS_NUDE', 'DRESS_EXPLICIT']
WHERE key IN ('CROP_BUST', 'CROP_TORSO');

CREATE TABLE image_type_assignments (
  "image_id" uuid NOT NULL REFERENCES images("id") ON DELETE CASCADE,
  "type_id" smallint NOT NULL REFERENCES image_types("id"),
  PRIMARY KEY ("image_id", "type_id")
);
CREATE INDEX image_type_assignments_type_id_idx ON image_type_assignments (type_id);

-- When an image is from, as a partial ISO 8601 string: 2019, 2019-06 or 2019-06-15
ALTER TABLE images ADD COLUMN "date" text;

-- A moderator has reviewed this image's categorization and considers it
-- complete. While set, changing types/date requires MODERATE; until then any
-- EDIT-role user may set and freely revise both. The flag is the whole
-- permission model: there is no per-field locking and no lock-on-first-write.
ALTER TABLE images ADD COLUMN "organized" boolean NOT NULL DEFAULT false;

-- When the current categorization (types/date) last changed, and by whom;
-- NULL iff the image carries neither. Kept on the row rather than derived
-- from mod_audit, which DeleteExpiredModAudits prunes -- the review feed
-- must not forget an image, or who to ask about it, just because its audit
-- trail aged out.
ALTER TABLE images ADD COLUMN "categorized_at" timestamp;
ALTER TABLE images ADD COLUMN "categorized_by" uuid REFERENCES users("id") ON DELETE SET NULL;

-- The review feed's exact predicate and order, so it stays an index scan as
-- the images table grows.
CREATE INDEX images_review_feed_idx ON images (categorized_at DESC)
  WHERE organized = false AND categorized_at IS NOT NULL;

-- Label and date changes bypass the edit queue so they are recorded here.
-- JSON type values remain stable string keys, never internal numeric ids.
CREATE TABLE image_audit (
    id UUID PRIMARY KEY,
    action TEXT NOT NULL CHECK (action IN ('CATEGORIZE', 'ORGANIZE')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- The one read shape: an image's trail, newest first (the revert takes the
-- head; the v7 ids break same-timestamp ties in insertion order).
CREATE INDEX image_audit_image_idx ON image_audit (image_id, created_at DESC, id DESC);

-- No separate user_id index: the primary key's btree already leads with
-- user_id, so it serves every lookup the resolver makes. user_notifications
-- needs one only because it has no primary key at all.
CREATE TABLE user_image_type_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "type_id" smallint NOT NULL REFERENCES image_types("id"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "type_id")
);

-- Which dimension a user compares first, the same choice the admin makes
-- instance-wide. Separate from the type table rather than sharing one with a
-- discriminator: the keys come from different vocabularies and reference
-- different tables, so a single column could not carry both foreign keys
CREATE TABLE user_image_type_group_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "group_key")
);
