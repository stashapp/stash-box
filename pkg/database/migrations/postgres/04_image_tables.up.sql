CREATE TABLE images (
    id uuid PRIMARY KEY,
    url VARCHAR NOT NULL,
    width INT,
    height INT
);

CREATE TABLE scene_images (
    scene_id uuid REFERENCES scenes(id) NOT NULL,
    image_id uuid REFERENCES images(id) NOT NULL
);

CREATE TABLE performer_images (
    performer_id uuid REFERENCES performers(id) NOT NULL,
    image_id uuid REFERENCES images(id) NOT NULL
);

CREATE TABLE studio_images (
    studio_id uuid REFERENCES studios(id) NOT NULL,
    image_id uuid REFERENCES images(id) NOT NULL
);
