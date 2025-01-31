package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type notificationResolver struct{ *Resolver }

func (r *notificationResolver) Created(ctx context.Context, obj *models.Notification) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *notificationResolver) Read(ctx context.Context, obj *models.Notification) (bool, error) {
	return obj.ReadAt.Valid, nil
}

func (r *notificationResolver) Data(ctx context.Context, obj *models.Notification) (models.NotificationData, error) {
	switch obj.Type {
	case models.NotificationEnumCommentCommentedEdit:
		fallthrough
	case models.NotificationEnumCommentOwnEdit:
		fallthrough
	case models.NotificationEnumCommentVotedEdit:
		comment, err := dataloader.For(ctx).EditCommentByID.Load(obj.TargetID)
		if err != nil {
			return nil, err
		}

		switch obj.Type {
		case models.NotificationEnumCommentCommentedEdit:
			return &models.CommentCommentedEdit{Comment: comment}, nil
		case models.NotificationEnumCommentOwnEdit:
			return &models.CommentOwnEdit{Comment: comment}, nil
		default:
			return &models.CommentVotedEdit{Comment: comment}, nil
		}

	case models.NotificationEnumFavoritePerformerScene:
		fallthrough
	case models.NotificationEnumFavoriteStudioScene:
		scene, err := dataloader.For(ctx).SceneByID.Load(obj.TargetID)
		if err != nil {
			return nil, err
		}

		if obj.Type == models.NotificationEnumFavoritePerformerScene {
			return &models.FavoritePerformerScene{Scene: scene}, nil
		} else {
			return &models.FavoriteStudioScene{Scene: scene}, nil
		}

	case models.NotificationEnumFavoritePerformerEdit:
		fallthrough
	case models.NotificationEnumFavoriteStudioEdit:
		fallthrough
	case models.NotificationEnumDownvoteOwnEdit:
		fallthrough
	case models.NotificationEnumFailedOwnEdit:
		fallthrough
	case models.NotificationEnumFingerprintedSceneEdit:
		fallthrough
	case models.NotificationEnumUpdatedEdit:
		edit, err := dataloader.For(ctx).EditByID.Load(obj.TargetID)
		if err != nil {
			return nil, err
		}

		// nolint:exhaustive
		switch obj.Type {
		case models.NotificationEnumFavoritePerformerEdit:
			return &models.FavoritePerformerEdit{Edit: edit}, nil
		case models.NotificationEnumFavoriteStudioEdit:
			return &models.FavoriteStudioEdit{Edit: edit}, nil
		case models.NotificationEnumDownvoteOwnEdit:
			return &models.DownvoteOwnEdit{Edit: edit}, nil
		case models.NotificationEnumFailedOwnEdit:
			return &models.FailedOwnEdit{Edit: edit}, nil
		case models.NotificationEnumUpdatedEdit:
			return &models.UpdatedEdit{Edit: edit}, nil
		case models.NotificationEnumFingerprintedSceneEdit:
			return &models.FingerprintedSceneEdit{Edit: edit}, nil
		}
	}
	return nil, nil
}
