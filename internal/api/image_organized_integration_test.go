//go:build integration

package api_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stretchr/testify/assert"
)

// organizedTestRunner wraps an admin runner (performerCreate needs MODIFY,
// which MODERATE alone lacks) with the fixture helpers these tests share:
// images categorized through the real mutation (so categorized_at is
// maintained), attached to a performer (so the review feed sees them)
type organizedTestRunner struct {
	testRunner
}

func createOrganizedTestRunner(t *testing.T) *organizedTestRunner {
	return &organizedTestRunner{testRunner: *asAdmin(t)}
}

// attachedImage uploads a fresh image and attaches it to a new performer
func (s *organizedTestRunner) attachedImage() uuid.UUID {
	s.t.Helper()

	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	_, err = s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)

	return image.ID
}

// categorize labels an image through imageUpdate as this runner, which is
// what maintains categorized_at: the review feed depends on it
func (s *organizedTestRunner) categorize(imageID uuid.UUID, types ...models.ImageTypeEnum) {
	s.t.Helper()

	s.newRequest()
	_, err := s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: types,
	})
	assert.NoError(s.t, err)
}

func (s *organizedTestRunner) organize(imageID uuid.UUID, organized bool) {
	s.t.Helper()

	s.newRequest()
	_, err := s.resolver.Mutation().ImageSetOrganized(s.ctx, models.ImageSetOrganizedInput{
		ID:        imageID,
		Organized: organized,
	})
	assert.NoError(s.t, err)
}

func TestImageUpdateEditRoleFreelyRevisesUnorganizedImages(t *testing.T) {
	edit := asEdit(t)
	img, err := edit.createTestImage(400, 600)
	assert.NoError(t, err)

	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)

	// The same user changes their mind; a second EDIT user overrules them
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(t, err)

	other := asEdit(t)
	date := "2021-03"
	_, err = other.resolver.Mutation().ImageUpdate(other.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
		Date:  &date,
	})
	assert.NoError(t, err)
}

// The organized flag is the whole lock, and a hard one: once set, the
// categorization is settled for everyone until the mark is deliberately withdrawn.
//
// Withdrawing reopens the image to EDIT
func TestImageUpdateGatesOnOrganized(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()
	s.categorize(imageID, models.ImageTypeEnumShotPortrait)
	s.organize(imageID, true)

	edit := asEdit(t)
	_, err := edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.ErrorContains(t, err, "organized")

	// Moderators (here: an admin) hit the same wall; the lock is not a role
	// check, and the only way past it is withdrawing the mark
	s.newRequest()
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.ErrorContains(t, err, "organized")

	// Restating the current state unchanged is not a change and never gates
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)

	// Withdraw, change, restate the mark: the intended moderation loop
	s.organize(imageID, false)
	s.categorize(imageID, models.ImageTypeEnumShotCandid)
	s.organize(imageID, true)

	// And withdrawing again reopens the image to EDIT
	s.organize(imageID, false)
	edit.newRequest()
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)
}

// The organized mark only locks metadata, editors can still delete the image
func TestOrganizedImageRemovableByEdit(t *testing.T) {
	s := createOrganizedTestRunner(t)

	keeper, err := s.createTestImage(400, 600)
	assert.NoError(t, err)
	organized, err := s.createTestImage(400, 600)
	assert.NoError(t, err)
	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{keeper.ID, organized.ID},
	})
	assert.NoError(t, err)
	performerID := performer.UUID()

	s.categorize(organized.ID, models.ImageTypeEnumShotPortrait)
	s.organize(organized.ID, true)

	s.newRequest()
	pending, err := s.resolver.Mutation().PerformerEdit(s.ctx, models.PerformerEditInput{
		Edit: &models.EditInput{
			Operation: models.OperationEnumModify,
			ID:        &performerID,
		},
		Details: &models.PerformerEditDetailsInput{
			Name:     &performer.Name,
			ImageIds: []uuid.UUID{keeper.ID},
		},
	})
	assert.NoError(t, err)

	s.newRequest()
	applied, err := s.resolver.Mutation().ApproveEdit(s.ctx, models.ApproveEditInput{ID: pending.ID})
	assert.NoError(t, err)
	assert.Equal(t, models.VoteStatusEnumImmediateAccepted.String(), applied.Status)

	s.newRequest()
	found, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(t, err)
	images, err := s.resolver.Performer().Images(s.ctx, found)
	assert.NoError(t, err)
	if assert.Len(t, images, 1) {
		assert.Equal(t, keeper.ID, images[0].ID)
	}
}

