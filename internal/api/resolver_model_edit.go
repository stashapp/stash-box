package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type editResolver struct{ *Resolver }

func (r *editResolver) ID(ctx context.Context, obj *models.Edit) (string, error) {
	return obj.ID.String(), nil
}

func (r *editResolver) User(ctx context.Context, obj *models.Edit) (*models.User, error) {
	if obj.UserID.UUID.IsNil() {
		return nil, nil
	}

	return r.services.User().FindByID(ctx, obj.UserID.UUID)
}

func (r *editResolver) Created(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *editResolver) Updated(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	return obj.UpdatedAt, nil
}

func (r *editResolver) Closed(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	return obj.ClosedAt, nil
}

func (r *editResolver) Expires(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	if obj.Status != models.VoteStatusEnumPending.String() {
		return nil, nil
	}

	// Count expiration time from creation, or time when edit was amended
	startTime := obj.CreatedAt
	if obj.UpdatedAt != nil {
		startTime = *obj.UpdatedAt
	}

	// Pending edits that have reached the voting threshold have shorter voting periods.
	// This will happen for destructive edits, or when votes are not unanimous.
	short := config.GetVoteApplicationThreshold() > 0 && obj.VoteCount >= config.GetVoteApplicationThreshold()
	duration := config.GetVotingPeriod()
	if short {
		duration = config.GetMinDestructiveVotingPeriod()
	}

	expiration := startTime.Add(time.Second * time.Duration(duration))
	return &expiration, nil
}

func (r *editResolver) Target(ctx context.Context, obj *models.Edit) (models.EditTarget, error) {
	var operation models.OperationEnum
	var status models.VoteStatusEnum
	utils.ResolveEnumString(obj.Operation, &operation)
	utils.ResolveEnumString(obj.Status, &status)
	if operation == models.OperationEnumCreate && status != models.VoteStatusEnumAccepted && status != models.VoteStatusEnumImmediateAccepted {
		return nil, nil
	}

	return r.services.Edit().GetEditTarget(ctx, obj.ID)
}

func (r *editResolver) TargetType(ctx context.Context, obj *models.Edit) (models.TargetTypeEnum, error) {
	var ret models.TargetTypeEnum
	if !utils.ResolveEnumString(obj.TargetType, &ret) {
		return "", nil
	}

	return ret, nil
}

func (r *editResolver) MergeSources(ctx context.Context, obj *models.Edit) ([]models.EditTarget, error) {
	editData := obj.GetData()
	if editData == nil {
		return nil, nil
	}

	if len(editData.MergeSources) == 0 {
		return nil, nil
	}

	return r.services.Edit().GetMergeSources(ctx, editData.MergeSources, obj.TargetType)
}

func (r *editResolver) Operation(ctx context.Context, obj *models.Edit) (models.OperationEnum, error) {
	var ret models.OperationEnum
	if !utils.ResolveEnumString(obj.Operation, &ret) {
		return "", nil
	}

	return ret, nil
}

func (r *editResolver) Details(ctx context.Context, obj *models.Edit) (models.EditDetails, error) {
	var ret models.EditDetails
	var targetType models.TargetTypeEnum
	utils.ResolveEnumString(obj.TargetType, &targetType)

	switch targetType {
	case models.TargetTypeEnumTag:
		tagData, err := obj.GetTagData()
		if err != nil {
			return nil, err
		}
		if tagData.New != nil {
			tagData.New.EditID = obj.ID
		}
		ret = tagData.New
	case models.TargetTypeEnumPerformer:
		performerData, err := obj.GetPerformerData()
		if err != nil {
			return nil, err
		}
		if performerData.New != nil {
			performerData.New.EditID = obj.ID
		}
		ret = performerData.New
	case models.TargetTypeEnumStudio:
		studioData, err := obj.GetStudioData()
		if err != nil {
			return nil, err
		}
		if studioData.New != nil {
			studioData.New.EditID = obj.ID
		}
		ret = studioData.New
	case models.TargetTypeEnumScene:
		sceneData, err := obj.GetSceneData()
		if err != nil {
			return nil, err
		}
		if sceneData.New != nil {
			sceneData.New.EditID = obj.ID
		}
		ret = sceneData.New
	}

	return ret, nil
}

func (r *editResolver) OldDetails(ctx context.Context, obj *models.Edit) (models.EditDetails, error) {
	var ret models.EditDetails
	var targetType models.TargetTypeEnum
	utils.ResolveEnumString(obj.TargetType, &targetType)

	switch targetType {
	case models.TargetTypeEnumTag:
		tagData, err := obj.GetTagData()
		if err != nil {
			return nil, err
		}
		ret = tagData.Old
	case models.TargetTypeEnumPerformer:
		performerData, err := obj.GetPerformerData()
		if err != nil {
			return nil, err
		}
		ret = performerData.Old
	case models.TargetTypeEnumStudio:
		studioData, err := obj.GetStudioData()
		if err != nil {
			return nil, err
		}
		ret = studioData.Old
	case models.TargetTypeEnumScene:
		sceneData, err := obj.GetSceneData()
		if err != nil {
			return nil, err
		}
		ret = sceneData.Old
	}

	return ret, nil
}

func (r *editResolver) Comments(ctx context.Context, obj *models.Edit) ([]models.EditComment, error) {
	return r.services.Edit().GetComments(ctx, obj.ID)
}

func (r *editResolver) Votes(ctx context.Context, obj *models.Edit) ([]models.EditVote, error) {
	return r.services.Edit().GetVotes(ctx, obj.ID)
}

func (r *editResolver) Status(ctx context.Context, obj *models.Edit) (models.VoteStatusEnum, error) {
	var ret models.VoteStatusEnum
	if !utils.ResolveEnumString(obj.Status, &ret) {
		return "", nil
	}

	return ret, nil
}

func (r *editResolver) Options(ctx context.Context, obj *models.Edit) (*models.PerformerEditOptions, error) {
	if obj.TargetType == models.TargetTypeEnumPerformer.String() {
		data, err := obj.GetPerformerData()
		if err != nil {
			return nil, err
		}

		options := models.PerformerEditOptions{
			SetMergeAliases:  data.SetMergeAliases,
			SetModifyAliases: data.SetModifyAliases,
		}
		return &options, nil
	}
	return nil, nil
}

func (r *editResolver) Destructive(ctx context.Context, obj *models.Edit) (bool, error) {
	return obj.IsDestructive(), nil
}

func (r *editResolver) Updatable(ctx context.Context, obj *models.Edit) (bool, error) {
	user := auth.GetCurrentUser(ctx)

	if user.ID != obj.UserID.UUID {
		return false, nil
	}

	if obj.UpdateCount >= config.GetEditUpdateLimit() {
		return false, nil
	}

	if obj.Operation == models.OperationEnumDestroy.String() {
		return false, nil
	}

	return true, nil
}
