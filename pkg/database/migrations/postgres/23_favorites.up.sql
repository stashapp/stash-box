CREATE TABLE performer_favorites (
    performer_id uuid REFERENCES performers(id) NOT NULL,
    user_id uuid REFERENCES users(id) NOT NULL
);

CREATE TABLE studio_favorites (
    studio_id uuid REFERENCES studios(id) NOT NULL,
    user_id uuid REFERENCES users(id) NOT NULL
);
