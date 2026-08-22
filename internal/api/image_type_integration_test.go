//go:build integration

package api_test

import (
	"strings"
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type imageTypeTestRunner struct {
	testRunner
}

func createImageTypeTestRunner(t *testing.T) *imageTypeTestRunner {
	return &imageTypeTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *imageTypeTestRunner) readGroups() []models.ImageTypeGroup {
	s.t.Helper()
	groups, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, nil)
	assert.NoError(s.t, err)
	return groups
}

// orderInputFor turns a read of the vocabulary back into the input that would
// reproduce it, so a test can restore whatever order it found.
func orderInputFor(groups []models.ImageTypeGroup) models.ImageTypeOrderInput {
	input := models.ImageTypeOrderInput{}
	for _, group := range groups {
		input.Groups = append(input.Groups, group.Key)
		for _, imageType := range group.Types {
			input.Types = append(input.Types, imageType.Key)
		}
	}
	return input
}

// reversedOrderInput reverses the groups, and the types within each group.
func reversedOrderInput(groups []models.ImageTypeGroup) models.ImageTypeOrderInput {
	input := models.ImageTypeOrderInput{}
	for i := len(groups) - 1; i >= 0; i-- {
		group := groups[i]
		input.Groups = append(input.Groups, group.Key)
		for j := len(group.Types) - 1; j >= 0; j-- {
			input.Types = append(input.Types, group.Types[j].Key)
		}
	}
	return input
}

// restoreOrder puts the vocabulary back, so ordering tests do not leak into
// the rest of the suite.
func (s *imageTypeTestRunner) restoreOrder(groups []models.ImageTypeGroup) {
	_, err := s.resolver.Mutation().ImageTypeOrderUpdate(s.ctx, orderInputFor(groups))
	assert.NoError(s.t, err)
}

func (s *imageTypeTestRunner) testImageTypeGroups() {
	groups, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, nil)
	assert.NoError(s.t, err)

	groupKeys := make([]models.ImageTypeGroupEnum, len(groups))
	for i, group := range groups {
		groupKeys[i] = group.Key
	}
	assert.Equal(s.t, []models.ImageTypeGroupEnum{
		models.ImageTypeGroupEnumShot,
		models.ImageTypeGroupEnumCrop,
		models.ImageTypeGroupEnumView,
		models.ImageTypeGroupEnumPosture,
		models.ImageTypeGroupEnumDress,
	}, groupKeys, "groups should come back in seeded priority order")

	seededTypes := 0
	for _, group := range groups {
		assert.True(s.t, group.Exclusive, "every seeded group is exclusive: %s", group.Key)
		assert.NotEmpty(s.t, group.Types)

		for i, imageType := range group.Types {
			// The seed numbers each group's types densely from zero, so
			// position and sort_order agree only if both are right.
			assert.Equal(s.t, i, imageType.SortOrder, "type %s out of order", imageType.Key)

			assert.Equal(s.t, []models.ImageTypeScopeEnum{models.ImageTypeScopeEnumPerformer},
				imageType.ValidTypes, "phase 1 seeds performer types only: %s", imageType.Key)
		}

		seededTypes += len(group.Types)
	}

	assert.Equal(s.t, 25, seededTypes)
}

func (s *imageTypeTestRunner) testImageTypeGroupsByTarget() {
	performer := models.ImageTypeScopeEnumPerformer
	performerGroups, err := s.resolver.Query().ImageTypeGroups(s.ctx, &performer, nil)
	assert.NoError(s.t, err)
	assert.Len(s.t, performerGroups, 5)

	// Every seeded type is performer-only, so filtering by scene empties every
	// group, and an empty group is dropped rather than returned bare.
	scene := models.ImageTypeScopeEnumScene
	sceneGroups, err := s.resolver.Query().ImageTypeGroups(s.ctx, &scene, nil)
	assert.NoError(s.t, err)
	assert.Empty(s.t, sceneGroups)
}

// The seeded rows and the GraphQL enums are two representations of one truth.
// This is what stops them drifting apart.
func (s *imageTypeTestRunner) testImageTypeSeedMatchesSchema() {
	groups, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, nil)
	assert.NoError(s.t, err)

	var groupKeys []models.ImageTypeGroupEnum
	var typeKeys []models.ImageTypeEnum

	for _, group := range groups {
		groupKeys = append(groupKeys, group.Key)

		for _, imageType := range group.Types {
			typeKeys = append(typeKeys, imageType.Key)

			assert.True(s.t, strings.HasPrefix(string(imageType.Key), string(group.Key)+"_"),
				"type %s must be prefixed with its group key %s", imageType.Key, group.Key)
		}
	}

	// ElementsMatch fails on extras in either direction, which is the point:
	// a seeded row with no enum value is as broken as the reverse.
	assert.ElementsMatch(s.t, models.AllImageTypeGroupEnum, groupKeys)
	assert.ElementsMatch(s.t, models.AllImageTypeEnum, typeKeys)
}