// Through the client, so the @hasRole(MODERATE) directive actually runs;
// calling the resolver directly would bypass it
func TestImageSetOrganizedRequiresModerate(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()

	edit := asEdit(t)
	_, err := edit.client.imageSetOrganized(models.ImageSetOrganizedInput{
		ID:        imageID,
		Organized: true,
	})
	assert.ErrorContains(t, err, "not authorized")

	moderate := asModerate(t)
	organized, err := moderate.client.imageSetOrganized(models.ImageSetOrganizedInput{
		ID:        imageID,
		Organized: true,
	})
	assert.NoError(t, err)
	assert.True(t, organized)

	organized, err = moderate.client.imageSetOrganized(models.ImageSetOrganizedInput{
		ID:        imageID,
		Organized: false,
	})
	assert.NoError(t, err)
	assert.False(t, organized)
}

// auditsFor reads one image's audit trail, filtered to one action.
// image_audit has no GraphQL surface (the review feed is the moderation flow)
// so the trail is read through the service the same way the revert reads it
func auditsFor(t *testing.T, imageID uuid.UUID, action string) []queries.ImageAudit {
	t.Helper()

	trail, err := dbtest.Factory().Image().AuditTrail(context.Background(), imageID)
	assert.NoError(t, err)

	var audits []queries.ImageAudit
	for _, audit := range trail {
		if audit.Action == action {
			audits = append(audits, audit)
		}
	}
	return audits
}

// imageAuditPayload mirrors the service's audit payload for assertions
type imageAuditPayload struct {
	TypesBefore    []string `json:"types_before"`
	TypesAfter     []string `json:"types_after"`
	OrganizedAfter *bool    `json:"organized_after"`
}

// Label and date changes bypass the edit queue, so the audit row is their
// only paper trail: full before/after states, attributed to the user
func TestImageCategorizeWritesAudit(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()
	s.categorize(imageID, models.ImageTypeEnumShotPortrait)
	s.categorize(imageID, models.ImageTypeEnumShotCandid)

	audits := auditsFor(t, imageID, "CATEGORIZE")
	if assert.Len(t, audits, 2) {
		// Newest first, per the trail's ordering
		var payload imageAuditPayload
		assert.NoError(t, json.Unmarshal(audits[0].Data, &payload))
		assert.Equal(t, []string{"SHOT_PORTRAIT"}, payload.TypesBefore, "before state should be recorded")
		assert.Equal(t, []string{"SHOT_CANDID"}, payload.TypesAfter, "after state should be recorded")
		if assert.True(t, audits[0].UserID.Valid, "the actor should be attributed") {
			assert.Equal(t, auth.GetCurrentUser(s.ctx).ID, audits[0].UserID.UUID)
		}
	}

	// Restating the same labels is not a change and writes nothing
	s.categorize(imageID, models.ImageTypeEnumShotCandid)
	assert.Len(t, auditsFor(t, imageID, "CATEGORIZE"), 2)
}

func TestImageOrganizeWritesAudit(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()

	s.organize(imageID, true)
	audits := auditsFor(t, imageID, "ORGANIZE")
	if assert.Len(t, audits, 1) {
		var payload imageAuditPayload
		assert.NoError(t, json.Unmarshal(audits[0].Data, &payload))
		if assert.NotNil(t, payload.OrganizedAfter) {
			assert.True(t, *payload.OrganizedAfter)
		}
	}

	// Idempotent restatement records nothing
	s.organize(imageID, true)
	assert.Len(t, auditsFor(t, imageID, "ORGANIZE"), 1)

	s.organize(imageID, false)
	assert.Len(t, auditsFor(t, imageID, "ORGANIZE"), 2)
}

