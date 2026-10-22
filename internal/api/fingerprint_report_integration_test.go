//go:build integration

package api_test

import (
	"context"
	"os"
	"testing"

	"github.com/99designs/gqlgen/client"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/require"
)

func reportTestConnection(t *testing.T) *pgx.Conn {
	t.Helper()
	url := os.Getenv("POSTGRES_DB")
	if url == "" {
		url = "postgres@localhost/stash-box-test?sslmode=disable"
	}
	conn, err := pgx.Connect(context.Background(), "postgres://"+url)
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close(context.Background()) })
	return conn
}

func TestFingerprintReportWorkflow(t *testing.T) {
	s := createSceneTestRunner(t)
	source, err := s.createTestScene(nil)
	require.NoError(t, err)
	target, err := s.createTestScene(nil)
	require.NoError(t, err)
	fp := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmPhash, nil)
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{SceneID: source.UUID(), Fingerprint: &models.FingerprintInput{Hash: fp.Hash, Algorithm: fp.Algorithm, Duration: fp.Duration}})
	require.NoError(t, err)
	reader := createTestRunner(t, userDB.read, userDB.readRoles)
	mod := createTestRunner(t, userDB.moderate, userDB.moderateRoles)
	input := models.FingerprintReportInput{SceneID: source.UUID(), Hash: fp.Hash, Algorithm: fp.Algorithm}
	targetID := target.UUID()
	input.CorrectSceneID = &targetID
	comment := "Wrong release"
	input.Comment = &comment
	var response struct {
		ReportFingerprint struct {
			ID           string
			Hash         string
			Comment      *string
			Scene        struct{ ID string }
			CorrectScene struct{ ID string } `json:"correct_scene"`
			User         struct{ ID string }
		}
	}
	err = reader.client.Post(`mutation($input: FingerprintReportInput!) { reportFingerprint(input:$input) { id hash comment scene { id } correct_scene { id } user { id } } }`, &response, client.Var("input", input))
	require.NoError(t, err)
	require.Equal(t, fp.Hash.Hex(), response.ReportFingerprint.Hash)
	require.Equal(t, target.ID, response.ReportFingerprint.CorrectScene.ID)
	require.Equal(t, userDB.read.ID.String(), response.ReportFingerprint.User.ID)
	reportID := uuid.FromStringOrNil(response.ReportFingerprint.ID)
	repeated, err := reader.resolver.Mutation().ReportFingerprint(reader.ctx, input)
	require.NoError(t, err)
	require.Equal(t, reportID, repeated.ID, "repeated reports update the existing open report")
	legacyVote := models.FingerprintSubmissionTypeInvalid
	_, err = reader.client.submitFingerprint(models.FingerprintSubmission{SceneID: source.UUID(), Fingerprint: &models.FingerprintInput{Hash: fp.Hash, Algorithm: fp.Algorithm, Duration: fp.Duration}, Vote: &legacyVote})
	require.NoError(t, err)
	repeated, err = reader.resolver.Mutation().ReportFingerprint(reader.ctx, models.FingerprintReportInput{SceneID: source.UUID(), Hash: fp.Hash, Algorithm: fp.Algorithm})
	require.NoError(t, err)
	require.Equal(t, &comment, repeated.Comment, "legacy re-reporting must not erase report details")
	require.Equal(t, targetID, repeated.CorrectSceneID.UUID)

	// A submitter can report their own association without losing their submission.
	own, err := s.resolver.Mutation().ReportFingerprint(s.ctx, input)
	require.NoError(t, err)
	sourceID := source.UUID()
	scoped, err := mod.resolver.Query().FingerprintReports(mod.ctx, nil, &sourceID, 1, 25)
	require.NoError(t, err)
	require.Equal(t, 2, scoped.Count)
	require.Len(t, scoped.Reports, 2)
	for _, report := range scoped.Reports {
		require.Equal(t, sourceID, report.SceneID)
	}
	scoped, err = mod.resolver.Query().FingerprintReports(mod.ctx, nil, &targetID, 1, 25)
	require.NoError(t, err)
	require.Zero(t, scoped.Count)
	require.Empty(t, scoped.Reports)
	before, err := s.client.findScene(source.UUID())
	require.NoError(t, err)
	for _, f := range before.Fingerprints {
		if f.FingerprintHash() == fp.Hash {
			require.Equal(t, 1, f.Submissions)
			require.Zero(t, f.Reports)
			require.False(t, f.UserReported)
		}
	}
	query := `query { fingerprintReports { count reports { id status } } }`
	var queue struct {
		FingerprintReports struct {
			Count   int
			Reports []struct{ ID, Status string }
		}
	}
	require.Error(t, reader.client.Post(query, &queue), "readers cannot view the moderation queue")
	require.NoError(t, mod.client.Post(query, &queue))
	require.Error(t, reader.client.Post(`mutation($id:ID!) { closeFingerprintReport(id:$id) { id } }`, &struct{}{}, client.Var("id", reportID)))

	// Failed moves cannot resolve reports, and moderators may override a suggestion.
	_, err = mod.resolver.Mutation().SceneMoveFingerprintSubmissions(mod.ctx, models.MoveFingerprintSubmissionsInput{SourceSceneID: source.UUID(), TargetSceneID: source.UUID(), Fingerprints: []models.FingerprintQueryInput{{Hash: fp.Hash, Algorithm: fp.Algorithm}}})
	require.Error(t, err)
	_, err = mod.client.sceneMoveFingerprintSubmissions(models.MoveFingerprintSubmissionsInput{SourceSceneID: source.UUID(), TargetSceneID: target.UUID(), Fingerprints: []models.FingerprintQueryInput{{Hash: fp.Hash, Algorithm: fp.Algorithm}, {Hash: fp.Hash + 1, Algorithm: fp.Algorithm}}})
	require.Error(t, err, "a failed batch must roll back its earlier moves and report resolutions")
	_, err = mod.client.sceneMoveFingerprintSubmissions(models.MoveFingerprintSubmissionsInput{SourceSceneID: source.UUID(), TargetSceneID: target.UUID(), Fingerprints: []models.FingerprintQueryInput{{Hash: fp.Hash, Algorithm: fp.Algorithm}}})
	require.NoError(t, err)
	conn := reportTestConnection(t)
	var status string
	var resolver uuid.UUID
	require.NoError(t, conn.QueryRow(s.ctx, `SELECT status, resolved_by FROM fingerprint_reports WHERE id=$1`, reportID).Scan(&status, &resolver))
	require.Equal(t, "COMPLETED", status)
	require.Equal(t, userDB.moderate.ID, resolver)
	require.NoError(t, conn.QueryRow(s.ctx, `SELECT status FROM fingerprint_reports WHERE id=$1`, own.ID).Scan(&status))
	require.Equal(t, "COMPLETED", status, "moving an association completes reports from all reporters")
	require.NoError(t, conn.QueryRow(s.ctx, `SELECT status FROM fingerprint_reports WHERE id=$1`, reportID).Scan(&status))
	_, err = reader.resolver.Mutation().ReportFingerprint(reader.ctx, input)
	require.Error(t, err, "cannot report an association that no longer exists")

	input.SceneID = target.UUID()
	input.CorrectSceneID = nil
	incorrect, err := reader.resolver.Mutation().ReportFingerprint(reader.ctx, input)
	require.NoError(t, err)
	closed, err := mod.resolver.Mutation().CloseFingerprintReport(mod.ctx, incorrect.ID)
	require.NoError(t, err)
	require.Equal(t, models.FingerprintReportStatusIncorrect, closed.Status)
	_, err = mod.resolver.Mutation().CloseFingerprintReport(mod.ctx, incorrect.ID)
	require.Error(t, err, "closed reports cannot be resolved twice")
	open, err := reader.resolver.Mutation().ReportFingerprint(reader.ctx, input)
	require.NoError(t, err)
	require.NotEqual(t, incorrect.ID, open.ID)
	// Retention uses resolution time, never report creation time.
	_, err = conn.Exec(s.ctx, `UPDATE fingerprint_reports SET created_at=CURRENT_TIMESTAMP-INTERVAL '30 days' WHERE id=ANY($1::uuid[])`, []uuid.UUID{open.ID, incorrect.ID, reportID})
	require.NoError(t, err)
	require.NoError(t, dbtest.Factory().FingerprintReport().Purge(s.ctx))
	var count int
	require.NoError(t, conn.QueryRow(s.ctx, `SELECT COUNT(*) FROM fingerprint_reports WHERE id=ANY($1::uuid[])`, []uuid.UUID{open.ID, incorrect.ID, reportID}).Scan(&count))
	require.Equal(t, 3, count)
	_, err = conn.Exec(s.ctx, `UPDATE fingerprint_reports SET resolved_at=CURRENT_TIMESTAMP-INTERVAL '25 hours' WHERE id=ANY($1::uuid[])`, []uuid.UUID{incorrect.ID, reportID})
	require.NoError(t, err)
	require.NoError(t, dbtest.Factory().FingerprintReport().Purge(s.ctx))
	require.NoError(t, conn.QueryRow(s.ctx, `SELECT COUNT(*) FROM fingerprint_reports WHERE id=ANY($1::uuid[])`, []uuid.UUID{open.ID, incorrect.ID, reportID}).Scan(&count))
	require.Equal(t, 1, count, "both resolved statuses expire; open reports do not")
	_, err = mod.client.sceneDeleteFingerprintSubmissions(models.DeleteFingerprintSubmissionsInput{SceneID: target.UUID(), Fingerprints: []models.FingerprintQueryInput{{Hash: fp.Hash, Algorithm: fp.Algorithm}}})
	require.NoError(t, err)
	require.NoError(t, conn.QueryRow(s.ctx, `SELECT status FROM fingerprint_reports WHERE id=$1`, open.ID).Scan(&status))
	require.Equal(t, "OPEN", status, "deleting submissions does not delete independent reports")
}

