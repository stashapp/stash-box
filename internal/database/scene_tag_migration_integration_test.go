//go:build integration

package database

import (
	"context"
	"os"
	"strings"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stretchr/testify/require"
)

func TestSceneTagInternalIDMigration(t *testing.T) {
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
	schema := "scene_tag_migration_" + strings.ReplaceAll(uuid.Must(uuid.NewV4()).String(), "-", "")
	_, err = tx.Exec(ctx, "CREATE SCHEMA "+schema+"; SET LOCAL search_path TO "+schema)
	require.NoError(t, err)
	createCompactReferenceMigrationTables(t, ctx, tx)
	scene1, scene2 := uuid.Must(uuid.NewV4()), uuid.Must(uuid.NewV4())
	tag1, tag2 := uuid.Must(uuid.NewV4()), uuid.Must(uuid.NewV4())
	_, err = tx.Exec(ctx, "INSERT INTO scenes (id) VALUES ($1), ($2)", scene1, scene2)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "INSERT INTO tags VALUES ($1), ($2)", tag1, tag2)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "INSERT INTO scene_tags VALUES ($1, $3), ($1, $4), ($2, $3)", scene1, scene2, tag1, tag2)
	require.NoError(t, err)
	migration, err := migrationsFS.ReadFile("migrations/postgres/76_compact_reference_ids.up.sql")
	require.NoError(t, err)
	sql := strings.Replace(string(migration), "BEGIN;", "", 1)
	sql = strings.Replace(sql, "COMMIT;", "", 1)
	_, err = tx.Exec(ctx, sql)
	require.NoError(t, err)
	assertCompactReferenceMigrationSchema(t, ctx, tx)
	q := queries.New(tx)
	pairs, err := q.FindTagIdsBySceneIds(ctx, []uuid.UUID{scene1, scene2})
	require.NoError(t, err)
	require.ElementsMatch(t, []queries.FindTagIdsBySceneIdsRow{
		{SceneID: scene1, TagID: tag1}, {SceneID: scene1, TagID: tag2}, {SceneID: scene2, TagID: tag1},
	}, pairs)
	for _, row := range []queries.CreateSceneTagsParams{
		{SceneID: scene1, TagID: tag1},                    // duplicate
		{SceneID: scene1, TagID: uuid.Must(uuid.NewV4())}, // unknown tag
		{SceneID: uuid.Must(uuid.NewV4()), TagID: tag1},   // unknown scene
	} {
		sp, err := tx.Begin(ctx)
		require.NoError(t, err)
		_, err = queries.New(sp).CreateSceneTags(ctx, []queries.CreateSceneTagsParams{row})
		require.Error(t, err)
		require.NoError(t, sp.Rollback(ctx))
	}
	// Move a unique old-tag pair while leaving an overlapping pair alone.
	require.NoError(t, q.UpdateSceneTagsForMerge(ctx, queries.UpdateSceneTagsForMergeParams{OldTagID: tag1, NewTagID: tag2}))
	pairs, err = q.FindTagIdsBySceneIds(ctx, []uuid.UUID{scene1, scene2})
	require.NoError(t, err)
	require.ElementsMatch(t, []queries.FindTagIdsBySceneIdsRow{
		{SceneID: scene1, TagID: tag1}, {SceneID: scene1, TagID: tag2}, {SceneID: scene2, TagID: tag2},
	}, pairs)
	require.NoError(t, q.DeleteSceneTagsByScene(ctx, scene2))
	n, err := q.CreateSceneTags(ctx, []queries.CreateSceneTagsParams{
		{SceneID: scene2, TagID: tag1}, {SceneID: scene2, TagID: tag2},
	})
	require.NoError(t, err)
	require.EqualValues(t, 2, n)
	// Merge must skip pairs already present on the target tag.
	require.NoError(t, q.UpdateSceneTagsForMerge(ctx, queries.UpdateSceneTagsForMergeParams{OldTagID: tag1, NewTagID: tag2}))
	require.NoError(t, q.DeleteSceneTagsByTag(ctx, tag1))
	pairs, err = q.FindTagIdsBySceneIds(ctx, []uuid.UUID{scene1, scene2})
	require.NoError(t, err)
	require.ElementsMatch(t, []queries.FindTagIdsBySceneIdsRow{
		{SceneID: scene1, TagID: tag2}, {SceneID: scene2, TagID: tag2},
	}, pairs)
	_, err = tx.Exec(ctx, "DELETE FROM scenes WHERE id = $1", scene1)
	require.NoError(t, err)
	_, err = tx.Exec(ctx, "DELETE FROM tags WHERE id = $1", tag2)
	require.NoError(t, err)
	var count int
	require.NoError(t, tx.QueryRow(ctx, "SELECT count(*) FROM scene_tags").Scan(&count))
	require.Zero(t, count)
}