// feedIDs reads the review feed as this runner, images only
func (s *organizedTestRunner) feedIDs(page, perPage int) []uuid.UUID {
	s.t.Helper()

	s.newRequest()
	q, err := s.resolver.Query().QueryUnorganizedImages(s.ctx, models.UnorganizedImagesQueryInput{
		Page:    page,
		PerPage: perPage,
	})
	assert.NoError(s.t, err)

	rows, err := s.resolver.QueryUnorganizedImagesResultType().Images(s.ctx, q)
	assert.NoError(s.t, err)

	ids := make([]uuid.UUID, len(rows))
	for i, row := range rows {
		ids[i] = row.Image.ID
	}
	return ids
}

func (s *organizedTestRunner) feedCount() int {
	s.t.Helper()

	q, err := s.resolver.Query().QueryUnorganizedImages(s.ctx, models.UnorganizedImagesQueryInput{Page: 1, PerPage: 25})
	assert.NoError(s.t, err)

	count, err := s.resolver.QueryUnorganizedImagesResultType().Count(s.ctx, q)
	assert.NoError(s.t, err)
	return count
}

// The review feed: categorized, unorganized, attached images only, newest
// categorization first, and recategorizing bumps an image back to the front
func TestQueryUnorganizedImagesFeed(t *testing.T) {
	s := createOrganizedTestRunner(t)

	// The feed is instance-wide state shared with every other test that categorizes an image,
	// so assert membership and relative order rather than exact contents
	first := s.attachedImage()
	s.categorize(first, models.ImageTypeEnumShotPortrait)

	second := s.attachedImage()
	s.categorize(second, models.ImageTypeEnumShotCandid)

	organized := s.attachedImage()
	s.categorize(organized, models.ImageTypeEnumShotPortrait)
	s.organize(organized, true)

	uncategorized := s.attachedImage()

	unattached, err := s.createTestImage(400, 600)
	assert.NoError(t, err)
	s.categorize(unattached.ID, models.ImageTypeEnumShotPortrait)

	feed := s.feedIDs(1, 100)
	assert.Contains(t, feed, first)
	assert.Contains(t, feed, second)
	assert.NotContains(t, feed, organized, "an organized image needs no review")
	assert.NotContains(t, feed, uncategorized, "nothing to review on an uncategorized image")
	assert.NotContains(t, feed, unattached.ID, "an unattached image is still riding a pending edit")
	assert.Less(t, indexOf(feed, second), indexOf(feed, first), "newer categorization first")

	// Recategorizing bumps an image back to the front of the queue
	s.categorize(first, models.ImageTypeEnumShotCandid)
	feed = s.feedIDs(1, 100)
	assert.Less(t, indexOf(feed, first), indexOf(feed, second))

	// Count agrees with the membership rules
	countBefore := s.feedCount()
	s.organize(first, true)
	assert.Equal(t, countBefore-1, s.feedCount())

	// Pagination: one row per page, no overlap between pages
	pageOne := s.feedIDs(1, 1)
	pageTwo := s.feedIDs(2, 1)
	if assert.Len(t, pageOne, 1) && assert.Len(t, pageTwo, 1) {
		assert.NotEqual(t, pageOne[0], pageTwo[0])
	}

	// The owning performer resolves for a feed row
	s.newRequest()
	q, err := s.resolver.Query().QueryUnorganizedImages(s.ctx, models.UnorganizedImagesQueryInput{Page: 1, PerPage: 100})
	assert.NoError(t, err)
	rows, err := s.resolver.QueryUnorganizedImagesResultType().Images(s.ctx, q)
	assert.NoError(t, err)
	for _, row := range rows {
		if row.Image.ID == second {
			performer, err := s.resolver.UnorganizedImage().Performer(s.ctx, &row)
			assert.NoError(t, err)
			assert.NotNil(t, performer)
		}
	}

	// The directive keeps EDIT out; through the client so it actually runs
	edit := asEdit(t)
	_, err = edit.client.queryUnorganizedImages(models.UnorganizedImagesQueryInput{Page: 1, PerPage: 1})
	assert.ErrorContains(t, err, "not authorized")
}

