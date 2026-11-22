package gallery

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
)

func TestValidateImageIndexes(t *testing.T) {
	valid := []models.GalleryImageInput{{Index: 2, PHash: 2}, {Index: 1, PHash: 1}}
	if err := validateImagesForTest(valid); err != nil {
		t.Fatalf("valid indexes rejected: %v", err)
	}
	for _, indexes := range [][]int{{1, 3}, {1, 1}, {0, 1}} {
		images := make([]models.GalleryImageInput, len(indexes))
		for i, index := range indexes {
			images[i].Index = index
			images[i].PHash = models.FingerprintHash(index + i + 1)
		}
		if err := validateImagesForTest(images); err == nil {
			t.Fatalf("invalid indexes %v accepted", indexes)
		}
	}

	duplicates := []models.GalleryImageInput{
		{Index: 1, PHash: 42},
		{Index: 2, PHash: 42},
	}
	if err := validateImagesForTest(duplicates); err == nil {
		t.Fatal("duplicate gallery pHashes accepted")
	}
}

func validateImagesForTest(images []models.GalleryImageInput) error {
	return models.ValidateGalleryImages(
		images,
		func(image models.GalleryImageInput) int { return image.Index },
		func(image models.GalleryImageInput) models.FingerprintHash { return image.PHash },
	)
}
