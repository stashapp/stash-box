//go:build integration

package api_test

import (
	"context"
	"os"
	"strings"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
)

func TestFingerprintReportMigrationPreservesDownvotes(t *testing.T) {
	ctx := context.Background()
	conn := reportTestConnection(t)
	tx, err := conn.Begin(ctx)
	require.NoError(t, err)
	defer func() { _ = tx.Rollback(ctx) }()
	// A rolled-back private schema exercises the actual migration with populated
	// pre-migration tables without changing the suite's current schema.
	schema := "report_migration_" + strings.ReplaceAll(uuid.Must(uuid.NewV4()).String(), "-", "")
	_, err = tx.Exec(ctx, `CREATE SCHEMA `+schema+`; SET LOCAL search_path TO `+schema+`, public`)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, `
        CREATE TABLE users (id uuid PRIMARY KEY);
        CREATE TABLE scenes (id uuid PRIMARY KEY);
        CREATE TABLE fingerprints (id int PRIMARY KEY, hash bigint NOT NULL, algorithm text NOT NULL);
        CREATE TABLE scene_fingerprints (fingerprint_id int REFERENCES fingerprints(id), scene_id uuid REFERENCES scenes(id), user_id uuid REFERENCES users(id), duration int, created_at timestamp, vote smallint NOT NULL DEFAULT 1);
        INSERT INTO users VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
        INSERT INTO scenes VALUES ('00000000-0000-0000-0000-000000000003');
        INSERT INTO fingerprints VALUES (1, -9223372036854775808, 'PHASH'), (2, 42, 'OSHASH');
        INSERT INTO scene_fingerprints VALUES
          (1, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 100, '2020-01-01', 1),
          (1, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 200, '2021-02-03', -1),
          (2, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 300, '2022-03-04', -1);
        CREATE MATERIALIZED VIEW scene_popularity_all_time AS SELECT COUNT(*) AS count FROM scene_fingerprints;
        CREATE MATERIALIZED VIEW scene_popularity_trending AS SELECT COUNT(*) AS count FROM scene_fingerprints;
        CREATE MATERIALIZED VIEW performer_popularity_all_time AS SELECT COUNT(*) AS count FROM scene_fingerprints;
    `)
	require.NoError(t, err)
	cleanup, err := os.ReadFile("../database/migrations/postgres/62_cleanup_orphan_fingerprints.up.sql")
	require.NoError(t, err)
	_, err = tx.Exec(ctx, string(cleanup))
	require.NoError(t, err)
	migration, err := os.ReadFile("../database/migrations/postgres/76_fingerprint_reports.up.sql")
	require.NoError(t, err)
	_, err = tx.Exec(ctx, string(migration))
	require.NoError(t, err)
	var count int
	require.NoError(t, tx.QueryRow(ctx, `SELECT COUNT(*) FROM fingerprint_reports WHERE status='OPEN' AND resolved_at IS NULL AND correct_scene_id IS NULL AND comment IS NULL`).Scan(&count))
	require.Equal(t, 2, count)
	require.NoError(t, tx.QueryRow(ctx, `SELECT COUNT(*) FROM fingerprint_reports WHERE hash=-9223372036854775808 AND algorithm='PHASH' AND user_id='00000000-0000-0000-0000-000000000002' AND created_at='2021-02-03'`).Scan(&count))
	require.Equal(t, 1, count)
	require.NoError(t, tx.QueryRow(ctx, `SELECT COUNT(*) FROM scene_fingerprints WHERE duration=100 AND created_at='2020-01-01'`).Scan(&count))
	require.Equal(t, 1, count)
	require.NoError(t, tx.QueryRow(ctx, `SELECT COUNT(*) FROM fingerprints WHERE id=2`).Scan(&count))
	require.Zero(t, count, "report-only canonical fingerprints are cleaned up without deleting reports")
	require.NoError(t, tx.QueryRow(ctx, `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=$1 AND table_name='scene_fingerprints' AND column_name='vote'`, schema).Scan(&count))
	require.Zero(t, count)
	require.NoError(t, tx.QueryRow(ctx, `SELECT count FROM scene_popularity_all_time`).Scan(&count))
	require.Equal(t, 1, count)
}