func indexOf(ids []uuid.UUID, id uuid.UUID) int {
	for i, candidate := range ids {
		if candidate == id {
			return i
		}
	}
	return -1
}

// The feed narrows to one performer's gallery on request so a moderator can
// sign off a whole set in one sitting; the count follows the same filter
func TestQueryUnorganizedImagesPerformerFilter(t *testing.T) {
	s := createOrganizedTestRunner(t)

	mine, err := s.createTestImage(400, 600)
	assert.NoError(t, err)
	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{mine.ID},
	})
	assert.NoError(t, err)
	s.categorize(mine.ID, models.ImageTypeEnumShotPortrait)

	other := s.attachedImage()
	s.categorize(other, models.ImageTypeEnumShotCandid)

	performerID := performer.UUID()
	s.newRequest()
	q, err := s.resolver.Query().QueryUnorganizedImages(s.ctx, models.UnorganizedImagesQueryInput{
		Page:        1,
		PerPage:     100,
		PerformerID: &performerID,
	})
	assert.NoError(t, err)

	rows, err := s.resolver.QueryUnorganizedImagesResultType().Images(s.ctx, q)
	assert.NoError(t, err)
	if assert.Len(t, rows, 1, "only the filtered performer's image should be listed") {
		assert.Equal(t, mine.ID, rows[0].Image.ID)
	}

	count, err := s.resolver.QueryUnorganizedImagesResultType().Count(s.ctx, q)
	assert.NoError(t, err)
	assert.Equal(t, 1, count, "the count should follow the filter")
}

// categorized_by names who last set the categorization and follows the most recent user
func TestImageCategorizedByTracksTheLastActor(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()

	edit := asEdit(t)
	_, err := edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)

	stored, err := dbtest.Factory().Image().Find(edit.ctx, imageID)
	assert.NoError(t, err)
	if assert.True(t, stored.CategorizedBy.Valid) {
		assert.Equal(t, auth.GetCurrentUser(edit.ctx).ID, stored.CategorizedBy.UUID)
	}

	// A different user's change takes over the attribution, and the
	// resolver turns the stored id into a user
	s.categorize(imageID, models.ImageTypeEnumShotCandid)
	stored, err = dbtest.Factory().Image().Find(s.ctx, imageID)
	assert.NoError(t, err)
	if assert.True(t, stored.CategorizedBy.Valid) {
		assert.Equal(t, auth.GetCurrentUser(s.ctx).ID, stored.CategorizedBy.UUID)
	}

	s.newRequest()
	categorizedBy, err := s.resolver.Image().CategorizedBy(s.ctx, stored)
	assert.NoError(t, err)
	if assert.NotNil(t, categorizedBy) {
		assert.Equal(t, auth.GetCurrentUser(s.ctx).ID, categorizedBy.ID)
	}
}

