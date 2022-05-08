package edit

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func MergeImages(current []*models.Image, added []uuid.UUID, removed []uuid.UUID) []uuid.UUID {
	var imageIds []uuid.UUID
	for _, image := range current {
		imageIds = append(imageIds, image.ID)
	}
	return utils.ProcessSlice(imageIds, added, removed)
}

func MergeURLs(currentURLs []*models.URL, addedURLs []*models.URL, removedURLs []*models.URL) []*models.URL {
	var urls []models.URL
	for _, v := range currentURLs {
		urls = append(urls, *v)
	}
	var added []models.URL
	for _, v := range addedURLs {
		added = append(added, *v)
	}
	var removed []models.URL
	for _, v := range removedURLs {
		removed = append(removed, *v)
	}

	urls = utils.ProcessSlice(urls, added, removed)
	var ret []*models.URL
	for i := range urls {
		ret = append(ret, &urls[i])
	}

	return ret
}

func MergeBodyMods(currentBodyMods models.PerformerBodyMods, addedMods []*models.BodyModification, removedMods []*models.BodyModification) []*models.BodyModification {
	var current []models.BodyModification
	for _, v := range currentBodyMods {
		current = append(current, v.ToBodyModification())
	}
	var added []models.BodyModification
	for _, v := range addedMods {
		added = append(added, *v)
	}
	var removed []models.BodyModification
	for _, v := range removedMods {
		removed = append(removed, *v)
	}

	current = utils.ProcessSlice(current, added, removed)
	var ret []*models.BodyModification
	for i := range current {
		ret = append(ret, &current[i])
	}

	return ret
}
