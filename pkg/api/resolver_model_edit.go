package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type editResolver struct{ *Resolver }

func (r *editResolver) User(ctx context.Context, obj *models.Edit) (*models.User, error) {
	panic("not implemented")
}
func (r *editResolver) TargetType(ctx context.Context, obj *models.Edit) (models.TargetTypeEnum, error) {
	panic("not implemented")
}
func (r *editResolver) Operation(ctx context.Context, obj *models.Edit) (models.OperationEnum, error) {
	panic("not implemented")
}
func (r *editResolver) EditComment(ctx context.Context, obj *models.Edit) (*string, error) {
	panic("not implemented")
}
func (r *editResolver) Details(ctx context.Context, obj *models.Edit) (models.EditDetails, error) {
	panic("not implemented")
}
func (r *editResolver) Comments(ctx context.Context, obj *models.Edit) ([]*models.VoteComment, error) {
	panic("not implemented")
}
func (r *editResolver) Votes(ctx context.Context, obj *models.Edit) ([]*models.VoteComment, error) {
	panic("not implemented")
}
func (r *editResolver) VoteCount(ctx context.Context, obj *models.Edit) (int, error) {
	panic("not implemented")
}
func (r *editResolver) Status(ctx context.Context, obj *models.Edit) (models.VoteStatusEnum, error) {
	panic("not implemented")
}
