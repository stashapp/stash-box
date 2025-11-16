package converter

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/converter/gen"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/pkg/logger"
)

// Package-level converter instances (stateless, created once)
var (
	modelConverter        = &gen.ModelConverterImpl{}
	inputConverter        = &gen.InputConverterImpl{}
	createParamsConverter = &gen.CreateParamsConverterImpl{}
	updateParamsConverter = &gen.UpdateParamsConverterImpl{}
)

// ImageToModel converts a queries.Image to a models.Image
func ImageToModel(i queries.Image) models.Image {
	return modelConverter.ConvertImage(i)
}

func ImageToModelPtr(i queries.Image) *models.Image {
	image := ImageToModel(i)
	return &image
}

// ImagesToModels converts a slice of queries.Image to a slice of models.Image
func ImagesToModels(images []queries.Image) []models.Image {
	return modelConverter.ConvertImages(images)
}

// PerformerToModel converts a queries.Performer to a models.Performer
func PerformerToModel(p queries.Performer) models.Performer {
	return modelConverter.ConvertPerformer(p)
}

func PerformerToModelPtr(p queries.Performer) *models.Performer {
	performer := PerformerToModel(p)
	return &performer
}

// SceneToModel converts a queries.Scene to a models.Scene
func SceneToModel(s queries.Scene) models.Scene {
	return modelConverter.ConvertScene(s)
}

func SceneToModelPtr(s queries.Scene) *models.Scene {
	scene := SceneToModel(s)
	return &scene
}

// SiteToModel converts a queries.Site to a models.Site
func SiteToModel(s queries.Site) models.Site {
	return modelConverter.ConvertSite(s)
}

func SiteToModelPtr(s queries.Site) *models.Site {
	site := SiteToModel(s)
	return &site
}

// StudioToModel converts a queries.Studio to a models.Studio
func StudioToModel(s queries.Studio) models.Studio {
	return modelConverter.ConvertStudio(s)
}

func StudioToModelPtr(s queries.Studio) *models.Studio {
	studio := StudioToModel(s)
	return &studio
}

// TagCategoryToModel converts a queries.TagCategory to a models.TagCategory
func TagCategoryToModel(tc queries.TagCategory) models.TagCategory {
	return modelConverter.ConvertTagCategory(tc)
}

func TagCategoryToModelPtr(tc queries.TagCategory) *models.TagCategory {
	tagCategory := TagCategoryToModel(tc)
	return &tagCategory
}

// TagToModel converts a queries.Tag to a models.Tag
func TagToModel(t queries.Tag) models.Tag {
	return modelConverter.ConvertTag(t)
}

func TagToModelPtr(t queries.Tag) *models.Tag {
	tag := TagToModel(t)
	return &tag
}

// UserTokenToModel converts a queries.UserToken to a models.UserToken
func UserTokenToModel(ut queries.UserToken) models.UserToken {
	return modelConverter.ConvertUserToken(ut)
}

func UserTokenToModelPtr(ut queries.UserToken) *models.UserToken {
	userToken := UserTokenToModel(ut)
	return &userToken
}

// SceneDraftInputToSceneDraft converts a models.SceneDraftInput to a models.SceneDraft
func SceneDraftInputToSceneDraft(input models.SceneDraftInput) models.SceneDraft {
	return inputConverter.ConvertSceneDraftInput(input)
}

// EditToModel converts a queries.Edit to a models.Edit
func EditToModel(e queries.Edit) models.Edit {
	return modelConverter.ConvertEdit(e)
}

func EditToModelPtr(e queries.Edit) *models.Edit {
	edit := EditToModel(e)
	return &edit
}

// EditsToModels converts []queries.Edit to []models.Edit
func EditsToModels(edits []queries.Edit) []models.Edit {
	return modelConverter.ConvertEdits(edits)
}

