package image

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

func formatDims(images []models.Image) []string {
	if images == nil {
		return nil
	}
	dims := make([]string, len(images))
	for i, img := range images {
		dims[i] = fmt.Sprintf("%dx%d", img.Width, img.Height)
	}
	return dims
}

func TestOrderLandscape(t *testing.T) {
	tests := []struct {
		name     string
		images   []models.Image
		expected []models.Image
	}{
		{
			name: "Sorts by widest to most narrow aspect ratio",
			images: []models.Image{
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 400, Height: 600},   // 2:3 (0.666)
				{Width: 422, Height: 600},   // 0.703
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 600, Height: 400},   // 3:2 (1.5)
			},
			expected: []models.Image{
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 600, Height: 400},   // 3:2 (1.5)
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 422, Height: 600},   // 0.703
				{Width: 400, Height: 600},   // 2:3 (0.666)
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
			},
		},
		{
			name: "Fallback to width descending when aspect ratio is identical",
			images: []models.Image{
				{Width: 500, Height: 1000},  // Aspect: 0.5, Width: 500
				{Width: 250, Height: 500},   // Aspect: 0.5, Width: 250
				{Width: 1000, Height: 2000}, // Aspect: 0.5, Width: 1000
			},
			expected: []models.Image{
				{Width: 1000, Height: 2000},
				{Width: 500, Height: 1000},
				{Width: 250, Height: 500},
			},
		},
		{
			name: "Zero width images sort last (aspect 0.0)",
			images: []models.Image{
				{Width: 1920, Height: 1080}, // aspect 1.778
				{Width: 0, Height: 1000},    // aspect 0.0
				{Width: 640, Height: 480},   // aspect 1.333
			},
			expected: []models.Image{
				{Width: 1920, Height: 1080},
				{Width: 640, Height: 480},
				{Width: 0, Height: 1000},
			},
		},
		{
			name: "Zero height images do not panic",
			images: []models.Image{
				{Width: 1920, Height: 1080},
				{Width: 1000, Height: 0},
				{Width: 0, Height: 0},
			},
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Copy the input slice so we don't mutate the test case definition
			input := make([]models.Image, len(tt.images))
			copy(input, tt.images)

			OrderLandscape(input)

			if tt.expected != nil {
				assert.Equal(t, formatDims(tt.expected), formatDims(input))
			}
		})
	}
}

func TestOrderPortrait(t *testing.T) {
	tests := []struct {
		name     string
		images   []models.Image
		expected []models.Image
	}{
		{
			name: "Sorts by distance from 2:3 ratio",
			images: []models.Image{
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 400, Height: 600},   // 2:3 (0.666) (ideal)
				{Width: 600, Height: 400},   // 3:2 (1.5)
				{Width: 422, Height: 600},   // 0.703
			},
			expected: []models.Image{
				{Width: 400, Height: 600},   // 2:3 (0.666) (ideal)
				{Width: 422, Height: 600},   // 0.703
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 600, Height: 400},   // 3:2 (1.5)
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
			},
		},
		{
			name: "Fallback to height descending when aspect ratio is identical",
			images: []models.Image{
				{Width: 500, Height: 1000},  // Aspect: 0.5, Height: 1000
				{Width: 250, Height: 500},   // Aspect: 0.5, Height: 500
				{Width: 1000, Height: 2000}, // Aspect: 0.5, Height: 2000
			},
			expected: []models.Image{
				{Width: 1000, Height: 2000},
				{Width: 500, Height: 1000},
				{Width: 250, Height: 500},
			},
		},
		{
			name: "Zero width images sort last (aspect 0.0, max distance from ideal)",
			images: []models.Image{
				{Width: 400, Height: 600},   // ideal 2:3, diff 0
				{Width: 0, Height: 1000},    // aspect 0.0, diff 0.667
				{Width: 1080, Height: 1920}, // 9:16 (0.5625), diff 0.104
			},
			expected: []models.Image{
				{Width: 400, Height: 600},
				{Width: 1080, Height: 1920},
				{Width: 0, Height: 1000},
			},
		},
		{
			name: "Zero height images do not panic",
			images: []models.Image{
				{Width: 400, Height: 600},
				{Width: 1000, Height: 0},
				{Width: 0, Height: 0},
			},
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Copy the input slice so we don't mutate the test case definition
			input := make([]models.Image, len(tt.images))
			copy(input, tt.images)

			OrderPortrait(input)

			if tt.expected != nil {
				assert.Equal(t, formatDims(tt.expected), formatDims(input))
			}
		})
	}
}

func newID(t *testing.T) uuid.UUID {
	t.Helper()
	v, err := uuid.NewV7()
	assert.NoError(t, err)
	return v
}

func datePtr(s string) *string { return &s }

// The tiebreak's order has to survive among equally ranked images, or the
// primary image changes without anyone editing anything
//
// Go's sort only switches from insertion sort to pdqsort above a small
// threshold, so the slice has to be long! The ranks also have to
// interleave: given a comparator that reports everything equal,
// pdqsort recognises an already-sorted run and leaves it alone, so a
// uniformly-ranked gallery passes even with sort.Slice
func TestOrderByTypeIsStableAcrossEqualRanks(t *testing.T) {
	const count = 60

	images := make([]models.Image, count)
	ranks := make(map[uuid.UUID]RankTuple, count)
	for i := range images {
		id, err := uuid.NewV7()
		assert.NoError(t, err)

		// Identical dimensions, so the tiebreak cannot reorder them either
		images[i] = models.Image{ID: id, Width: 400, Height: 600}
		ranks[id] = RankTuple{i % 2}
	}

	// Sorting must move every odd-positioned image after every even one:
	// the relative order within each half is stability's job
	var expected []uuid.UUID
	for _, remainder := range []int{0, 1} {
		for i, img := range images {
			if i%2 == remainder {
				expected = append(expected, img.ID)
			}
		}
	}

	OrderByType(images, ranks, func([]models.Image) {})

	actual := make([]uuid.UUID, count)
	for i, img := range images {
		actual[i] = img.ID
	}
	assert.Equal(t, expected, actual, "equally ranked images must keep the tiebreak's order")
}

