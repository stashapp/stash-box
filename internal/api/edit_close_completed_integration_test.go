//go:build integration

package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// Long enough that no edit reaches the end of its voting period during a test.
const neverElapses = 86400 * 365

// Distinct values so an expiry assertion shows which period was applied.
const (
	testMinPeriod    = 3600
	testVotingPeriod = 7200
)

// A fresh user per vote, since users cannot vote twice or vote on their own edits.
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

// Overriding the periods is how a test places an edit past a deadline.
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

// Votes are ordered so the tally never reaches the threshold unopposed, which would close the edit at vote time.
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

// A net score at the threshold cannot distinguish 5 accepts and 2 rejects from 3 unopposed accepts.
func (s *editTestRunner) testContestedEditNotClosedEarly() {
	edit := s.createContestedEdit()

	s.sweep(0, neverElapses)

	s.verifyEditPending(s.findEdit(edit.ID))
}

func (s *editTestRunner) testContestedEditClosesOnFullPeriod() {
	edit := s.createContestedEdit()

	s.sweep(0, 0)

	s.verifyEditStatus(models.VoteStatusEnumAccepted.String(), s.findEdit(edit.ID))
}

func (s *editTestRunner) createTagDestroyEdit() *models.Edit {
	s.t.Helper()

	createdTag, err := s.createTestTag(nil)
	assert.NoError(s.t, err)

	id := createdTag.UUID()
	createdEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, nil, &models.EditInput{
		ID:        &id,
		Operation: models.OperationEnumDestroy,
	})
	assert.NoError(s.t, err)

	return createdEdit
}

func (s *editTestRunner) createDestructiveEdit(vote models.VoteTypeEnum) *models.Edit {
	s.t.Helper()

	createdEdit := s.createTagDestroyEdit()

	for range config.GetVoteApplicationThreshold() {
		s.voteAs(createdEdit.ID, vote)
	}

	s.verifyEditPending(s.findEdit(createdEdit.ID))

	return createdEdit
}

// The sweep must close it without another vote arriving to trigger the check.
func (s *editTestRunner) testUnanimousAcceptClosesAfterMinPeriod() {
	edit := s.createDestructiveEdit(models.VoteTypeEnumAccept)

	s.sweep(0, neverElapses)

	s.verifyEditStatus(models.VoteStatusEnumAccepted.String(), s.findEdit(edit.ID))
}

func (s *editTestRunner) testUnanimousRejectClosesAfterMinPeriod() {
	edit := s.createDestructiveEdit(models.VoteTypeEnumReject)

	s.sweep(0, neverElapses)

	s.verifyEditStatus(models.VoteStatusEnumRejected.String(), s.findEdit(edit.ID))
}

func (s *editTestRunner) createContestedDestructiveEdit() *models.Edit {
	s.t.Helper()

	edit := s.createDestructiveEdit(models.VoteTypeEnumAccept)
	s.voteAs(edit.ID, models.VoteTypeEnumReject)
	s.verifyEditPending(s.findEdit(edit.ID))

	return edit
}

// Overriding the periods keeps the assertions independent of the configured values.
func (s *editTestRunner) expiryOf(edit *models.Edit) time.Time {
	s.t.Helper()

	originalMin := config.C.MinDestructiveVotingPeriod
	originalVoting := config.C.VotingPeriod
	config.C.MinDestructiveVotingPeriod = testMinPeriod
	config.C.VotingPeriod = testVotingPeriod
	defer func() {
		config.C.MinDestructiveVotingPeriod = originalMin
		config.C.VotingPeriod = originalVoting
	}()

	expires, err := s.resolver.Edit().Expires(s.ctx, edit)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, expires)

	return *expires
}

// The minimum period only shortens the deadline for an edit the unanimous branch can close.
func (s *editTestRunner) testContestedEditExpiresOnFullPeriod() {
	edit := s.createContestedEdit()

	expected := edit.CreatedAt.Add(testVotingPeriod * time.Second)
	assert.Equal(s.t, expected, s.expiryOf(edit))
}

func (s *editTestRunner) testContestedDestructiveEditExpiresOnFullPeriod() {
	edit := s.createContestedDestructiveEdit()

	expected := edit.CreatedAt.Add(testVotingPeriod * time.Second)
	assert.Equal(s.t, expected, s.expiryOf(edit))
}

func (s *editTestRunner) testUnanimousDestructiveEditExpiresOnMinPeriod() {
	edit := s.createDestructiveEdit(models.VoteTypeEnumAccept)

	expected := edit.CreatedAt.Add(testMinPeriod * time.Second)
	assert.Equal(s.t, expected, s.expiryOf(edit))
}

func (s *editTestRunner) passingOf(edit *models.Edit) *bool {
	s.t.Helper()

	passing, err := s.resolver.Edit().Passing(s.ctx, edit)
	assert.NoError(s.t, err)

	return passing
}

// The projection is only useful if it names the status the sweep goes on to produce.
func (s *editTestRunner) testPassingMatchesClosedStatus() {
	edit := s.createContestedEdit()

	passing := s.passingOf(edit)
	assert.NotNil(s.t, passing)

	s.sweep(0, 0)
	closed := s.findEdit(edit.ID)

	assert.Equal(s.t, *passing, closed.Status == models.VoteStatusEnumAccepted.String())
	assert.Nil(s.t, s.passingOf(closed), "a closed edit has no tally left to project")
}

// A tally that carries a non-destructive edit leaves a destructive one short.
func (s *editTestRunner) testDestructiveEditNeedsPositiveNetScore() {
	edit := s.createTagDestroyEdit()
	s.voteAs(edit.ID, models.VoteTypeEnumAccept)
	s.voteAs(edit.ID, models.VoteTypeEnumReject)

	edit = s.findEdit(edit.ID)
	assert.Equal(s.t, 0, edit.VoteCount, "the test needs a neutral net score")
	assert.Equal(s.t, false, *s.passingOf(edit))

	s.sweep(0, 0)
	s.verifyEditStatus(models.VoteStatusEnumRejected.String(), s.findEdit(edit.ID))
}

func (s *editTestRunner) testClosedEditHasNoExpiry() {
	edit := s.createContestedEdit()

	s.sweep(0, 0)

	expires, err := s.resolver.Edit().Expires(s.ctx, s.findEdit(edit.ID))
	assert.NoError(s.t, err)
	assert.Nil(s.t, expires)
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

func TestContestedEditExpiresOnFullPeriod(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testContestedEditExpiresOnFullPeriod()
}

func TestContestedDestructiveEditExpiresOnFullPeriod(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testContestedDestructiveEditExpiresOnFullPeriod()
}

func TestUnanimousDestructiveEditExpiresOnMinPeriod(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testUnanimousDestructiveEditExpiresOnMinPeriod()
}

func TestClosedEditHasNoExpiry(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testClosedEditHasNoExpiry()
}

func TestPassingMatchesClosedStatus(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testPassingMatchesClosedStatus()
}

func TestDestructiveEditNeedsPositiveNetScore(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testDestructiveEditNeedsPositiveNetScore()
}