// EditVoteToModel converts a queries.EditVote to a models.EditVote
func EditVoteToModel(ec queries.EditVote) models.EditVote {
	return modelConverter.ConvertEditVote(ec)
}

// EditCommentToModel converts a queries.EditComment to a models.EditComment
func EditCommentToModel(ec queries.EditComment) models.EditComment {
	return modelConverter.ConvertEditComment(ec)
}

func EditCommentToModelPtr(ec queries.EditComment) *models.EditComment {
	editComment := EditCommentToModel(ec)
	return &editComment
}

// TagToCreateParams converts a models.Tag to a queries.CreateTagParams
func TagToCreateParams(t models.Tag) queries.CreateTagParams {
	return createParamsConverter.ConvertTagToCreateParams(t)
}

// TagToUpdateParams converts a models.Tag to a queries.UpdateTagParams
func TagToUpdateParams(t models.Tag) queries.UpdateTagParams {
	return updateParamsConverter.ConvertTagToUpdateParams(t)
}

// StudioToCreateParams converts a models.Studio to a queries.CreateStudioParams
func StudioToCreateParams(s models.Studio) queries.CreateStudioParams {
	return createParamsConverter.ConvertStudioToCreateParams(s)
}

// StudioToUpdateParams converts a models.Studio to a queries.UpdateStudioParams
func StudioToUpdateParams(s models.Studio) queries.UpdateStudioParams {
	return updateParamsConverter.ConvertStudioToUpdateParams(s)
}

// SceneToCreateParams converts a models.Scene to a queries.CreateSceneParams
func SceneToCreateParams(s models.Scene) queries.CreateSceneParams {
	return createParamsConverter.ConvertSceneToCreateParams(s)
}

// SceneToUpdateParams converts a models.Scene to a queries.UpdateSceneParams
func SceneToUpdateParams(s models.Scene) queries.UpdateSceneParams {
	return updateParamsConverter.ConvertSceneToUpdateParams(s)
}

// BodyModInputToModel converts []models.BodyModificationInput to []models.BodyModification
func BodyModInputToModel(inputs []models.BodyModificationInput) []models.BodyModification {
	return inputConverter.ConvertBodyModInputSlice(inputs)
}

// PerformerToCreateParams converts a models.Performer to a queries.CreatePerformerParams
func PerformerToCreateParams(p models.Performer) queries.CreatePerformerParams {
	return createParamsConverter.ConvertPerformerToCreateParams(p)
}

// PerformerToUpdateParams converts a models.Performer to a queries.UpdatePerformerParams
func PerformerToUpdateParams(p models.Performer) queries.UpdatePerformerParams {
	return updateParamsConverter.ConvertPerformerToUpdateParams(p)
}

// EditToUpdateParams converts a models.Edit to a queries.UpdateEditParams
func EditToUpdateParams(e models.Edit) queries.UpdateEditParams {
	return updateParamsConverter.ConvertEditToUpdateParams(e)
}

// EditToCreateParams converts a models.Edit to a queries.CreateEditParams
func EditToCreateParams(e models.Edit) queries.CreateEditParams {
	return createParamsConverter.ConvertEditToCreateParams(e)
}

// EditCommentToCreateParams converts a models.EditComment to a queries.CreateEditCommentParams
func EditCommentToCreateParams(ec models.EditComment) queries.CreateEditCommentParams {
	return createParamsConverter.ConvertEditCommentToCreateParams(ec)
}

// UserToModel converts a queries.User to a models.User
func UserToModel(u queries.User) models.User {
	return modelConverter.ConvertUser(u)
}

func UserToModelPtr(u queries.User) *models.User {
	user := UserToModel(u)
	return &user
}

