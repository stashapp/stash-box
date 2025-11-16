package api

import (
	"context"
	"fmt"
	"time"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
)

type draftResolver struct{ *Resolver }

func (r *draftResolver) Created(ctx context.Context, obj *models.Draft) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *draftResolver) Expires(ctx context.Context, obj *models.Draft) (*time.Time, error) {
	duration := time.Second * time.Duration(config.GetDraftTimeLimit())
	expiration := obj.CreatedAt.Add(duration)
	return &expiration, nil
}

func (r *draftResolver) Data(ctx context.Context, obj *models.Draft) (models.DraftData, error) {
	switch obj.Type {
	case "SCENE":
		return obj.GetSceneData()
	case "PERFORMER":
		return obj.GetPerformerData()
	default:
		return nil, fmt.Errorf("unsupported type: %s", obj.Type)
	}
}
