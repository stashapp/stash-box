package api

import (
	"context"
	"errors"
	"sort"
	"time"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type editResolver struct{ *Resolver }

func (r *editResolver) ID(ctx context.Context, obj *models.Edit) (string, error) {
	return obj.ID.String(), nil
}

func (r *editResolver) User(ctx context.Context, obj *models.Edit) (*models.User, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()
	user, err := qb.Find(obj.UserID)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *editResolver) Created(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *editResolver) Updated(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	if !obj.UpdatedAt.Valid {
		return nil, nil
	}
	return &obj.UpdatedAt.Time, nil
}

func (r *editResolver) Closed(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	if !obj.ClosedAt.Valid {
		return nil, nil
	}
	return &obj.ClosedAt.Time, nil
}

func (r *editResolver) Expires(ctx context.Context, obj *models.Edit) (*time.Time, error) {
	if obj.Status != models.VoteStatusEnumPending.String() {
		return nil, nil
	}

	// Count expiration time from creation, or time when edit was amended
	startTime := obj.CreatedAt
	if obj.UpdatedAt.Valid {
		startTime = obj.UpdatedAt.Time
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

	fac := r.getRepoFactory(ctx)
	eqb := fac.Edit()

	var targetType models.TargetTypeEnum
	utils.ResolveEnumString(obj.TargetType, &targetType)

	switch targetType {
	case models.TargetTypeEnumTag:
		tagID, err := eqb.FindTagID(obj.ID)
		if err != nil {
			return nil, err
		}

		tqb := fac.Tag()
		target, err := tqb.Find(*tagID)
		if err != nil {
			return nil, err
		}

		return target, nil
	case models.TargetTypeEnumPerformer:
		performerID, err := eqb.FindPerformerID(obj.ID)
		if err != nil {
			return nil, err
		}

		pqb := fac.Performer()
		target, err := pqb.Find(*performerID)
		if err != nil {
			return nil, err
		}

		return target, nil
	case models.TargetTypeEnumStudio:
		studioID, err := eqb.FindStudioID(obj.ID)
		if err != nil {
			return nil, err
		}

		sqb := fac.Studio()
		target, err := sqb.Find(*studioID)
		if err != nil {
			return nil, err
		}

		return target, nil
	case models.TargetTypeEnumScene:
		sceneID, err := eqb.FindSceneID(obj.ID)
		if err != nil {
			return nil, err
		}

		sqb := fac.Scene()
		target, err := sqb.Find(*sceneID)
		if err != nil {
			return nil, err
		}

		return target, nil
	default:
		return nil, errors.New("not implemented")
	}
}

func (r *editResolver) TargetType(ctx context.Context, obj *models.Edit) (models.TargetTypeEnum, error) {
	var ret models.TargetTypeEnum
	if !utils.ResolveEnumString(obj.TargetType, &ret) {
		return "", nil
	}

	return ret, nil
}

func (r *editResolver) MergeSources(ctx context.Context, obj *models.Edit) ([]models.EditTarget, error) {
	mergeSources := []models.EditTarget{}
	editData := obj.GetData()
	if editData == nil {
		return mergeSources, nil
	}

	if len(editData.MergeSources) > 0 {
		fac := r.getRepoFactory(ctx)
		var ret models.TargetTypeEnum
		utils.ResolveEnumString(obj.TargetType, &ret)

		switch ret {
		case models.TargetTypeEnumTag:
			tqb := fac.Tag()
			for _, tagID := range editData.MergeSources {
				tag, err := tqb.Find(tagID)
				if err == nil {
					mergeSources = append(mergeSources, tag)
				}
			}
		case models.TargetTypeEnumPerformer:
			pqb := fac.Performer()
			for _, performerID := range editData.MergeSources {
				performer, err := pqb.Find(performerID)
				if err == nil {
					mergeSources = append(mergeSources, performer)
				}
			}
		case models.TargetTypeEnumStudio:
			pqb := fac.Studio()
			for _, studioID := range editData.MergeSources {
				studio, err := pqb.Find(studioID)
				if err == nil {
					mergeSources = append(mergeSources, studio)
				}
			}
		case models.TargetTypeEnumScene:
			qb := fac.Scene()
			for _, sceneID := range editData.MergeSources {
				scene, err := qb.Find(sceneID)
				if err == nil {
					mergeSources = append(mergeSources, scene)
				}
			}
		default:
			return nil, errors.New("not implemented")
		}
	}
	return mergeSources, nil
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

func (r *editResolver) Comments(ctx context.Context, obj *models.Edit) ([]*models.EditComment, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()
	comments, err := qb.GetComments(obj.ID)

	if err != nil {
		return nil, err
	}

	sort.Slice(comments, func(i, j int) bool {
		return comments[i].CreatedAt.Before(comments[j].CreatedAt)
	})

	return comments, nil
}

func (r *editResolver) Votes(ctx context.Context, obj *models.Edit) ([]*models.EditVote, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()
	votes, err := qb.GetVotes(obj.ID)

	if err != nil {
		return nil, err
	}

	var ret []*models.EditVote
	for _, vote := range votes {
		ret = append(ret, vote)
	}

	return ret, nil
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
