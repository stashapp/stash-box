//go:build integration

package api_test

import (
	"context"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// Long enough that no edit reaches the end of its voting period during a test.
const neverElapses = 86400 * 365

// voteAs casts a vote from a newly created user, since users cannot vote twice or
// vote on their own edits.
func (s *editTestRunner) voteAs(editID uuid.UUID, vote models.VoteTypeEnum) {
	s.t.Helper()

	voter, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
	assert.NoError(s.t, err)

	ctx := context.WithValue(s.ctx, auth.ContextUser, auth.FromUser(voter))
	_, err = s.resolver.Mutation().EditVote(ctx, models.EditVoteInput{
		ID:   editID,
		Vote: vote,
	})
	assert.NoError(s.t, err)
}

// sweep runs the cron sweep with the voting periods overridden, which is how a test
// places an edit past a deadline without waiting for it.
func (s *editTestRunner) sweep(minPeriod, votingPeriod int) {
	s.t.Helper()

	originalMin := config.C.MinDestructiveVotingPeriod
	originalVoting := config.C.VotingPeriod
	config.C.MinDestructiveVotingPeriod = minPeriod
	config.C.VotingPeriod = votingPeriod
	defer func() {
		config.C.MinDestructiveVotingPeriod = originalMin
		config.C.VotingPeriod = originalVoting
	}()

	_, err := dbtest.Factory().Edit().CloseCompleted(context.TODO())
	assert.NoError(s.t, err)
}

func (s *editTestRunner) findEdit(id uuid.UUID) *models.Edit {
	s.t.Helper()

	edit, err := s.resolver.Query().FindEdit(s.ctx, id)
	assert.NoError(s.t, err)
	return edit
}

// createContestedEdit returns an edit whose net score equals the vote threshold, but
// which has votes on both sides. The votes are ordered so the tally never reaches the
// threshold unopposed, which would close the edit at vote time.
func (s *editTestRunner) createContestedEdit() *models.Edit {
	s.t.Helper()

	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	for _, vote := range []models.VoteTypeEnum{
		models.VoteTypeEnumAccept,
		models.VoteTypeEnumAccept,
		models.VoteTypeEnumReject,
		models.VoteTypeEnumAccept,
		models.VoteTypeEnumAccept,
		models.VoteTypeEnumAccept,
		models.VoteTypeEnumReject,
	} {
		s.voteAs(createdEdit.ID, vote)
	}

	edit := s.findEdit(createdEdit.ID)
	assert.Equal(s.t, config.GetVoteApplicationThreshold(), edit.VoteCount,
		"net score should equal the vote threshold for the test to be meaningful")
	s.verifyEditPending(edit)

	return edit
}

// A contested edit must run its full voting period. Its net score reaching the
// threshold is not enough, since a net score cannot distinguish 5 accepts and 2
// rejects from 3 unopposed accepts.
func (s *editTestRunner) testContestedEditNotClosedEarly() {
	edit := s.createContestedEdit()

	s.sweep(0, neverElapses)

	s.verifyEditPending(s.findEdit(edit.ID))
}

// Once the full voting period is up, the same edit is settled on its net score.
func (s *editTestRunner) testContestedEditClosesOnFullPeriod() {
	edit := s.createContestedEdit()

	s.sweep(0, 0)

	s.verifyEditStatus(models.VoteStatusEnumAccepted.String(), s.findEdit(edit.ID))
}

// createDestructiveEdit returns a destructive edit, which is held open for the minimum
// voting period however its votes fall.
func (s *editTestRunner) createDestructiveEdit(vote models.VoteTypeEnum) *models.Edit {
	s.t.Helper()

	createdTag, err := s.createTestTag(nil)
	assert.NoError(s.t, err)

	id := createdTag.UUID()
	createdEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, nil, &models.EditInput{
		ID:        &id,
		Operation: models.OperationEnumDestroy,
	})
	assert.NoError(s.t, err)

	for range config.GetVoteApplicationThreshold() {
		s.voteAs(createdEdit.ID, vote)
	}

	s.verifyEditPending(s.findEdit(createdEdit.ID))

	return createdEdit
}

// An uncontested destructive edit closes as soon as its minimum voting period is up,
// without waiting for another vote to arrive and trigger the check.
func (s *editTestRunner) testUnanimousAcceptClosesAfterMinPeriod() {
	edit := s.createDestructiveEdit(models.VoteTypeEnumAccept)

	s.sweep(0, neverElapses)

	s.verifyEditStatus(models.VoteStatusEnumAccepted.String(), s.findEdit(edit.ID))
}

// The mirror of the above, which the sweep has to handle on the same terms.
func (s *editTestRunner) testUnanimousRejectClosesAfterMinPeriod() {
	edit := s.createDestructiveEdit(models.VoteTypeEnumReject)

	s.sweep(0, neverElapses)

	s.verifyEditStatus(models.VoteStatusEnumRejected.String(), s.findEdit(edit.ID))
}

func TestContestedEditNotClosedEarly(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testContestedEditNotClosedEarly()
}

func TestContestedEditClosesOnFullPeriod(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testContestedEditClosesOnFullPeriod()
}

func TestUnanimousAcceptClosesAfterMinPeriod(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testUnanimousAcceptClosesAfterMinPeriod()
}

func TestUnanimousRejectClosesAfterMinPeriod(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testUnanimousRejectClosesAfterMinPeriod()
}