// PerformerCreateInputToPerformer converts a models.PerformerCreateInput to a models.Performer
func PerformerCreateInputToPerformer(input models.PerformerCreateInput) models.Performer {
	return models.Performer{
		Name:            input.Name,
		Disambiguation:  input.Disambiguation,
		Gender:          input.Gender,
		BirthDate:       input.Birthdate,
		DeathDate:       input.Deathdate,
		Ethnicity:       input.Ethnicity,
		Country:         input.Country,
		EyeColor:        input.EyeColor,
		HairColor:       input.HairColor,
		Height:          input.Height,
		CupSize:         input.CupSize,
		BandSize:        input.BandSize,
		WaistSize:       input.WaistSize,
		HipSize:         input.HipSize,
		BreastType:      input.BreastType,
		CareerStartYear: input.CareerStartYear,
		CareerEndYear:   input.CareerEndYear,
	}
}

// UpdatePerformerFromUpdateInput updates an existing models.Performer with data from models.PerformerUpdateInput
func UpdatePerformerFromUpdateInput(performer *models.Performer, input models.PerformerUpdateInput) {
	if input.Name != nil {
		performer.Name = *input.Name
	}
	if input.Disambiguation != nil {
		performer.Disambiguation = input.Disambiguation
	}
	if input.Gender != nil {
		performer.Gender = input.Gender
	}
	if input.Birthdate != nil {
		performer.BirthDate = input.Birthdate
	}
	if input.Deathdate != nil {
		performer.DeathDate = input.Deathdate
	}
	if input.Ethnicity != nil {
		performer.Ethnicity = input.Ethnicity
	}
	if input.Country != nil {
		performer.Country = input.Country
	}
	if input.EyeColor != nil {
		performer.EyeColor = input.EyeColor
	}
	if input.HairColor != nil {
		performer.HairColor = input.HairColor
	}
	if input.Height != nil {
		performer.Height = input.Height
	}
	if input.CupSize != nil {
		performer.CupSize = input.CupSize
	}
	if input.BandSize != nil {
		performer.BandSize = input.BandSize
	}
	if input.WaistSize != nil {
		performer.WaistSize = input.WaistSize
	}
	if input.HipSize != nil {
		performer.HipSize = input.HipSize
	}
	if input.BreastType != nil {
		performer.BreastType = input.BreastType
	}
	if input.CareerStartYear != nil {
		performer.CareerStartYear = input.CareerStartYear
	}
	if input.CareerEndYear != nil {
		performer.CareerEndYear = input.CareerEndYear
	}
}

// SceneCreateInputToScene converts a models.SceneCreateInput to a models.Scene
func SceneCreateInputToScene(input models.SceneCreateInput) models.Scene {
	var studioID uuid.NullUUID
	if input.StudioID != nil {
		studioID = uuid.NullUUID{UUID: *input.StudioID, Valid: true}
	}

	return models.Scene{
		Title:          input.Title,
		Details:        input.Details,
		Date:           &input.Date,
		ProductionDate: input.ProductionDate,
		StudioID:       studioID,
		Duration:       input.Duration,
		Director:       input.Director,
		Code:           input.Code,
	}
}

// UpdateSceneFromUpdateInput updates an existing models.Scene with data from models.SceneUpdateInput
func UpdateSceneFromUpdateInput(scene *models.Scene, input models.SceneUpdateInput) {
	if input.Title != nil {
		scene.Title = input.Title
	}
	if input.Details != nil {
		scene.Details = input.Details
	}
	if input.Date != nil {
		scene.Date = input.Date
	}
	if input.ProductionDate != nil {
		scene.ProductionDate = input.ProductionDate
	}
	if input.StudioID != nil {
		scene.StudioID = uuid.NullUUID{UUID: *input.StudioID, Valid: true}
	}
	if input.Duration != nil {
		scene.Duration = input.Duration
	}
	if input.Director != nil {
		scene.Director = input.Director
	}
	if input.Code != nil {
		scene.Code = input.Code
	}
}

