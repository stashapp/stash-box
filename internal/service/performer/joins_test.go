package performer

import (
	"slices"
	"testing"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// Three images in a performer's gallery. Fixed rather than random so a failure
// names the same image twice running
var (
	imageA = uuid.Must(uuid.FromString("00000000-0000-0000-0000-0000000000a1"))
	imageB = uuid.Must(uuid.FromString("00000000-0000-0000-0000-0000000000b2"))
	imageC = uuid.Must(uuid.FromString("00000000-0000-0000-0000-0000000000c3"))
)

// What updateImages reads back before deleting the rows: A is a face crop, B is
// a front pose
func currentAssignments() []queries.PerformerImageType {
	return []queries.PerformerImageType{
		{ImageID: imageA, TypeKey: "CROP_FACE"},
		{ImageID: imageB, TypeKey: "VIEW_FRONT"},
	}
}

func assignment(image uuid.UUID, imageType models.ImageTypeEnum) models.ImageTypeAssignment {
	return models.ImageTypeAssignment{ImageID: image, Type: imageType}
}

// An entry states the whole of what is true about its image, so it replaces
// rather than merges but only for the images it names. Making it
// authoritative over everything in image_ids would force every client that
// touches image_ids to restate the full label set or destroy it
func TestResolveAssignmentsIsAuthoritativeOnlyOverTheImagesItNames(t *testing.T) {
	got := resolveAssignments(
		currentAssignments(),
		[]models.ImageAssignmentInput{
			{ImageID: imageA, Types: []models.ImageTypeEnum{models.ImageTypeEnumViewBack}},
		},
		[]uuid.UUID{imageA, imageB},
	)

	want := []models.ImageTypeAssignment{
		assignment(imageA, models.ImageTypeEnumViewBack),  // replaced, not added to
		assignment(imageB, models.ImageTypeEnumViewFront), // not named, untouched
	}
	if !slices.Equal(got, want) {
		t.Errorf("resolveAssignments = %v, want %v", got, want)
	}
}

// The per-image version of clearing: naming an image with no types strips it,
// and says nothing about any other image
func TestResolveAssignmentsEntryWithNoTypesClearsOnlyThatImage(t *testing.T) {
	got := resolveAssignments(
		currentAssignments(),
		[]models.ImageAssignmentInput{{ImageID: imageA, Types: nil}},
		[]uuid.UUID{imageA, imageB},
	)

	want := []models.ImageTypeAssignment{assignment(imageB, models.ImageTypeEnumViewFront)}
	if !slices.Equal(got, want) {
		t.Errorf("resolveAssignments = %v, want %v", got, want)
	}
}

// performer_image_types' composite foreign key points at performer_images, so
// an assignment for an image that is no longer in the gallery is not merely
// pointless because it fails the insert and takes the whole transaction with it.
// Both directions: a label left over from before, and one the submission asks
// for on an image it did not include.
//
// Asserts the property, and there is now one mechanism behind it: the emitting
// loop walks the image list, so an image not in it is never emitted. That is
// also what TestResolveAssignmentsOrdersByTheImageList checks
func TestResolveAssignmentsDropsImagesThatDidNotSurvive(t *testing.T) {
	got := resolveAssignments(
		currentAssignments(), // B is labelled but no longer in the gallery
		[]models.ImageAssignmentInput{
			{ImageID: imageC, Types: []models.ImageTypeEnum{models.ImageTypeEnumCropBust}},
		},
		[]uuid.UUID{imageA}, // ... and C was never in it
	)

	want := []models.ImageTypeAssignment{assignment(imageA, models.ImageTypeEnumCropFace)}
	if !slices.Equal(got, want) {
		t.Errorf("resolveAssignments = %v, want %v", got, want)
	}
}

// A client sending the same image twice is stating it twice; the later entry is
// the more recent statement. Worth pinning because the alternative (merging them)
// would silently make Types additive for repeats but replacing otherwise
func TestResolveAssignmentsTakesTheLastEntryForARepeatedImage(t *testing.T) {
	got := resolveAssignments(
		nil,
		[]models.ImageAssignmentInput{
			{ImageID: imageA, Types: []models.ImageTypeEnum{models.ImageTypeEnumCropFace}},
			{ImageID: imageA, Types: []models.ImageTypeEnum{models.ImageTypeEnumViewBack}},
		},
		[]uuid.UUID{imageA},
	)

	want := []models.ImageTypeAssignment{assignment(imageA, models.ImageTypeEnumViewBack)}
	if !slices.Equal(got, want) {
		t.Errorf("resolveAssignments = %v, want %v", got, want)
	}
}

// Assignments are gathered through a map, so the output order has to come from
// the image list rather than from map iteration: otherwise the rows inserted
// differ run to run for no reason, and anything comparing them is flaky
func TestResolveAssignmentsOrdersByTheImageList(t *testing.T) {
	images := []uuid.UUID{imageB, imageA}
	first := resolveAssignments(currentAssignments(), nil, images)

	want := []models.ImageTypeAssignment{
		assignment(imageB, models.ImageTypeEnumViewFront),
		assignment(imageA, models.ImageTypeEnumCropFace),
	}
	if !slices.Equal(first, want) {
		t.Errorf("resolveAssignments = %v, want %v", first, want)
	}

	for range 20 {
		if got := resolveAssignments(currentAssignments(), nil, images); !slices.Equal(got, first) {
			t.Fatalf("order varies between calls: %v then %v", first, got)
		}
	}
}

func date(value string) *string { return &value }

// Renders a date for a failure message, distinguishing "no entry for this
// image" from "an entry saying the date is null"
func dateOf(dates map[uuid.UUID]*string, image uuid.UUID) string {
	value, present := dates[image]
	switch {
	case !present:
		return "<absent>"
	case value == nil:
		return "<null>"
	default:
		return *value
	}
}

func TestResolveDatesAnEntryWithoutADateClearsTheDate(t *testing.T) {
	dates := resolveDates(
		[]queries.PerformerImage{{ImageID: imageA, Date: date("2019-06-15")}},
		[]models.ImageAssignmentInput{
			// Relabelling only: date is left as nil
			{ImageID: imageA, Types: []models.ImageTypeEnum{models.ImageTypeEnumViewBack}},
		},
	)

	if got := dateOf(dates, imageA); got != "<null>" {
		t.Errorf("image A's date = %s, want <null> - an entry states the whole of what is true", got)
	}
}