func TestOrderByTypeRanksUntypedLast(t *testing.T) {

	typed, untyped, partly := newID(t), newID(t), newID(t)
	images := []models.Image{
		{ID: untyped, Width: 400, Height: 600},
		{ID: partly, Width: 400, Height: 600},
		{ID: typed, Width: 400, Height: 600},
	}

	ranks := map[uuid.UUID]RankTuple{
		typed: {0, 0},
		// Ranked in the first dimension only; the missing second component
		// must read as Unranked rather than as zero
		partly: {0},
	}

	OrderByType(images, ranks, func([]models.Image) {})

	assert.Equal(t, []uuid.UUID{typed, partly, untyped},
		[]uuid.UUID{images[0].ID, images[1].ID, images[2].ID})
}

// Ties on rank fall to the date, most recent first. Without this two
// equally-labelled images have no order anyone chose: they come back in
// whatever the aspect sort made of them, which is not what a gallery means
func TestNewestFirstOrdersDatedImagesMostRecentFirst(t *testing.T) {

	oldest, middle, newest := newID(t), newID(t), newID(t)
	images := []models.Image{
		{ID: middle, Width: 400, Height: 600},
		{ID: oldest, Width: 400, Height: 600},
		{ID: newest, Width: 400, Height: 600},
	}
	dates := map[uuid.UUID]*string{
		oldest: datePtr("2019-06"),
		middle: datePtr("2021"),
		newest: datePtr("2023-01-15"),
	}

	NewestFirst(dates, func([]models.Image) {})(images)

	assert.Equal(t, []uuid.UUID{newest, middle, oldest},
		[]uuid.UUID{images[0].ID, images[1].ID, images[2].ID})
}

func TestNewestFirstReadsABareYearAsTheStartOfIt(t *testing.T) {

	year, june := newID(t), newID(t)
	images := []models.Image{
		{ID: year, Width: 400, Height: 600},
		{ID: june, Width: 400, Height: 600},
	}
	dates := map[uuid.UUID]*string{year: datePtr("2019"), june: datePtr("2019-06")}

	NewestFirst(dates, func([]models.Image) {})(images)

	assert.Equal(t, []uuid.UUID{june, year},
		[]uuid.UUID{images[0].ID, images[1].ID})
}

// A date is a claim someone made; its absence is not a claim that the image is
// old. So undated images go last rather than being treated as ancient
func TestNewestFirstPutsUndatedImagesLast(t *testing.T) {

	dated, undated, alsoOld := newID(t), newID(t), newID(t)
	images := []models.Image{
		{ID: undated, Width: 400, Height: 600},
		{ID: alsoOld, Width: 400, Height: 600},
		{ID: dated, Width: 400, Height: 600},
	}
	dates := map[uuid.UUID]*string{dated: datePtr("2023"), alsoOld: datePtr("1999")}

	NewestFirst(dates, func([]models.Image) {})(images)

	assert.Equal(t, []uuid.UUID{dated, alsoOld, undated},
		[]uuid.UUID{images[0].ID, images[1].ID, images[2].ID})
}

// Images that tie on date keep whatever the weaker tiebreak decided, or a
// gallery reorders itself between requests
//
// Half dated with the same date and half undated, interleaved, so the sort has
// real work to do: an unstable one has to move every dated image up past an
// undated one, and that is when it scrambles the ties it is carrying
func TestNewestFirstLeavesTiedImagesToTheTiebreak(t *testing.T) {
	const count = 40
	sameDate := "2020"

	images := make([]models.Image, count)
	dates := map[uuid.UUID]*string{}
	var wantDated, wantUndated []uuid.UUID
	for i := range images {
		v, err := uuid.NewV7()
		assert.NoError(t, err)
		images[i] = models.Image{ID: v, Width: 400, Height: 600}

		if i%2 == 0 {
			dates[v] = &sameDate
			wantDated = append(wantDated, v)
		} else {
			wantUndated = append(wantUndated, v)
		}
	}

	NewestFirst(dates, func([]models.Image) {})(images)

	after := make([]uuid.UUID, count)
	for i, img := range images {
		after[i] = img.ID
	}
	assert.Equal(t, append(wantDated, wantUndated...), after,
		"dated first, and each group in the order it arrived")
}

// The composition the resolvers use: rank first, then date, then shape. A
// newer image must not climb above a better-ranked one.
func TestRankOutranksDate(t *testing.T) {

	ranked, newer := newID(t), newID(t)
	images := []models.Image{
		{ID: newer, Width: 400, Height: 600},
		{ID: ranked, Width: 400, Height: 600},
	}
	ranks := map[uuid.UUID]RankTuple{ranked: {0}}
	dates := map[uuid.UUID]*string{ranked: datePtr("1999"), newer: datePtr("2024")}

	OrderByType(images, ranks, NewestFirst(dates, func([]models.Image) {}))

	assert.Equal(t, []uuid.UUID{ranked, newer},
		[]uuid.UUID{images[0].ID, images[1].ID},
		"a label the admin ranked beats a date")
}