// The review feed can narrow to one user's categorizations: the fast damage
// survey when a contributor turns out to be careless or malicious
func TestQueryUnorganizedImagesUserFilter(t *testing.T) {
	s := createOrganizedTestRunner(t)

	mine := s.attachedImage()
	s.categorize(mine, models.ImageTypeEnumShotPortrait)

	theirs := s.attachedImage()
	edit := asEdit(t)
	_, err := edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    theirs,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(t, err)

	userID := auth.GetCurrentUser(edit.ctx).ID
	s.newRequest()
	q, err := s.resolver.Query().QueryUnorganizedImages(s.ctx, models.UnorganizedImagesQueryInput{
		Page:    1,
		PerPage: 100,
		UserID:  &userID,
	})
	assert.NoError(t, err)

	rows, err := s.resolver.QueryUnorganizedImagesResultType().Images(s.ctx, q)
	assert.NoError(t, err)
	ids := make([]uuid.UUID, len(rows))
	for i, row := range rows {
		ids[i] = row.Image.ID
	}
	assert.Contains(t, ids, theirs)
	assert.NotContains(t, ids, mine, "another user's categorization should be filtered out")

	count, err := s.resolver.QueryUnorganizedImagesResultType().Count(s.ctx, q)
	assert.NoError(t, err)
	assert.Equal(t, len(rows), count, "the count should follow the filter")
}

// Revert restores the state before the most recent change, read back from
// the audit log's before payload, and is itself an ordinary audited, attributed update
func TestImageRevertCategorizationRestoresThePriorState(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()

	s.categorize(imageID, models.ImageTypeEnumShotPortrait)
	date := "2020-01-02"
	s.newRequest()
	_, err := s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
		Date:  &date,
	})
	assert.NoError(t, err)

	moderate := asModerate(t)
	moderate.newRequest()
	_, err = moderate.resolver.Mutation().ImageRevertCategorization(moderate.ctx, models.ImageRevertCategorizationInput{ID: imageID})
	assert.NoError(t, err)

	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: imageID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}, types)

	stored, err := dbtest.Factory().Image().Find(s.ctx, imageID)
	assert.NoError(t, err)
	assert.Nil(t, stored.Date, "the date should return to its prior absence")
	if assert.True(t, stored.CategorizedBy.Valid, "the revert takes over the attribution") {
		assert.Equal(t, auth.GetCurrentUser(moderate.ctx).ID, stored.CategorizedBy.UUID)
	}

	assert.Len(t, auditsFor(t, imageID, "CATEGORIZE"), 3,
		"the revert itself should be the third audited change")
}

// With no surviving audit row there is no recorded prior state to restore:
// labels that arrived with the image itself revert to nothing, dropping the image from the feed
func TestImageRevertCategorizationWithoutAuditClears(t *testing.T) {
	s := createOrganizedTestRunner(t)
	image, err := s.createTestImage(400, 600, models.ImageTypeEnumShotPortrait)
	assert.NoError(t, err)
	_, err = s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(t, err)

	moderate := asModerate(t)
	moderate.newRequest()
	_, err = moderate.resolver.Mutation().ImageRevertCategorization(moderate.ctx, models.ImageRevertCategorizationInput{ID: image.ID})
	assert.NoError(t, err)

	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: image.ID})
	assert.NoError(t, err)
	assert.Empty(t, types)

	stored, err := dbtest.Factory().Image().Find(s.ctx, image.ID)
	assert.NoError(t, err)
	assert.Nil(t, stored.CategorizedAt, "cleared categorization should leave the feed")
}

// An organized image is settled for everyone; reverting it means
// withdrawing the mark first, same as any other change
func TestImageRevertCategorizationGatesOnOrganized(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()
	s.categorize(imageID, models.ImageTypeEnumShotPortrait)
	s.organize(imageID, true)

	s.newRequest()
	_, err := s.resolver.Mutation().ImageRevertCategorization(s.ctx, models.ImageRevertCategorizationInput{ID: imageID})
	assert.ErrorContains(t, err, "organized")
}

func TestImageRevertCategorizationRequiresModerate(t *testing.T) {
	s := createOrganizedTestRunner(t)
	imageID := s.attachedImage()
	s.categorize(imageID, models.ImageTypeEnumShotPortrait)

	edit := asEdit(t)
	err := edit.client.imageRevertCategorization(models.ImageRevertCategorizationInput{ID: imageID})
	assert.ErrorContains(t, err, "not authorized")

	moderate := asModerate(t)
	err = moderate.client.imageRevertCategorization(models.ImageRevertCategorizationInput{ID: imageID})
	assert.NoError(t, err)
}