func (s *imageTypeTestRunner) testImageTypeOrderUpdate() {
	before := s.readGroups()
	defer s.restoreOrder(before)

	// Reversing guarantees the transaction passes through states where two
	// rows share a sort_order -- DRESS taking 0 while SHOT still holds it.
	// That survives only because both unique constraints are deferred and the
	// whole reorder commits once; a statement-per-transaction implementation
	// would abort here.
	reversed := reversedOrderInput(before)

	returned, err := s.resolver.Mutation().ImageTypeOrderUpdate(s.ctx, reversed)
	assert.NoError(s.t, err)

	for _, groups := range [][]models.ImageTypeGroup{returned, s.readGroups()} {
		if !assert.Len(s.t, groups, len(before)) {
			continue
		}

		for i, group := range groups {
			original := before[len(before)-1-i]

			assert.Equal(s.t, original.Key, group.Key)
			assert.Equal(s.t, i, group.SortOrder)

			if !assert.Len(s.t, group.Types, len(original.Types)) {
				continue
			}
			for j, imageType := range group.Types {
				assert.Equal(s.t, original.Types[len(original.Types)-1-j].Key, imageType.Key)
				assert.Equal(s.t, j, imageType.SortOrder)
			}
		}
	}
}

func (s *imageTypeTestRunner) testImageTypeOrderUpdateRequiresAdmin() {
	before := s.readGroups()

	// Through the client, so the @hasRole(ADMIN) directive actually runs;
	// calling the resolver directly would bypass it.
	reader := asRead(s.t)
	_, err := reader.client.imageTypeOrderUpdate(reversedOrderInput(before))
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "not authorized")

	assert.Equal(s.t, orderInputFor(before), orderInputFor(s.readGroups()))
}

func (s *imageTypeTestRunner) testImageTypeOrderUpdateRejectsPartial() {
	before := s.readGroups()
	complete := orderInputFor(before)

	// The expected message matters as much as the error. A partial list also
	// happens to collide on sort_order at commit, so asserting only that
	// something failed would pass even with the completeness check removed --
	// and would report a constraint violation where an admin needs to be told
	// what was missing.
	testCases := []struct {
		name     string
		input    models.ImageTypeOrderInput
		contains string
	}{
		{"a group missing", models.ImageTypeOrderInput{
			Groups: complete.Groups[1:],
			Types:  complete.Types,
		}, "groups must list all 5 values"},
		{"a type missing", models.ImageTypeOrderInput{
			Groups: complete.Groups,
			Types:  complete.Types[1:],
		}, "types must list all 25 values"},
		{"a group repeated in place of another", models.ImageTypeOrderInput{
			Groups: append([]models.ImageTypeGroupEnum{complete.Groups[0]}, complete.Groups[:len(complete.Groups)-1]...),
			Types:  complete.Types,
		}, "more than once"},
		{"empty lists", models.ImageTypeOrderInput{}, "groups must list all 5 values"},
	}

	for _, testCase := range testCases {
		_, err := s.resolver.Mutation().ImageTypeOrderUpdate(s.ctx, testCase.input)
		if assert.Error(s.t, err, "should reject %s", testCase.name) {
			assert.ErrorContains(s.t, err, testCase.contains, "wrong rejection for %s", testCase.name)
		}

		// Rejected outright rather than partly applied.
		assert.Equal(s.t, complete, orderInputFor(s.readGroups()), "order changed after %s", testCase.name)
	}
}

func TestImageTypeOrderUpdate(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testImageTypeOrderUpdate()
}

func TestImageTypeOrderUpdateRequiresAdmin(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testImageTypeOrderUpdateRequiresAdmin()
}

func TestImageTypeOrderUpdateRejectsPartial(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testImageTypeOrderUpdateRejectsPartial()
}

func TestImageTypeGroups(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testImageTypeGroups()
}

func TestImageTypeGroupsByTarget(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testImageTypeGroupsByTarget()
}

func TestImageTypeSeedMatchesSchema(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testImageTypeSeedMatchesSchema()
}

