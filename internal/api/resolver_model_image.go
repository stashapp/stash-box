package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(ctx context.Context, obj *models.Image) (string, error) {
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	baseURL := ctx.Value(BaseURLCtxKey).(string)
	id := obj.ID.String()
	return baseURL + "/images/" + id, nil
}

// Types is dataloader-batched rather than a plain field: an image's labels come from a join, unlike its other columns
func (r *imageResolver) Types(ctx context.Context, obj *models.Image) ([]models.ImageTypeEnum, error) {
	assignments, err := dataloader.For(ctx).ImageTypesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	types := make([]models.ImageTypeEnum, len(assignments))
	for i, assignment := range assignments {
		types[i] = assignment.Type
	}
	return types, nil
}

// CategorizedBy resolves the stored actor id to a user lazily, the same way
// mod_audit rows resolve theirs; nil both for an uncategorized image and for
// a categorizer whose account has since been deleted
func (r *imageResolver) CategorizedBy(ctx context.Context, obj *models.Image) (*models.User, error) {
	if !obj.CategorizedBy.Valid {
		return nil, nil
	}
	return dataloader.For(ctx).UserByID.Load(obj.CategorizedBy.UUID)
}

func (r *imageResolver) Performers(ctx context.Context, obj *models.Image) ([]models.Performer, error) {
	loaders := dataloader.For(ctx)
	ids, err := loaders.ImagePerformerIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	entities, errs := loaders.PerformerByID.LoadAll(ids)
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}

	result := make([]models.Performer, 0, len(entities))
	for _, entity := range entities {
		if entity != nil {
			result = append(result, *entity)
		}
	}
	return result, nil
}

func (r *imageResolver) Scenes(ctx context.Context, obj *models.Image) ([]models.Scene, error) {
	loaders := dataloader.For(ctx)
	ids, err := loaders.ImageSceneIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	entities, errs := loaders.SceneByID.LoadAll(ids)
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}

	result := make([]models.Scene, 0, len(entities))
	for _, entity := range entities {
		if entity != nil {
			result = append(result, *entity)
		}
	}
	return result, nil
}

func (r *imageResolver) Studios(ctx context.Context, obj *models.Image) ([]models.Studio, error) {
	loaders := dataloader.For(ctx)
	ids, err := loaders.ImageStudioIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	entities, errs := loaders.StudioByID.LoadAll(ids)
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}

	result := make([]models.Studio, 0, len(entities))
	for _, entity := range entities {
		if entity != nil {
			result = append(result, *entity)
		}
	}
	return result, nil
}

func (r *imageResolver) Edits(ctx context.Context, obj *models.Image) ([]models.Edit, error) {
	return r.services.Image().FindEdits(ctx, obj.ID)
}