// SiteCreateInputToSite converts a models.SiteCreateInput to a models.Site
func SiteCreateInputToSite(input models.SiteCreateInput) models.Site {
	validTypes := make([]string, len(input.ValidTypes))
	for i, vt := range input.ValidTypes {
		validTypes[i] = string(vt)
	}

	return models.Site{
		Name:        input.Name,
		Description: input.Description,
		URL:         input.URL,
		Regex:       input.Regex,
		ValidTypes:  validTypes,
	}
}

// SiteToCreateParams converts a models.Site to a queries.CreateSiteParams
func SiteToCreateParams(s models.Site) queries.CreateSiteParams {
	return createParamsConverter.ConvertSiteToCreateParams(s)
}

// SiteToUpdateParams converts a models.Site to a queries.UpdateSiteParams
func SiteToUpdateParams(s models.Site) queries.UpdateSiteParams {
	return updateParamsConverter.ConvertSiteToUpdateParams(s)
}

// UpdateSiteFromUpdateInput updates an existing models.Site with data from models.SiteUpdateInput
func UpdateSiteFromUpdateInput(site *models.Site, input models.SiteUpdateInput) {
	site.Name = input.Name
	site.Description = input.Description
	site.URL = input.URL
	site.Regex = input.Regex

	validTypes := make([]string, len(input.ValidTypes))
	for i, vt := range input.ValidTypes {
		validTypes[i] = string(vt)
	}
	site.ValidTypes = validTypes
}

// StudioCreateInputToCreateParams converts a models.StudioCreateInput to a queries.CreateStudioParams
func StudioCreateInputToCreateParams(input models.StudioCreateInput) (queries.CreateStudioParams, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return queries.CreateStudioParams{}, err
	}

	var parentStudioID uuid.NullUUID
	if input.ParentID != nil {
		parentStudioID = uuid.NullUUID{UUID: *input.ParentID, Valid: true}
	}

	return queries.CreateStudioParams{
		ID:             id,
		Name:           input.Name,
		ParentStudioID: parentStudioID,
	}, nil
}

// UpdateStudioFromUpdateInput applies changes from models.StudioUpdateInput to queries.Studio and returns queries.UpdateStudioParams
func UpdateStudioFromUpdateInput(studio queries.Studio, input models.StudioUpdateInput) queries.UpdateStudioParams {
	// Start with existing studio values
	name := studio.Name
	parentStudioID := studio.ParentStudioID

	// Apply updates from input
	if input.Name != nil {
		name = *input.Name
	}
	if input.ParentID != nil {
		parentStudioID = uuid.NullUUID{UUID: *input.ParentID, Valid: true}
	}

	return queries.UpdateStudioParams{
		ID:             studio.ID,
		Name:           name,
		ParentStudioID: parentStudioID,
	}
}

// TagCategoryCreateInputToCreateParams converts a models.TagCategoryCreateInput to a queries.CreateTagCategoryParams
func TagCategoryCreateInputToCreateParams(input models.TagCategoryCreateInput) (queries.CreateTagCategoryParams, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return queries.CreateTagCategoryParams{}, err
	}

	return queries.CreateTagCategoryParams{
		ID:          id,
		Group:       string(input.Group),
		Name:        input.Name,
		Description: input.Description,
	}, nil
}

// UpdateTagCategoryFromUpdateInput applies changes from models.TagCategoryUpdateInput to queries.TagCategory and returns queries.UpdateTagCategoryParams
func UpdateTagCategoryFromUpdateInput(tagCategory queries.TagCategory, input models.TagCategoryUpdateInput) queries.UpdateTagCategoryParams {
	// Start with existing values
	name := tagCategory.Name
	group := tagCategory.Group
	description := tagCategory.Description

	// Apply updates from input
	if input.Name != nil {
		name = *input.Name
	}
	if input.Group != nil {
		group = string(*input.Group)
	}
	if input.Description != nil {
		description = input.Description
	}

	return queries.UpdateTagCategoryParams{
		ID:          tagCategory.ID,
		Group:       group,
		Name:        name,
		Description: description,
	}
}