// image_type_conflicts stores each pair once, and the service mirrors it, so a
// client need not know which side of a pair it is holding.
//
// This is a guarantee something depends on rather than a nicety. The editor
// reads conflicts_with in one direction only -- ImageLabels blocks an option by
// looking at the conflicts of the types already chosen, never at the option's
// own -- so if the field stopped being served both ways a conflict would block
// from one side and not the other, and only from whichever side the seed
// happened to name. The component test cannot see this: it is handed a
// vocabulary, and the shape of that vocabulary is decided here.
func (s *imageTypeTestRunner) testConflictsAreServedBothWaysRound() {
	conflicts := map[models.ImageTypeEnum][]models.ImageTypeEnum{}
	for _, group := range s.readGroups() {
		for _, imageType := range group.Types {
			conflicts[imageType.Key] = imageType.ConflictsWith
		}
	}

	// Seeded as ('CROP_FACE', 'DRESS_TOPLESS') and nothing else, so the reverse
	// only exists if it was mirrored.
	assert.Contains(s.t, conflicts[models.ImageTypeEnumCropFace],
		models.ImageTypeEnumDressTopless, "the seeded direction is missing")
	assert.Contains(s.t, conflicts[models.ImageTypeEnumDressTopless],
		models.ImageTypeEnumCropFace, "the seeded pair is served one way round only")

	// And every pair, so a row added later cannot arrive one-sided.
	pairs := 0
	for key, against := range conflicts {
		for _, other := range against {
			pairs++
			assert.Contains(s.t, conflicts[other], key,
				"%s conflicts with %s, but not the other way round", key, other)
		}
	}
	assert.NotZero(s.t, pairs, "no conflicts in the vocabulary; this test proves nothing")
}

func TestImageTypeConflictsAreServedBothWaysRound(t *testing.T) {
	it := createImageTypeTestRunner(t)
	it.testConflictsAreServedBothWaysRound()
}

// restoreEnabled switches the whole vocabulary back on, so an enabling test
// does not leak into the rest of the suite.
func (s *imageTypeTestRunner) restoreEnabled() {
	_, err := s.resolver.Mutation().ImageTypeSetEnabled(s.ctx, models.ImageTypeEnabledInput{})
	assert.NoError(s.t, err)
}

// Disabling hides a type from everyone who asks what may be used, while the
// admin screen keeps seeing it -- otherwise there would be no way back.
func (s *imageTypeTestRunner) testDisabledTypeIsHiddenButRecoverable() {
	defer s.restoreEnabled()

	_, err := s.resolver.Mutation().ImageTypeSetEnabled(s.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	keysIn := func(groups []models.ImageTypeGroup) []models.ImageTypeEnum {
		var keys []models.ImageTypeEnum
		for _, group := range groups {
			for _, imageType := range group.Types {
				keys = append(keys, imageType.Key)
			}
		}
		return keys
	}

	visible, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, nil)
	assert.NoError(s.t, err)
	assert.NotContains(s.t, keysIn(visible), models.ImageTypeEnumShotCandid)
	assert.Contains(s.t, keysIn(visible), models.ImageTypeEnumShotPortrait,
		"only the disabled type goes, not its group")

	includeDisabled := true
	all, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, &includeDisabled)
	assert.NoError(s.t, err)
	assert.Contains(s.t, keysIn(all), models.ImageTypeEnumShotCandid,
		"the admin screen has to see what it switched off")

	for _, group := range all {
		for _, imageType := range group.Types {
			if imageType.Key == models.ImageTypeEnumShotCandid {
				assert.False(s.t, imageType.Enabled)
			}
		}
	}
}

// A group being off takes its types with it, without their own flags being
// rewritten -- so switching the group back on restores exactly what was there.
func (s *imageTypeTestRunner) testDisabledGroupHidesItsTypes() {
	defer s.restoreEnabled()

	_, err := s.resolver.Mutation().ImageTypeSetEnabled(s.ctx, models.ImageTypeEnabledInput{
		DisabledGroups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumPosture},
	})
	assert.NoError(s.t, err)

	visible, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, nil)
	assert.NoError(s.t, err)
	for _, group := range visible {
		assert.NotEqual(s.t, models.ImageTypeGroupEnumPosture, group.Key)
	}
	assert.Len(s.t, visible, 4, "the other four are untouched")

	includeDisabled := true
	all, err := s.resolver.Query().ImageTypeGroups(s.ctx, nil, &includeDisabled)
	assert.NoError(s.t, err)
	assert.Len(s.t, all, 5)

	for _, group := range all {
		if group.Key != models.ImageTypeGroupEnumPosture {
			continue
		}
		assert.False(s.t, group.Enabled)
		for _, imageType := range group.Types {
			assert.True(s.t, imageType.Enabled,
				"a group being off must not rewrite its types' own flags: %s", imageType.Key)
		}
	}
}

func TestDisabledTypeIsHiddenButRecoverable(t *testing.T) {
	s := createImageTypeTestRunner(t)
	s.testDisabledTypeIsHiddenButRecoverable()
}

func TestDisabledGroupHidesItsTypes(t *testing.T) {
	s := createImageTypeTestRunner(t)
	s.testDisabledGroupHidesItsTypes()
}
