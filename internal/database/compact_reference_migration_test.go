//go:build integration

package database

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

// Both regression tests apply the complete migration to a populated schema 75.
func createCompactReferenceMigrationTables(t *testing.T, ctx context.Context, tx pgx.Tx) {
	t.Helper()
	_, err := tx.Exec(ctx, `
CREATE TABLE scenes (id uuid PRIMARY KEY);
CREATE TABLE users (id uuid PRIMARY KEY);
CREATE TABLE tags (id uuid PRIMARY KEY);
CREATE TABLE scene_tags (
 scene_id uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
 tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
 UNIQUE(scene_id,tag_id)
);
CREATE INDEX scene_tags_tag_id_idx ON scene_tags(tag_id);
CREATE TABLE fingerprints (id integer PRIMARY KEY);
CREATE TABLE scene_performers (scene_id uuid, performer_id uuid);
CREATE TABLE scene_fingerprints (
  fingerprint_id integer REFERENCES fingerprints(id),
  scene_id uuid REFERENCES scenes(id), user_id uuid REFERENCES users(id),
  duration integer, created_at timestamp, vote smallint
);
CREATE MATERIALIZED VIEW scene_popularity_all_time AS SELECT scene_id FROM scene_fingerprints;
CREATE MATERIALIZED VIEW scene_popularity_trending AS SELECT scene_id FROM scene_fingerprints;
CREATE MATERIALIZED VIEW performer_popularity_all_time AS SELECT performer_id FROM scene_performers;
`)
	require.NoError(t, err)
	cleanup, err := migrationsFS.ReadFile("migrations/postgres/62_cleanup_orphan_fingerprints.up.sql")
	require.NoError(t, err)
	_, err = tx.Exec(ctx, string(cleanup))
	require.NoError(t, err)
}

func assertCompactReferenceMigrationSchema(t *testing.T, ctx context.Context, tx pgx.Tx) {
	t.Helper()
	for _, table := range []string{"scenes", "users", "tags"} {
		var publicType, internalType, identity, primaryKey string
		require.NoError(t, tx.QueryRow(ctx, `SELECT data_type FROM information_schema.columns
 WHERE table_schema=current_schema() AND table_name=$1 AND column_name='id'`, table).Scan(&publicType))
		require.Equal(t, "uuid", publicType)
		require.NoError(t, tx.QueryRow(ctx, `SELECT data_type,identity_generation FROM information_schema.columns
 WHERE table_schema=current_schema() AND table_name=$1 AND column_name='internal_id'`, table).Scan(&internalType, &identity))
		require.Equal(t, "integer", internalType)
		require.Equal(t, "ALWAYS", identity)
		require.NoError(t, tx.QueryRow(ctx, `SELECT a.attname FROM pg_constraint pk
 JOIN pg_attribute a ON a.attrelid=pk.conrelid AND a.attnum=ANY(pk.conkey)
 WHERE pk.contype='p' AND pk.conrelid=($1::text)::regclass`, table).Scan(&primaryKey))
		require.Equal(t, "id", primaryKey, "the public UUID must remain the primary key")
	}
	var unchangedType string
	require.NoError(t, tx.QueryRow(ctx, `SELECT data_type FROM information_schema.columns
 WHERE table_schema=current_schema() AND table_name='scene_performers' AND column_name='scene_id'`).Scan(&unchangedType))
	require.Equal(t, "uuid", unchangedType, "unrelated entity relationships must not be converted")
}
