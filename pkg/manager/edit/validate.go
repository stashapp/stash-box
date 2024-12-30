package edit

import (
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

var ErrEditAlreadyApplied = errors.New("edit already applied")
var ErrInvalidVoteStatus = errors.New("invalid vote status")
var ErrEditNotFound = errors.New("edit not found")
var ErrEntityNotFound = errors.New("entity not found")
var ErrEntityDeleted = errors.New("entity is deleted")
var ErrInvalidDraft = errors.New("invalid draft id")
var ErrInvalidImage = errors.New("invalid image id")
var ErrInvalidStudio = errors.New("invalid studio id")
var ErrInvalidPerformer = errors.New("invalid performer id")
var ErrInvalidTag = errors.New("invalid tag id")
var ErrInvalidSite = errors.New("invalid url site id")

type editEntity interface {
	IsDeleted() bool
}

func validateEditEntity(entity *editEntity, id uuid.UUID, typeName string) error {
	if entity == nil {
		return fmt.Errorf("%w: %s %s", ErrEntityNotFound, typeName, id.String())
	}
	if (*entity).IsDeleted() {
		return fmt.Errorf("%w: %s %s", ErrEntityDeleted, typeName, id.String())
	}

	return nil
}

func validateEditPresence(edit *models.Edit) error {
	if edit == nil {
		return ErrEditNotFound
	}

	if edit.Applied {
		return ErrEditAlreadyApplied
	}

	return nil
}

func validateEditPrerequisites(fac models.Repo, edit *models.Edit) error {
	var status models.VoteStatusEnum
	utils.ResolveEnumString(edit.Status, &status)
	if status != models.VoteStatusEnumPending {
		return fmt.Errorf("%w: %s", ErrInvalidVoteStatus, edit.Status)
	}

	return nil
}

func validateSceneEditInput(fac models.Repo, input models.SceneEditInput) error {
	if input.Details == nil {
		return nil
	}

	if input.Details.DraftID != nil {
		draft, err := fac.Draft().Find(*input.Details.DraftID)
		if err != nil {
			return err
		}
		if draft == nil {
			return fmt.Errorf("%w: %s", ErrInvalidDraft, *input.Details.DraftID)
		}
	}
	if input.Details.StudioID != nil {
		draft, err := fac.Studio().Find(*input.Details.StudioID)
		if err != nil {
			return err
		}
		if draft == nil {
			return fmt.Errorf("%w: %s", ErrInvalidStudio, *input.Details.StudioID)
		}
	}
	if len(input.Details.ImageIds) > 0 {
		images, errs := fac.Image().FindByIds(input.Details.ImageIds)
		for i := range images {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if images[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidImage, input.Details.ImageIds[i])
			}
		}
	}
	if len(input.Details.TagIds) > 0 {
		tags, errs := fac.Tag().FindByIds(input.Details.TagIds)
		for i := range tags {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if tags[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidTag, input.Details.TagIds[i])
			}
		}
	}
	if len(input.Details.Performers) > 0 {
		var ids []uuid.UUID
		for _, appearance := range input.Details.Performers {
			ids = append(ids, appearance.PerformerID)
		}
		performers, errs := fac.Performer().FindByIds(ids)
		for i := range performers {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if performers[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidPerformer, ids[i])
			}
		}
	}
	if len(input.Details.Urls) > 0 {
		var ids []uuid.UUID
		for _, url := range input.Details.Urls {
			ids = append(ids, url.SiteID)
		}
		sites, errs := fac.Site().FindByIds(ids)
		for i := range sites {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if sites[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidSite, ids[i])
			}
		}
	}
	return nil
}

func validatePerformerEditInput(fac models.Repo, input models.PerformerEditInput) error {
	if input.Details == nil {
		return nil
	}

	if input.Details.DraftID != nil {
		draft, err := fac.Draft().Find(*input.Details.DraftID)
		if err != nil {
			return err
		}
		if draft == nil {
			return fmt.Errorf("%w: %s", ErrInvalidDraft, *input.Details.DraftID)
		}
	}
	if len(input.Details.ImageIds) > 0 {
		images, errs := fac.Image().FindByIds(input.Details.ImageIds)
		for i := range images {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if images[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidImage, input.Details.ImageIds[i])
			}
		}
	}
	if len(input.Details.Urls) > 0 {
		var ids []uuid.UUID
		for _, url := range input.Details.Urls {
			ids = append(ids, url.SiteID)
		}
		sites, errs := fac.Site().FindByIds(ids)
		for i := range sites {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if sites[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidSite, ids[i])
			}
		}
	}
	return nil
}

func validateStudioEditInput(fac models.Repo, input models.StudioEditInput) error {
	if input.Details == nil {
		return nil
	}

	if input.Details.ParentID != nil {
		draft, err := fac.Studio().Find(*input.Details.ParentID)
		if err != nil {
			return err
		}
		if draft == nil {
			return fmt.Errorf("%w: %s", ErrInvalidStudio, *input.Details.ParentID)
		}
	}
	if len(input.Details.ImageIds) > 0 {
		images, errs := fac.Image().FindByIds(input.Details.ImageIds)
		for i := range images {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if images[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidImage, input.Details.ImageIds[i])
			}
		}
	}
	if len(input.Details.Urls) > 0 {
		var ids []uuid.UUID
		for _, url := range input.Details.Urls {
			ids = append(ids, url.SiteID)
		}
		sites, errs := fac.Site().FindByIds(ids)
		for i := range sites {
			if errs != nil && errs[i] != nil {
				return errs[i]
			}
			if sites[i] == nil {
				return fmt.Errorf("%w: %s", ErrInvalidSite, ids[i])
			}
		}
	}
	return nil
}