func TestFingerprintReportValidation(t *testing.T) {
	s := createSceneTestRunner(t)
	source, err := s.createTestScene(nil)
	require.NoError(t, err)
	fp := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmOshash, nil)
	input := models.FingerprintReportInput{SceneID: source.UUID(), Hash: fp.Hash, Algorithm: fp.Algorithm}
	_, err = s.resolver.Mutation().ReportFingerprint(s.ctx, input)
	require.Error(t, err)
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{SceneID: source.UUID(), Fingerprint: &models.FingerprintInput{Hash: fp.Hash, Algorithm: fp.Algorithm, Duration: fp.Duration}})
	require.NoError(t, err)
	same := source.UUID()
	input.CorrectSceneID = &same
	_, err = s.resolver.Mutation().ReportFingerprint(s.ctx, input)
	require.Error(t, err)
	missing := uuid.Must(uuid.NewV4())
	input.CorrectSceneID = &missing
	_, err = s.resolver.Mutation().ReportFingerprint(s.ctx, input)
	require.Error(t, err)
	_, err = s.resolver.Query().FingerprintReports(s.ctx, nil, nil, 0, 25)
	require.Error(t, err)
	_, err = s.resolver.Query().FingerprintReports(s.ctx, nil, nil, 1, 101)
	require.Error(t, err)
}