// TagCreateInputToCreateParams converts a models.TagCreateInput to a queries.CreateTagParams
func TagCreateInputToCreateParams(input models.TagCreateInput) (queries.CreateTagParams, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return queries.CreateTagParams{}, err
	}

	var categoryID uuid.NullUUID
	if input.CategoryID != nil {
		categoryID = uuid.NullUUID{UUID: *input.CategoryID, Valid: true}
	}

	return queries.CreateTagParams{
		ID:          id,
		Name:        input.Name,
		CategoryID:  categoryID,
		Description: input.Description,
	}, nil
}

// UpdateTagFromUpdateInput applies changes from models.TagUpdateInput to queries.Tag and returns queries.UpdateTagParams
func UpdateTagFromUpdateInput(tag queries.Tag, input models.TagUpdateInput) queries.UpdateTagParams {
	// Start with existing values
	name := tag.Name
	categoryID := tag.CategoryID

	// Apply updates from input
	if input.Name != nil {
		name = *input.Name
	}
	if input.CategoryID != nil {
		categoryID = uuid.NullUUID{UUID: *input.CategoryID, Valid: true}
	}

	return queries.UpdateTagParams{
		ID:          tag.ID,
		Name:        name,
		CategoryID:  categoryID,
		Description: input.Description,
	}
}

// UserCreateInputToCreateParams converts a models.UserCreateInput to a queries.CreateUserParams
func UserCreateInputToCreateParams(input models.UserCreateInput, id uuid.UUID, passwordHash, apiKey string) queries.CreateUserParams {
	var invitedBy uuid.NullUUID
	if input.InvitedByID != nil {
		invitedBy = uuid.NullUUID{UUID: *input.InvitedByID, Valid: true}
	}

	return queries.CreateUserParams{
		ID:           id,
		Name:         input.Name,
		PasswordHash: passwordHash,
		Email:        input.Email,
		ApiKey:       apiKey,
		ApiCalls:     new(int),
		InviteTokens: 0,
		InvitedBy:    invitedBy,
	}
}

// UpdateUserFromUpdateInput applies changes from models.UserUpdateInput to queries.User and returns queries.UpdateUserParams
func UpdateUserFromUpdateInput(user queries.User, input models.UserUpdateInput, passwordHash string) queries.UpdateUserParams {
	// Start with existing values
	name := user.Name
	email := user.Email
	userPasswordHash := user.PasswordHash

	// Apply updates from input
	if input.Name != nil {
		name = *input.Name
	}
	if input.Email != nil {
		email = *input.Email
	}
	if input.Password != nil {
		userPasswordHash = passwordHash
	}

	return queries.UpdateUserParams{
		ID:           user.ID,
		Name:         name,
		PasswordHash: userPasswordHash,
		Email:        email,
	}
}

// CreateUserTokenParamsFromData creates a queries.CreateUserTokenParams with token expiring 15 minutes from now
func CreateUserTokenParamsFromData(tokenType string, data any) (queries.CreateUserTokenParams, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return queries.CreateUserTokenParams{}, err
	}

	dataBytes, err := json.Marshal(data)
	if err != nil {
		return queries.CreateUserTokenParams{}, err
	}

	now := time.Now()
	expires := now.Add(15 * time.Minute)

	return queries.CreateUserTokenParams{
		ID:        id,
		Data:      dataBytes,
		Type:      tokenType,
		CreatedAt: now,
		ExpiresAt: expires,
	}, nil
}

// DraftToModel converts a queries.Draft to a models.Draft
func DraftToModel(d queries.Draft) models.Draft {
	return models.Draft{
		ID:        d.ID,
		UserID:    d.UserID,
		Type:      d.Type,
		Data:      json.RawMessage(d.Data),
		CreatedAt: d.CreatedAt,
	}
}

func DraftToModelPtr(d queries.Draft) *models.Draft {
	draft := DraftToModel(d)
	return &draft
}

