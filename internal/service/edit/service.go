package edit

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/models/validator"
	"github.com/stashapp/stash-box/internal/service/errutil"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/utils"
)

var ErrUnauthorizedUpdate = fmt.Errorf("only the creator can update edits")
var ErrClosedEdit = fmt.Errorf("votes can only be cast on pending edits")
var ErrUnauthorizedBot = fmt.Errorf("you do not have permission to submit bot edits")
var ErrUpdateLimit = fmt.Errorf("edit update limit reached")
var ErrSceneDraftRequired = fmt.Errorf("scenes have to be submitted through drafts")

// Edit handles edit-related operations
type Edit struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

// NewEdit creates a new edit service
func NewEdit(queries *db.Queries, withTxn db.WithTxnFunc) *Edit {
	return &Edit{
		queries: queries,
		withTxn: withTxn,
	}
}

func (s *Edit) FindByID(ctx context.Context, id uuid.UUID) (*models.Edit, error) {
	edit, err := s.queries.FindEdit(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.EditToModelPtr(edit), nil
}

func (s *Edit) GetComments(ctx context.Context, editID uuid.UUID) ([]models.EditComment, error) {
	comments, err := s.queries.GetEditComments(ctx, editID)
	if err != nil {
		return nil, err
	}
	return converter.EditCommentsToModels(comments), nil
}

func (s *Edit) GetVotes(ctx context.Context, editID uuid.UUID) ([]models.EditVote, error) {
	votes, err := s.queries.GetEditVotes(ctx, editID)
	if err != nil {
		return nil, err
	}
	return converter.EditVotesToModels(votes), nil
}

func (s *Edit) Delete(ctx context.Context, id uuid.UUID) (bool, error) {
	err := s.queries.DeleteEdit(ctx, id)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (s *Edit) GetEditTarget(ctx context.Context, id uuid.UUID) (models.EditTarget, error) {
	res, err := s.queries.GetEditTargetID(ctx, id)
	if err != nil {
		return nil, err
	}

	if res.ID.IsNil() {
		return nil, fmt.Errorf("target id not found")
	}

	switch res.TargetType {
	case models.TargetTypeEnumTag.String():
		tag, err := s.queries.FindTag(ctx, res.ID)
		if err != nil {
			return nil, err
		}
		return converter.TagToModelPtr(tag), nil
	case models.TargetTypeEnumPerformer.String():
		performer, err := s.queries.FindPerformer(ctx, res.ID)
		if err != nil {
			return nil, err
		}
		return converter.PerformerToModelPtr(performer), nil
	case models.TargetTypeEnumStudio.String():
		studio, err := s.queries.FindStudio(ctx, res.ID)
		if err != nil {
			return nil, err
		}
		return converter.StudioToModelPtr(studio), nil
	case models.TargetTypeEnumScene.String():
		scene, err := s.queries.FindScene(ctx, res.ID)
		if err != nil {
			return nil, err
		}
		return converter.SceneToModelPtr(scene), nil
	default:
		return nil, errors.New("not implemented")
	}
}

func (s *Edit) GetMergeSources(ctx context.Context, mergeIDs []uuid.UUID, targetType string) ([]models.EditTarget, error) {
	mergeSources := []models.EditTarget{}
	switch targetType {
	case models.TargetTypeEnumTag.String():
		tags, err := s.queries.FindTagsByIds(ctx, mergeIDs)
		if err != nil {
			return nil, err
		}
		for _, tag := range tags {
			mergeSources = append(mergeSources, converter.TagToModelPtr(tag))
		}
	case models.TargetTypeEnumPerformer.String():
		performers, err := s.queries.FindPerformersByIds(ctx, mergeIDs)
		if err != nil {
			return nil, err
		}
		for _, performer := range performers {
			mergeSources = append(mergeSources, converter.PerformerToModelPtr(performer))
		}
	case models.TargetTypeEnumStudio.String():
		studios, err := s.queries.GetStudios(ctx, mergeIDs)
		if err != nil {
			return nil, err
		}
		for _, studio := range studios {
			mergeSources = append(mergeSources, converter.StudioToModelPtr(studio))
		}
	case models.TargetTypeEnumScene.String():
		scenes, err := s.queries.GetScenes(ctx, mergeIDs)
		if err != nil {
			return nil, err
		}
		for _, scene := range scenes {
			mergeSources = append(mergeSources, converter.SceneToModelPtr(scene))
		}
	default:
		return nil, errors.New("not implemented")
	}

	return mergeSources, nil
}

func (s *Edit) GetMergedURLs(ctx context.Context, id uuid.UUID) ([]models.URL, error) {
	res, err := s.queries.GetMergedURLsForEdit(ctx, id)
	if err != nil {
		return nil, err
	}

	var urls []models.URL
	for _, url := range res {
		u := models.URL{URL: url.Url, SiteID: url.SiteID}
		urls = append(urls, u)
	}
	return urls, nil
}

func (s *Edit) GetMergedImages(ctx context.Context, id uuid.UUID) ([]models.Image, error) {
	res, err := s.queries.GetImagesForEdit(ctx, id)
	if err != nil {
		return nil, err
	}

	return converter.ImagesToModels(res), nil
}

func (s *Edit) GetMergedPerformerAliases(ctx context.Context, id uuid.UUID) ([]string, error) {
	return s.queries.GetEditPerformerAliases(ctx, id)
}

func (s *Edit) GetMergedStudioAliases(ctx context.Context, id uuid.UUID) ([]string, error) {
	return s.queries.GetMergedStudioAliasesForEdit(ctx, id)
}

func (s *Edit) GetMergedPerformerTattoos(ctx context.Context, id uuid.UUID) ([]models.BodyModification, error) {
	res, err := s.queries.GetEditPerformerTattoos(ctx, id)
	if err != nil {
		return nil, err
	}

	var mods []models.BodyModification
	for _, mod := range res {
		location := ""
		if mod.Location != nil {
			location = *mod.Location
		}
		bodyMod := models.BodyModification{
			Location:    location,
			Description: mod.Description,
		}
		mods = append(mods, bodyMod)
	}
	return mods, err
}

func (s *Edit) GetMergedPerformerPiercings(ctx context.Context, id uuid.UUID) ([]models.BodyModification, error) {
	res, err := s.queries.GetEditPerformerPiercings(ctx, id)
	if err != nil {
		return nil, err
	}

	var mods []models.BodyModification
	for _, mod := range res {
		location := ""
		if mod.Location != nil {
			location = *mod.Location
		}
		bodyMod := models.BodyModification{
			Location:    location,
			Description: mod.Description,
		}
		mods = append(mods, bodyMod)
	}
	return mods, err
}

func (s *Edit) GetMergedTags(ctx context.Context, id uuid.UUID) ([]models.Tag, error) {
	tags, err := s.queries.GetMergedTagsForEdit(ctx, id)
	if err != nil {
		return nil, err
	}
	return converter.TagsToModels(tags), nil
}

func (s *Edit) GetMergedPerformers(ctx context.Context, id uuid.UUID) ([]models.PerformerAppearance, error) {
	performers, err := s.queries.GetMergedPerformersForEdit(ctx, id)
	if err != nil {
		return nil, err
	}

	var result []models.PerformerAppearance
	for _, performer := range performers {
		convertedPerformer := converter.PerformerToModelPtr(performer.Performer)

		result = append(result, models.PerformerAppearance{
			Performer: convertedPerformer,
			As:        performer.As,
		})
	}
	return result, nil
}

func (s *Edit) FindByPerformerID(ctx context.Context, performerID uuid.UUID) ([]models.Edit, error) {
	edits, err := s.queries.GetEditsByPerformer(ctx, performerID)
	if err != nil {
		return nil, err
	}

	var modelEdits []models.Edit
	for _, edit := range edits {
		modelEdits = append(modelEdits, converter.EditToModel(edit))
	}

	return modelEdits, nil
}

func (s *Edit) FindByStudioID(ctx context.Context, studioID uuid.UUID) ([]models.Edit, error) {
	edits, err := s.queries.GetEditsByStudio(ctx, studioID)
	if err != nil {
		return nil, err
	}

	var modelEdits []models.Edit
	for _, edit := range edits {
		modelEdits = append(modelEdits, converter.EditToModel(edit))
	}

	return modelEdits, nil
}

func (s *Edit) FindByTagID(ctx context.Context, tagID uuid.UUID) ([]models.Edit, error) {
	edits, err := s.queries.GetEditsByTag(ctx, tagID)
	if err != nil {
		return nil, err
	}

	var modelEdits []models.Edit
	for _, edit := range edits {
		modelEdits = append(modelEdits, converter.EditToModel(edit))
	}

	return modelEdits, nil
}

func (s *Edit) FindBySceneID(ctx context.Context, sceneID uuid.UUID) ([]models.Edit, error) {
	edits, err := s.queries.GetEditsByScene(ctx, sceneID)
	if err != nil {
		return nil, err
	}

	var modelEdits []models.Edit
	for _, edit := range edits {
		modelEdits = append(modelEdits, converter.EditToModel(edit))
	}

	return modelEdits, nil
}

func (s *Edit) CreateSceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	currentUser := auth.GetCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumScene, input.Edit)

	// For scene create, check if draft exist if draft is required
	if config.GetRequireSceneDraft() && input.Edit.Operation == models.OperationEnumCreate {
		if input.Details != nil && input.Details.DraftID != nil {
			_, err := s.queries.FindDraft(ctx, *input.Details.DraftID)
			if err != nil {
				return nil, ErrSceneDraftRequired
			}
		} else {
			return nil, ErrSceneDraftRequired
		}
	}

	err = s.withTxn(func(tx *db.Queries) error {
		p := Scene(ctx, tx, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, false); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		if input.Details != nil && input.Details.DraftID != nil {
			if err := tx.DeleteDraft(ctx, *input.Details.DraftID); err != nil {
				return err
			}
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return newEdit, err
}

func (s *Edit) UpdateSceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	currentUser := auth.GetCurrentUser(ctx)

	dbEdit, err := s.queries.FindEdit(ctx, *input.Edit.ID)
	if err != nil {
		return nil, err
	}

	existingEdit := converter.EditToModelPtr(dbEdit)
	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = s.withTxn(func(tx *db.Queries) error {
		p := Scene(ctx, tx, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, true); err != nil {
			return err
		}

		if err := p.UpdateEdit(); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return existingEdit, err
}

func (s *Edit) CreateStudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := auth.GetCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumStudio, input.Edit)

	err = s.withTxn(func(tx *db.Queries) error {
		p := Studio(ctx, tx, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return newEdit, err
}

func (s *Edit) UpdateStudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	currentUser := auth.GetCurrentUser(ctx)

	dbEdit, err := s.queries.FindEdit(ctx, *input.Edit.ID)
	if err != nil {
		return nil, err
	}

	existingEdit := converter.EditToModelPtr(dbEdit)
	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = s.withTxn(func(tx *db.Queries) error {
		p := Studio(ctx, tx, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		if err := p.UpdateEdit(); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return existingEdit, err
}

func (s *Edit) CreateTagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	if config.GetRequireTagRole() {
		if err := auth.ValidateRole(ctx, models.RoleEnumEditTags); err != nil {
			return nil, err
		}
	}

	UUID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := auth.GetCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumTag, input.Edit)

	err = s.withTxn(func(tx *db.Queries) error {
		p := Tag(ctx, tx, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return newEdit, err
}

func (s *Edit) UpdateTagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	currentUser := auth.GetCurrentUser(ctx)

	dbEdit, err := s.queries.FindEdit(ctx, *input.Edit.ID)
	if err != nil {
		return nil, err
	}

	existingEdit := converter.EditToModelPtr(dbEdit)
	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = s.withTxn(func(tx *db.Queries) error {
		p := Tag(ctx, tx, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		if err := p.UpdateEdit(); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return existingEdit, err
}

func (s *Edit) CreatePerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := auth.GetCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumPerformer, input.Edit)

	err = s.withTxn(func(tx *db.Queries) error {
		p := Performer(ctx, tx, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, false); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		if input.Details != nil && input.Details.DraftID != nil {
			if err := tx.DeleteDraft(ctx, *input.Details.DraftID); err != nil {
				return err
			}
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return newEdit, err
}

func (s *Edit) UpdatePerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	currentUser := auth.GetCurrentUser(ctx)

	dbEdit, err := s.queries.FindEdit(ctx, *input.Edit.ID)
	if err != nil {
		return nil, err
	}

	existingEdit := converter.EditToModelPtr(dbEdit)
	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = s.withTxn(func(tx *db.Queries) error {
		p := Performer(ctx, tx, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, true); err != nil {
			return err
		}

		if err := p.UpdateEdit(); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	return existingEdit, err
}

func (s *Edit) CreateVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	currentUser := auth.GetCurrentUser(ctx)
	var voteEdit *models.Edit
	if err := s.withTxn(func(tx *db.Queries) error {
		var err error
		dbEdit, err := tx.FindEdit(ctx, input.ID)
		if err != nil {
			return err
		}
		voteEdit = converter.EditToModelPtr(dbEdit)

		if voteEdit.Status != models.VoteStatusEnumPending.String() {
			return ErrClosedEdit
		}

		if err := auth.ValidateOwner(ctx, voteEdit.UserID.UUID); err == nil {
			return auth.ErrUnauthorized
		}

		return tx.CreateEditVote(ctx, db.CreateEditVoteParams{
			UserID: currentUser.ID,
			EditID: voteEdit.ID,
			Vote:   input.Vote.String(),
		})
	}); err != nil {
		return nil, err
	}

	result, err := s.ResolveVotingThreshold(ctx, voteEdit)
	// nolint: exhaustive
	switch result {
	case models.VoteStatusEnumAccepted:
		updatedEdit, applyErr := s.ApplyEdit(ctx, input.ID, false)
		if applyErr != nil {
			return nil, applyErr
		}
		return updatedEdit, nil
	case models.VoteStatusEnumRejected:
		updatedEdit, closeErr := s.CloseEdit(ctx, input.ID, models.VoteStatusEnumRejected)
		if closeErr != nil {
			return nil, closeErr
		}
		return updatedEdit, nil
	}

	return voteEdit, err
}

func (s *Edit) CreateComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, *models.EditComment, error) {
	edit, err := s.queries.FindEdit(ctx, input.ID)
	if err != nil {
		return nil, nil, err
	}

	var comment *models.EditComment
	err = s.withTxn(func(tx *db.Queries) error {
		currentUser := auth.GetCurrentUser(ctx)
		params, err := converter.CreateEditCommentParams(edit.ID, currentUser.ID, input.Comment)
		if err != nil {
			return err
		}
		dbComment, err := tx.CreateEditComment(ctx, params)
		if err != nil {
			return err
		}
		comment = converter.EditCommentToModelPtr(dbComment)
		return nil
	})

	return converter.EditToModelPtr(edit), comment, err
}

func (s *Edit) Cancel(ctx context.Context, input models.CancelEditInput) (*models.Edit, error) {
	e, err := s.queries.FindEdit(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	if err = auth.ValidateOwner(ctx, e.UserID.UUID); err == nil {
		return s.CloseEdit(ctx, input.ID, models.VoteStatusEnumCanceled)
	} else if err = auth.ValidateAdmin(ctx); err == nil {
		currentUser := auth.GetCurrentUser(ctx)

		if err := s.queries.CreateEditVote(ctx, db.CreateEditVoteParams{
			UserID: currentUser.ID,
			EditID: e.ID,
			Vote:   models.VoteTypeEnumImmediateReject.String(),
		}); err != nil {
			return nil, err
		}

		return s.CloseEdit(ctx, input.ID, models.VoteStatusEnumImmediateRejected)
	}

	return nil, err
}

func (s *Edit) Apply(ctx context.Context, input models.ApplyEditInput) (*models.Edit, error) {
	edit, err := s.queries.FindEdit(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	currentUser := auth.GetCurrentUser(ctx)

	if err := s.queries.CreateEditVote(ctx, db.CreateEditVoteParams{
		UserID: currentUser.ID,
		EditID: edit.ID,
		Vote:   models.VoteTypeEnumImmediateAccept.String(),
	}); err != nil {
		return nil, err
	}

	return s.ApplyEdit(ctx, input.ID, true)
}

func validateBotEdit(ctx context.Context, input *models.EditInput) error {
	if input.Bot != nil && *input.Bot {
		if err := auth.ValidateBot(ctx); err != nil {
			return ErrUnauthorizedBot
		}
	}

	return nil
}

func validateEditUpdate(edit models.Edit, user *models.User) error {
	if edit.UserID.UUID != user.ID {
		return ErrUnauthorizedUpdate
	}

	if edit.UpdateCount >= config.GetEditUpdateLimit() {
		return ErrUpdateLimit
	}

	return nil
}

func (s *Edit) ApplyEdit(ctx context.Context, editID uuid.UUID, immediate bool) (*models.Edit, error) {
	var updatedEdit *models.Edit
	dbEdit, err := s.queries.FindEdit(ctx, editID)
	if err != nil {
		return nil, err
	}

	edit := converter.EditToModelPtr(dbEdit)
	if err := validateEditPresence(edit); err != nil {
		return nil, err
	}
	if err := validateEditPrerequisites(edit); err != nil {
		edit.Fail()
		return nil, err
	}

	var operation models.OperationEnum
	utils.ResolveEnumString(edit.Operation, &operation)
	var targetType models.TargetTypeEnum
	utils.ResolveEnumString(edit.TargetType, &targetType)

	err = s.withTxn(func(tx *db.Queries) error {
		var applyer editApplyer
		switch targetType {
		case models.TargetTypeEnumTag:
			applyer = Tag(ctx, tx, edit)
		case models.TargetTypeEnumPerformer:
			applyer = Performer(ctx, tx, edit)
		case models.TargetTypeEnumStudio:
			applyer = Studio(ctx, tx, edit)
		case models.TargetTypeEnumScene:
			applyer = Scene(ctx, tx, edit)
		}

		return applyer.apply()
	})

	success := true
	if err != nil {
		// Failed apply, so we create a comment with error details
		success = false
		commentID, _ := uuid.NewV7()
		text := "###### Edit application failed: ######\n"
		if prereqErr := (*validator.ErrEditPrerequisiteFailed)(nil); errors.As(err, &prereqErr) {
			text = fmt.Sprintf("%sPrerequisite failed: %v", text, err)
		} else {
			text = fmt.Sprintf("%sUnknown Error: %v", text, err)
		}
		modBotID := getModBot(ctx, s.queries)

		comment := models.NewEditComment(commentID, modBotID, edit, text)
		_, err = s.queries.CreateEditComment(ctx, converter.EditCommentToCreateParams(*comment))
		if err != nil {
			return nil, err
		}
	}

	switch {
	case !success:
		edit.Fail()
	case immediate:
		edit.ImmediateAccept()
	default:
		edit.Accept()
	}
	dbEdit, err = s.queries.UpdateEdit(ctx, converter.EditToUpdateParams(*edit))
	if err != nil {
		return nil, err
	}
	updatedEdit = converter.EditToModelPtr(dbEdit)

	// TODO: Maybe use cron instead
	if success {
		userPromotionThreshold := config.GetVotePromotionThreshold()
		if userPromotionThreshold != nil && updatedEdit.UserID.Valid {
			go func() {
				if err := s.PromoteUserVoteRights(ctx, updatedEdit.UserID.UUID, *userPromotionThreshold); err != nil {
					logger.Errorf("Failed to promote user vote rights: %v", err)
				}
			}()
		}
	}

	return updatedEdit, err
}

func (s *Edit) CloseEdit(ctx context.Context, editID uuid.UUID, status models.VoteStatusEnum) (*models.Edit, error) {
	var updatedEdit *models.Edit
	err := s.withTxn(func(tx *db.Queries) error {
		dbEdit, err := tx.FindEdit(ctx, editID)
		if err != nil {
			return err
		}

		edit := converter.EditToModelPtr(dbEdit)
		if err := validateEditPresence(edit); err != nil {
			return err
		}
		if err := validateEditPrerequisites(edit); err != nil {
			edit.Fail()
			return err
		}

		switch status {
		case models.VoteStatusEnumImmediateRejected:
			edit.ImmediateReject()
		case models.VoteStatusEnumRejected:
			edit.Reject()
		case models.VoteStatusEnumCanceled:
			edit.Cancel()
		default:
			return fmt.Errorf("tried to close with invalid status: %s", status)
		}

		dbEdit, err = tx.UpdateEdit(ctx, converter.EditToUpdateParams(*edit))
		updatedEdit = converter.EditToModelPtr(dbEdit)

		return err
	})

	return updatedEdit, err
}

func (s *Edit) ResolveVotingThreshold(ctx context.Context, edit *models.Edit) (models.VoteStatusEnum, error) {
	threshold := config.GetVoteApplicationThreshold()
	if threshold == 0 {
		return models.VoteStatusEnumPending, nil
	}

	// For destructive edits we check if they've been open for a minimum period before applying
	if edit.IsDestructive() {
		if time.Since(edit.CreatedAt).Seconds() <= float64(config.GetMinDestructiveVotingPeriod()) {
			return models.VoteStatusEnumPending, nil
		}
	}

	votes, err := s.queries.GetEditVotes(ctx, edit.ID)
	if err != nil {
		return models.VoteStatusEnumPending, err
	}

	positive := 0
	negative := 0
	for _, vote := range votes {
		if vote.Vote == models.VoteTypeEnumAccept.String() {
			positive++
		} else if vote.Vote == models.VoteTypeEnumReject.String() {
			negative++
		}
	}

	if positive >= threshold && negative == 0 {
		return models.VoteStatusEnumAccepted, nil
	} else if negative >= threshold && positive == 0 {
		return models.VoteStatusEnumRejected, nil
	}

	return models.VoteStatusEnumPending, nil
}

func (s *Edit) FindPendingPerformerCreation(ctx context.Context, input models.QueryExistingPerformerInput) ([]models.Edit, error) {
	dbEdits, err := s.queries.FindPendingPerformerCreation(ctx, db.FindPendingPerformerCreationParams{
		Name: input.Name,
		Urls: input.Urls,
	})

	var edits []models.Edit
	for _, edit := range dbEdits {
		edits = append(edits, converter.EditToModel(edit))
	}

	return edits, err
}

func (s *Edit) FindPendingSceneCreation(ctx context.Context, input models.QueryExistingSceneInput) ([]models.Edit, error) {
	var studioID uuid.NullUUID
	var hashes []string

	if input.StudioID != nil {
		studioID = uuid.NullUUID{UUID: *input.StudioID, Valid: true}
	}
	for _, fp := range input.Fingerprints {
		hashes = append(hashes, fp.Hash)
	}

	rows, err := s.queries.FindPendingSceneCreation(ctx, db.FindPendingSceneCreationParams{
		Title:    input.Title,
		StudioID: studioID,
		Hashes:   hashes,
	})
	return converter.EditsToModels(rows), err
}

func (s *Edit) CloseCompleted(ctx context.Context) error {
	edits, err := s.queries.FindCompletedEdits(ctx, db.FindCompletedEditsParams{
		VotingPeriod:        config.GetVotingPeriod(),
		MinimumVotes:        config.GetVoteApplicationThreshold(),
		MinimumVotingPeriod: config.GetMinDestructiveVotingPeriod(),
	})
	if err != nil {
		return err
	}

	logger.Debugf("Closing %d completed edits", len(edits))
	for _, edit := range edits {
		e := converter.EditToModel(edit)
		voteThreshold := 0
		if e.IsDestructive() {
			// Require at least +1 votes to pass destructive edits
			voteThreshold = 1
		}

		var err error
		if e.VoteCount >= voteThreshold {
			_, err = s.ApplyEdit(ctx, e.ID, false)
		} else {
			_, err = s.CloseEdit(ctx, e.ID, models.VoteStatusEnumRejected)
		}

		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Edit) PromoteUserVoteRights(ctx context.Context, userID uuid.UUID, threshold int) error {
	user, err := s.queries.FindUser(ctx, userID)
	if err != nil {
		return err
	}

	dbRoles, err := s.queries.GetUserRoles(ctx, userID)
	if err != nil {
		return err
	}
	roles := converter.StringsToRoleEnums(dbRoles)

	for _, role := range roles {
		if role == models.RoleEnumReadOnly {
			return nil
		}
	}

	hasVote := false
	for _, role := range roles {
		if role.Implies(models.RoleEnumVote) {
			hasVote = true
		}
	}

	if !hasVote {
		editCount, err := s.queries.CountUserEditsByStatus(ctx, uuid.NullUUID{UUID: user.ID, Valid: true})
		if err != nil {
			return nil
		}

		accepted := 0
		for _, row := range editCount {
			if row.Status == models.VoteStatusEnumAccepted.String() || row.Status == models.VoteStatusEnumImmediateAccepted.String() {
				accepted += int(row.Count)
			}
		}

		if accepted >= threshold {
			_, err := s.queries.CreateUserRoles(ctx, []db.CreateUserRolesParams{
				{
					UserID: user.ID,
					Role:   models.RoleEnumVote.String(),
				},
			})
			return err
		}
	}

	return nil
}

// Dataloader methods

func (s *Edit) LoadIds(ctx context.Context, ids []uuid.UUID) ([]*models.Edit, []error) {
	edits, err := s.queries.GetEditsByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]*models.Edit, len(ids))
	editMap := make(map[uuid.UUID]*models.Edit)

	for _, edit := range edits {
		editMap[edit.ID] = converter.EditToModelPtr(edit)
	}

	for i, id := range ids {
		result[i] = editMap[id]
	}

	return result, make([]error, len(ids))
}

func (s *Edit) LoadCommentsByIds(ctx context.Context, ids []uuid.UUID) ([]*models.EditComment, []error) {
	comments, err := s.queries.GetEditCommentsByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]*models.EditComment, len(ids))
	commentMap := make(map[uuid.UUID]*models.EditComment)

	for _, comment := range comments {
		commentMap[comment.ID] = converter.EditCommentToModelPtr(comment)
	}

	for i, id := range ids {
		result[i] = commentMap[id]
	}

	return result, make([]error, len(ids))
}