func TestFingerprintReportsResolveWithSceneEdits(t *testing.T) {
	for _, operation := range []models.OperationEnum{models.OperationEnumDestroy, models.OperationEnumMerge} {
		t.Run(operation.String(), func(t *testing.T) {
			s := createSceneEditTestRunner(t)
			reader := createTestRunner(t, userDB.read, userDB.readRoles)
			fp := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmOshash, nil)
			createReportedScene := func() (*sceneOutput, *models.FingerprintReport) {
				t.Helper()
				scene, err := s.createTestScene(nil)
				require.NoError(t, err)
				_, err = s.client.submitFingerprint(models.FingerprintSubmission{SceneID: scene.UUID(), Fingerprint: &models.FingerprintInput{Hash: fp.Hash, Algorithm: fp.Algorithm, Duration: fp.Duration}})
				require.NoError(t, err)
				report, err := reader.resolver.Mutation().ReportFingerprint(reader.ctx, models.FingerprintReportInput{SceneID: scene.UUID(), Hash: fp.Hash, Algorithm: fp.Algorithm})
				require.NoError(t, err)
				return scene, report
			}
			source, report := createReportedScene()
			target, targetReport := createReportedScene()
			sourceID := source.UUID()
			// Previously resolved reports must retain their outcome and timestamp.
			incorrect, err := s.resolver.Mutation().ReportFingerprint(s.ctx, models.FingerprintReportInput{SceneID: sourceID, Hash: fp.Hash, Algorithm: fp.Algorithm})
			require.NoError(t, err)
			closed, err := s.resolver.Mutation().CloseFingerprintReport(s.ctx, incorrect.ID)
			require.NoError(t, err)
			input := models.EditInput{Operation: operation, ID: &sourceID}
			details := &models.SceneEditDetailsInput{}
			if operation == models.OperationEnumMerge {
				targetID := target.UUID()
				input.ID = &targetID
				input.MergeSourceIds = []uuid.UUID{sourceID}
			}
			edit, err := s.createTestSceneEdit(operation, details, &input)
			require.NoError(t, err)
			_, err = s.approveEdit(edit.ID)
			require.NoError(t, err)
			deleted, err := s.resolver.Query().FindScene(s.ctx, sourceID)
			require.NoError(t, err)
			require.True(t, deleted.Deleted)
			reports, err := s.resolver.Query().FingerprintReports(s.ctx, nil, &sourceID, 1, 25)
			require.NoError(t, err)
			require.Len(t, reports.Reports, 2)
			for _, row := range reports.Reports {
				if row.ID == report.ID {
					require.Equal(t, models.FingerprintReportStatusCompleted, row.Status)
					require.NotNil(t, row.ResolvedAt)
					require.True(t, row.ResolvedByID.Valid)
					require.Equal(t, userDB.admin.ID, row.ResolvedByID.UUID)
				} else {
					require.Equal(t, closed.ID, row.ID)
					require.Equal(t, models.FingerprintReportStatusIncorrect, row.Status)
					require.Equal(t, closed.ResolvedAt, row.ResolvedAt)
				}
			}
			targetID := target.UUID()
			reports, err = s.resolver.Query().FingerprintReports(s.ctx, nil, &targetID, 1, 25)
			require.NoError(t, err)
			require.Len(t, reports.Reports, 1)
			require.Equal(t, targetReport.ID, reports.Reports[0].ID)
			require.Equal(t, models.FingerprintReportStatusOpen, reports.Reports[0].Status)
		})
	}
}
