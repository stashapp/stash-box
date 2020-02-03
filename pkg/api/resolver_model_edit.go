package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type editResolver struct{ *Resolver }

func (r *editResolver) ID(ctx context.Context, obj *models.Edit) (string, error) {
	return obj.ID.String(), nil
}

func (r *editResolver) User(ctx context.Context, obj *models.Edit) (*models.User, error) {
	qb := models.NewUserQueryBuilder(nil)
	user, err := qb.Find(obj.UserID)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *editResolver) Target(ctx context.Context, obj *models.Edit) (models.EditTarget, error) {
	// TODO
	return nil, nil
}

func (r *editResolver) TargetType(ctx context.Context, obj *models.Edit) (models.TargetTypeEnum, error) {
	var ret models.TargetTypeEnum
	if !resolveEnumString(obj.TargetType, &ret) {
		return "", nil
	}

	return ret, nil
}

func (r *editResolver) MergeSources(ctx context.Context, obj *models.Edit) ([]models.EditTarget, error) {
	// TODO
	return nil, nil
}

func (r *editResolver) Operation(ctx context.Context, obj *models.Edit) (models.OperationEnum, error) {
	var ret models.OperationEnum
	if !resolveEnumString(obj.Operation, &ret) {
		return "", nil
	}

	return ret, nil
}

func (r *editResolver) EditComment(ctx context.Context, obj *models.Edit) (*string, error) {
	return resolveNullString(obj.EditComment)
}

func (r *editResolver) Details(ctx context.Context, obj *models.Edit) (models.EditDetails, error) {
	// TODO
	return nil, nil
}

func (r *editResolver) Comments(ctx context.Context, obj *models.Edit) ([]*models.VoteComment, error) {
	// TODO
	return nil, nil
}

func (r *editResolver) Votes(ctx context.Context, obj *models.Edit) ([]*models.VoteComment, error) {
	// TODO
	return nil, nil
}

func (r *editResolver) Status(ctx context.Context, obj *models.Edit) (models.VoteStatusEnum, error) {
	var ret models.VoteStatusEnum
	if !resolveEnumString(obj.Status, &ret) {
		return "", nil
	}

	return ret, nil
}