// CreateEditCommentParams creates a queries.CreateEditCommentParams from editID, userID, and comment text
func CreateEditCommentParams(editID, userID uuid.UUID, commentText string) (queries.CreateEditCommentParams, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return queries.CreateEditCommentParams{}, err
	}

	return queries.CreateEditCommentParams{
		ID:     id,
		EditID: editID,
		UserID: uuid.NullUUID{UUID: userID, Valid: true},
		Text:   commentText,
	}, nil
}

// PerformersToModels converts []queries.Performer to []models.Performer
func PerformersToModels(performers []queries.Performer) []models.Performer {
	return modelConverter.ConvertPerformers(performers)
}

func ScenesToModels(scenes []queries.Scene) []models.Scene {
	return modelConverter.ConvertScenes(scenes)
}

// StudiosToModels converts []queries.Studio to []models.Studio
func StudiosToModels(studios []queries.Studio) []models.Studio {
	return modelConverter.ConvertStudios(studios)
}

// TagCategoriesToModels converts []queries.TagCategory to []models.TagCategory
func TagCategoriesToModels(tagCategories []queries.TagCategory) []models.TagCategory {
	return modelConverter.ConvertTagCategories(tagCategories)
}

// TagsToModels converts []queries.Tag to []models.Tag
func TagsToModels(tags []queries.Tag) []models.Tag {
	return modelConverter.ConvertTags(tags)
}

// EditCommentsToModels converts []queries.EditComment to []models.EditComment
func EditCommentsToModels(comments []queries.EditComment) []models.EditComment {
	return modelConverter.ConvertEditComments(comments)
}

// EditVotesToModels converts []queries.EditVote to []models.EditVote
func EditVotesToModels(votes []queries.EditVote) []models.EditVote {
	return modelConverter.ConvertEditVotes(votes)
}

// InviteKeysToModels converts []queries.InviteKey to []models.InviteKey
func InviteKeysToModels(keys []queries.InviteKey) []models.InviteKey {
	return modelConverter.ConvertInviteKeys(keys)
}

// NotificationsToModels converts []queries.Notification to []models.Notification
func NotificationsToModels(notifications []queries.Notification) []models.Notification {
	return modelConverter.ConvertNotifications(notifications)
}

// InviteKeyToModel converts a queries.InviteKey to a models.InviteKey
func InviteKeyToModel(ik queries.InviteKey) models.InviteKey {
	var expires *time.Time
	if ik.ExpireTime != nil {
		expires = ik.ExpireTime
	}

	return models.InviteKey{
		ID:          ik.ID,
		GeneratedBy: ik.GeneratedBy,
		GeneratedAt: ik.GeneratedAt,
		Uses:        ik.Uses,
		Expires:     expires,
	}
}

// StringToRoleEnum converts a string to a models.RoleEnum, returns nil if invalid
func StringToRoleEnum(s string) *models.RoleEnum {
	role := models.RoleEnum(s)
	if !role.IsValid() {
		logger.Warnf("Invalid role '%s', discarding", s)
		return nil
	}
	return &role
}

// StringsToRoleEnums converts a slice of strings to a slice of models.RoleEnum, discarding invalid ones
func StringsToRoleEnums(strings []string) []models.RoleEnum {
	var result []models.RoleEnum
	for _, s := range strings {
		if role := StringToRoleEnum(s); role != nil {
			result = append(result, *role)
		}
	}
	return result
}

// NotificationToModel converts a database notification to a models.Notification
func NotificationToModel(dbNotification queries.Notification) models.Notification {
	notification := models.Notification{
		UserID:    dbNotification.UserID,
		Type:      models.NotificationEnum(dbNotification.Type),
		TargetID:  dbNotification.ID,
		CreatedAt: dbNotification.CreatedAt,
		ReadAt:    dbNotification.ReadAt,
	}

	return notification
}
