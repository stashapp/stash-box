//go:build integration

package database

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stretchr/testify/require"
)

// Exercise the rebuild with existing data, not just the empty database used by
// API tests. Everything lives in a rolled-back, isolated schema.
func TestFingerprintInternalIDMigration(t *testing.T) {
	dsn := os.Getenv("POSTGRES_DB")
	if dsn == "" {
		t.Skip("POSTGRES_DB is required")
	}
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, "postgres://"+dsn)
	require.NoError(t, err)
	defer conn.Close(ctx)
	tx, err := conn.Begin(ctx)
	require.NoError(t, err)
	defer tx.Rollback(ctx)
	schema := "fingerprint_migration_" + strings.ReplaceAll(uuid.Must(uuid.NewV4()).String(), "-", "")
	_, err = tx.Exec(ctx, "CREATE SCHEMA "+schema+"; SET LOCAL search_path TO "+schema)
	require.NoError(t, err)
	createCompactReferenceMigrationTables(t, ctx, tx)
	sceneID, userID, performerID := uuid.Must(uuid.NewV4()), uuid.Must(uuid.NewV4()), uuid.Must(uuid.NewV4())
	stamp := time.Date(2024, 12, 24, 19, 39, 33, 0, time.UTC)
	_, err = tx.Exec(ctx, "INSERT INTO scenes VALUES ($1)", sceneID)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "INSERT INTO users VALUES ($1)", userID)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "INSERT INTO scene_performers VALUES ($1, $2)", sceneID, performerID)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "INSERT INTO fingerprints VALUES (1), (2)")
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "INSERT INTO scene_fingerprints VALUES (1, $1, $2, 123, $3, -1)", sceneID, userID, stamp)
	require.NoError(t, err)
	migration, err := migrationsFS.ReadFile("migrations/postgres/76_compact_reference_ids.up.sql")
	require.NoError(t, err)
	// Keep the migration inside this test's rollback transaction.
	sql := strings.Replace(string(migration), "BEGIN;", "", 1)
	sql = strings.Replace(sql, "COMMIT;", "", 1)
	_, err = tx.Exec(ctx, sql)
	require.NoError(t, err)
	assertCompactReferenceMigrationSchema(t, ctx, tx)
	var gotScene, gotUser uuid.UUID
	var duration int
	var vote int16
	var created time.Time
	err = tx.QueryRow(ctx, `SELECT s.id, u.id, sf.duration, sf.vote, sf.created_at
FROM scene_fingerprints sf JOIN scenes s ON s.internal_id = sf.scene_id
JOIN users u ON u.internal_id = sf.user_id`).Scan(&gotScene, &gotUser, &duration, &vote, &created)
	require.NoError(t, err)
	require.Equal(t, sceneID, gotScene)
	require.Equal(t, userID, gotUser)
	require.Equal(t, 123, duration)
	require.EqualValues(t, -1, vote)
	require.True(t, stamp.Equal(created))
	var count int
	err = tx.QueryRow(ctx, "SELECT user_count FROM scene_popularity_all_time WHERE scene_id = $1", sceneID).Scan(&count)
	require.NoError(t, err)
	require.Equal(t, 1, count)
	err = tx.QueryRow(ctx, "SELECT user_count FROM performer_popularity_all_time WHERE performer_id = $1", performerID).Scan(&count)
	require.NoError(t, err)
	require.Equal(t, 1, count)
	q := queries.New(tx)
	n, err := q.CreateSceneFingerprints(ctx, []queries.CreateSceneFingerprintsParams{{FingerprintID: 2, SceneID: sceneID, UserID: userID, Duration: 456}})
	require.NoError(t, err)
	require.EqualValues(t, 1, n)
	// An unknown UUID must fail, not silently drop an input row.
	sp, err := tx.Begin(ctx)
	require.NoError(t, err)
	_, err = queries.New(sp).CreateSceneFingerprints(ctx, []queries.CreateSceneFingerprintsParams{{FingerprintID: 2, SceneID: uuid.Must(uuid.NewV4()), UserID: userID}})
	require.Error(t, err)
	require.NoError(t, sp.Rollback(ctx))
	// Cascades and the statement-level orphan cleanup survive the rebuild.
	_, err = tx.Exec(ctx, "DELETE FROM users WHERE id = $1", userID)
	require.NoError(t, err)
	err = tx.QueryRow(ctx, "SELECT count(*) FROM scene_fingerprints").Scan(&count)
	require.NoError(t, err)
	require.Zero(t, count)
	err = tx.QueryRow(ctx, "SELECT count(*) FROM fingerprints").Scan(&count)
	require.NoError(t, err)
	require.Zero(t, count)
}
