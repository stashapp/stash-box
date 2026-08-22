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
  ('SHOT',    'Shot type',      'What kind of photograph this is',            0, true),
  ('CROP',    'Crop',           'How much of the subject is in frame',        1, true),
  ('VIEW',    'View',           'Which side of the subject faces the camera', 2, true),
  ('POSTURE', 'Posture',        'What the subject''s body is doing',          3, true),
  ('DRESS',   'State of dress', 'How much clothing the subject is wearing',   4, true);

INSERT INTO image_types ("key", "name", "description", "group_key", "sort_order", "valid_types") VALUES
  ('SHOT_PORTRAIT',           'Portrait',             'Posed or promotional',                                                   'SHOT',  0, ARRAY['PERFORMER']),
  ('SHOT_CANDID',             'Candid',               'Unposed, amateur or self-shot: event photography, behind-the-scenes, selfies, screenshots', 'SHOT', 1, ARRAY['PERFORMER']),
  ('SHOT_DETAIL',             'Detail',               'A close-up of a feature rather than the person: tattoo, piercing, scar', 'SHOT',  2, ARRAY['PERFORMER']),

  ('CROP_FACE',               'Face',                 'Collarbone up, the quarter-length headshot',                             'CROP',  0, ARRAY['PERFORMER']),
  ('CROP_BUST',               'Bust',                 'Navel or chest up, the half-length shot',                                'CROP',  1, ARRAY['PERFORMER']),
  ('CROP_THREE_QUARTER',      'Three-quarter',        'Mid-thigh up, the three-quarter-length shot',                            'CROP',  2, ARRAY['PERFORMER']),
  ('CROP_THREE_QUARTER_PLUS', 'Three-quarter plus',   'A looser three-quarter, framed on 80-20 thirds',                         'CROP',  3, ARRAY['PERFORMER']),
  ('CROP_FULL_BODY',          'Full body',            'Head to toe, the full-length shot',                                      'CROP',  4, ARRAY['PERFORMER']),
  ('CROP_TORSO',              'Torso',                'Hips to shoulders, head not necessarily included',                       'CROP',  5, ARRAY['PERFORMER']),
  ('CROP_WIDE',               'Wide',                 'The whole scene, or the subject small in frame',                         'CROP',  6, ARRAY['PERFORMER']),

  ('VIEW_FRONT',              'Front',                'Photographed from the front',                                            'VIEW',  0, ARRAY['PERFORMER']),
  ('VIEW_SIDE',               'Side',                 'Photographed from the side',                                             'VIEW',  1, ARRAY['PERFORMER']),
  ('VIEW_BACK',               'Back',                 'Photographed from behind',                                               'VIEW',  2, ARRAY['PERFORMER']),

  ('POSTURE_STANDING',        'Standing',             'Upright and on their feet',                                              'POSTURE', 0, ARRAY['PERFORMER']),
  ('POSTURE_SITTING',         'Sitting',              'Seated, on anything or on the ground',                                   'POSTURE', 1, ARRAY['PERFORMER']),
  ('POSTURE_KNEELING',        'Kneeling',             'Weight on the knees, torso upright',                                     'POSTURE', 2, ARRAY['PERFORMER']),
  ('POSTURE_SQUATTING',       'Squatting',            'Crouched on the feet, knees bent and off the ground',                    'POSTURE', 3, ARRAY['PERFORMER']),
  ('POSTURE_ON_ALL_FOURS',    'On all fours',         'Weight on both hands and knees',                                         'POSTURE', 4, ARRAY['PERFORMER']),
  ('POSTURE_LYING',           'Lying',                'Horizontal: on the front, back or side',                                 'POSTURE', 5, ARRAY['PERFORMER']),
  ('POSTURE_SUSPENDED',       'Suspended',            'Held off the ground, as in bondage photography',                         'POSTURE', 6, ARRAY['PERFORMER']),

  ('DRESS_NON_NUDE',          'Non-nude',             'Clothed',                                                                'DRESS', 0, ARRAY['PERFORMER']),
  ('DRESS_UNDERWEAR',         'Underwear',            'Underwear, lingerie, swimwear or comparably revealing clothing',         'DRESS', 1, ARRAY['PERFORMER']),
  ('DRESS_TOPLESS',           'Topless',              'Chest uncovered, genitals covered',                                      'DRESS', 2, ARRAY['PERFORMER']),
  ('DRESS_NUDE',              'Nude',                 'Unclothed',                                                              'DRESS', 3, ARRAY['PERFORMER']),
  ('DRESS_EXPLICIT',          'Explicit',             'Unclothed, with the genital area the direct focus of the image',         'DRESS', 4, ARRAY['PERFORMER']);

-- Two anatomical lines generate all of these. Topless needs the chest in
-- frame, so it needs Bust or looser. Explicit needs the genital area, and
-- every crop down to and including Torso stops at the hips, so it needs
-- Three-quarter or looser. Face is the exception in kind rather than degree:
-- a face crop is defined by having a face in it, which a shot from behind
-- does not.
INSERT INTO image_type_conflicts ("type_key", "conflicts_with_key") VALUES
  ('CROP_FACE',  'DRESS_TOPLESS'),
  ('CROP_FACE',  'DRESS_NUDE'),
  ('CROP_FACE',  'DRESS_EXPLICIT'),
  ('CROP_BUST',  'DRESS_EXPLICIT'),
  ('CROP_TORSO', 'DRESS_EXPLICIT'),
  ('CROP_FACE',  'VIEW_BACK');
