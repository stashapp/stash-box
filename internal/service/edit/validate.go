package edit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/db"
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

func validateEditPrerequisites(edit *models.Edit) error {
	var status models.VoteStatusEnum
	utils.ResolveEnumString(edit.Status, &status)
	if status != models.VoteStatusEnumPending {
		return fmt.Errorf("%w: %s", ErrInvalidVoteStatus, edit.Status)
	}

	return nil
}

func validateSceneEditInput(ctx context.Context, queries *db.Queries, input models.SceneEditInput, edit *models.Edit, update bool) error {
	if input.Details == nil {
		return nil
	}

	if input.Details.DraftID != nil {
		if err := validateDraftID(ctx, queries, edit.ID, *input.Details.DraftID, update); err != nil {
			return err
		}
	}

	if input.Details.StudioID != nil {
		_, err := queries.FindStudio(ctx, *input.Details.StudioID)
		if err != nil {
			return fmt.Errorf("%w: %s", ErrInvalidStudio, *input.Details.StudioID)
		}
	}
	if len(input.Details.ImageIds) > 0 {
		images, err := queries.FindImagesByIds(ctx, input.Details.ImageIds)
		if err != nil || len(images) < len(input.Details.ImageIds) {
			return fmt.Errorf("%w: %w", ErrInvalidImage, err)
		}
	}
	if len(input.Details.TagIds) > 0 {
		tags, err := queries.FindTagsByIds(ctx, input.Details.TagIds)
		if err != nil || len(tags) < len(input.Details.TagIds) {
			return fmt.Errorf("%w: %w", ErrInvalidTag, err)
		}
	}
	if len(input.Details.Performers) > 0 {
		var ids []uuid.UUID
		for _, appearance := range input.Details.Performers {
			ids = append(ids, appearance.PerformerID)
		}
		performers, err := queries.FindPerformersByIds(ctx, ids)
		if err != nil || len(performers) < len(ids) {
			return fmt.Errorf("%w: %w", ErrInvalidPerformer, err)
		}
	}

	return validateURLs(ctx, queries, input.Details.Urls)
}

func validatePerformerEditInput(ctx context.Context, queries *db.Queries, input models.PerformerEditInput, edit *models.Edit, update bool) error {
	if input.Details == nil {
		return nil
	}

	if input.Details.DraftID != nil {
		if err := validateDraftID(ctx, queries, edit.ID, *input.Details.DraftID, update); err != nil {
			return err
		}
	}

	if len(input.Details.ImageIds) > 0 {
		images, err := queries.FindImagesByIds(ctx, input.Details.ImageIds)
		if err != nil || len(images) < len(input.Details.ImageIds) {
			return fmt.Errorf("%w: %w", ErrInvalidImage, err)
		}
	}

	return validateURLs(ctx, queries, input.Details.Urls)
}

func validateDraftID(ctx context.Context, queries *db.Queries, draftID uuid.UUID, editID uuid.UUID, update bool) error {
	if !update {
		_, err := queries.FindDraft(ctx, draftID)
		if err != nil {
			return fmt.Errorf("%w: %s", ErrInvalidDraft, draftID)
		}
	} else {
		edit, err := queries.FindEdit(ctx, editID)
		if err != nil {
			return err
		}

		type Data struct {
			New struct {
				DraftID *uuid.UUID `json:"draft_id"`
			} `json:"new"`
		}

		var data Data
		err = json.Unmarshal(edit.Data, &data)
		if err != nil {
			return err
		}

		if data.New.DraftID == nil || *data.New.DraftID != draftID {
			return fmt.Errorf("%w: %s", ErrInvalidDraft, draftID)
		}
	}

	return nil
}

func validateStudioEditInput(ctx context.Context, queries *db.Queries, input models.StudioEditInput) error {
	if input.Details == nil {
		return nil
	}

	if input.Details.ParentID != nil {
		_, err := queries.FindStudio(ctx, *input.Details.ParentID)
		if err != nil {
			return fmt.Errorf("%w: %s", ErrInvalidStudio, *input.Details.ParentID)
		}
	}

	if len(input.Details.ImageIds) > 0 {
		images, err := queries.FindImagesByIds(ctx, input.Details.ImageIds)
		if err != nil || len(images) < len(input.Details.ImageIds) {
			return fmt.Errorf("%w: %w", ErrInvalidImage, err)
		}
	}

	return validateURLs(ctx, queries, input.Details.Urls)
}

func validateURLs(ctx context.Context, queries *db.Queries, urls []*models.URLInput) error {
	if len(urls) == 0 {
		return nil
	}

	var ids []uuid.UUID
	for _, url := range urls {
		ids = append(ids, url.SiteID)
	}
	sites, err := queries.FindSitesByIds(ctx, ids)
	if err != nil {
		return fmt.Errorf("%w: %w", ErrInvalidSite, err)
	}

	siteMap := make(map[uuid.UUID]bool, len(sites))
	for _, site := range sites {
		siteMap[site.ID] = true
	}

	for _, id := range ids {
		if !siteMap[id] {
			return fmt.Errorf("%w", ErrInvalidSite)
		}
	}

	return nil
}
