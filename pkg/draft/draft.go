package draft

import (
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func Destroy(fac models.Repo, id uuid.UUID) error {
	dqb := fac.Draft()
	draft, err := dqb.Find(id)
	if err != nil {
		return err
	}

	var imageID *uuid.UUID
	switch draft.Type {
	case "SCENE":
		data, err := draft.GetSceneData()
		if err != nil {
			return err
		}
		imageID = data.Image
	case "PERFORMER":
		data, err := draft.GetPerformerData()
		if err != nil {
			return err
		}
		imageID = data.Image
	default:
		return fmt.Errorf("Unsupported type: %s", draft.Type)
	}

	if imageID != nil {
		imageService := image.GetService(fac.Image())
		if err := imageService.DestroyUnusedImage(*imageID); err != nil {
			return err
		}
	}

	return dqb.Destroy(id)
}
