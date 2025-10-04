package converter

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/converter/goverter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/models"
)

// ImageToModel converts a db.Image to a models.Image
func ImageToModel(i db.Image) models.Image {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertImage(i)
}

func ImageToModelPtr(i db.Image) *models.Image {
	image := ImageToModel(i)
	return &image
}

// ImagesToModels converts a slice of db.Image to a slice of models.Image
func ImagesToModels(images []db.Image) []models.Image {
	var result []models.Image
	for _, img := range images {
		result = append(result, ImageToModel(img))
	}
	return result
}

// PerformerToModel converts a db.Performer to a models.Performer
func PerformerToModel(p db.Performer) models.Performer {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertPerformer(p)
}

func PerformerToModelPtr(p db.Performer) *models.Performer {
	performer := PerformerToModel(p)
	return &performer
}

// SceneToModel converts a db.Scene to a models.Scene
func SceneToModel(s db.Scene) models.Scene {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertScene(s)
}

func SceneToModelPtr(s db.Scene) *models.Scene {
	scene := SceneToModel(s)
	return &scene
}

// SiteToModel converts a db.Site to a models.Site
func SiteToModel(s db.Site) models.Site {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertSite(s)
}

func SiteToModelPtr(s db.Site) *models.Site {
	site := SiteToModel(s)
	return &site
}

// StudioToModel converts a db.Studio to a models.Studio
func StudioToModel(s db.Studio) models.Studio {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertStudio(s)
}

func StudioToModelPtr(s db.Studio) *models.Studio {
	studio := StudioToModel(s)
	return &studio
}

// TagCategoryToModel converts a db.TagCategory to a models.TagCategory
func TagCategoryToModel(tc db.TagCategory) models.TagCategory {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertTagCategory(tc)
}

func TagCategoryToModelPtr(tc db.TagCategory) *models.TagCategory {
	tagCategory := TagCategoryToModel(tc)
	return &tagCategory
}

// TagToModel converts a db.Tag to a models.Tag
func TagToModel(t db.Tag) models.Tag {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertTag(t)
}

func TagToModelPtr(t db.Tag) *models.Tag {
	tag := TagToModel(t)
	return &tag
}

// UserTokenToModel converts a db.UserToken to a models.UserToken
func UserTokenToModel(ut db.UserToken) models.UserToken {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertUserToken(ut)
}

func UserTokenToModelPtr(ut db.UserToken) *models.UserToken {
	userToken := UserTokenToModel(ut)
	return &userToken
}

// SceneDraftInputToSceneDraft converts a models.SceneDraftInput to a models.SceneDraft
func SceneDraftInputToSceneDraft(input models.SceneDraftInput) models.SceneDraft {
	var inputConverter = goverter.InputConverterImpl{}
	return inputConverter.ConvertSceneDraftInput(input)
}

// EditToModel converts a db.Edit to a models.Edit
func EditToModel(e db.Edit) models.Edit {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertEdit(e)
}

func EditToModelPtr(e db.Edit) *models.Edit {
	edit := EditToModel(e)
	return &edit
}

// EditsToModels converts []db.Edit to []models.Edit
func EditsToModels(edits []db.Edit) []models.Edit {
	result := make([]models.Edit, len(edits))
	for i, edit := range edits {
		result[i] = EditToModel(edit)
	}
	return result
}

// EditVoteToModel converts a db.EditVote to a models.EditVote
func EditVoteToModel(ec db.EditVote) models.EditVote {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertEditVote(ec)
}

// EditCommentToModel converts a db.EditComment to a models.EditComment
func EditCommentToModel(ec db.EditComment) models.EditComment {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertEditComment(ec)
}

func EditCommentToModelPtr(ec db.EditComment) *models.EditComment {
	editComment := EditCommentToModel(ec)
	return &editComment
}

// TagToCreateParams converts a models.Tag to a db.CreateTagParams
func TagToCreateParams(t models.Tag) db.CreateTagParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertTagToCreateParams(t)
}

// TagToUpdateParams converts a models.Tag to a db.UpdateTagParams
func TagToUpdateParams(t models.Tag) db.UpdateTagParams {
	var updateParamsConverter = goverter.UpdateParamsConverterImpl{}
	return updateParamsConverter.ConvertTagToUpdateParams(t)
}

// URLInputToURL converts a models.URLInput to a models.URL
func URLInputToURL(input models.URLInput) models.URL {
	var inputConverter = goverter.InputConverterImpl{}
	return inputConverter.ConvertURLInputToURL(input)
}

// StudioToCreateParams converts a models.Studio to a db.CreateStudioParams
func StudioToCreateParams(s models.Studio) db.CreateStudioParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertStudioToCreateParams(s)
}

// StudioToUpdateParams converts a models.Studio to a db.UpdateStudioParams
func StudioToUpdateParams(s models.Studio) db.UpdateStudioParams {
	var updateParamsConverter = goverter.UpdateParamsConverterImpl{}
	return updateParamsConverter.ConvertStudioToUpdateParams(s)
}

// SceneToCreateParams converts a models.Scene to a db.CreateSceneParams
func SceneToCreateParams(s models.Scene) db.CreateSceneParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertSceneToCreateParams(s)
}

// SceneToUpdateParams converts a models.Scene to a db.UpdateSceneParams
func SceneToUpdateParams(s models.Scene) db.UpdateSceneParams {
	var updateParamsConverter = goverter.UpdateParamsConverterImpl{}
	return updateParamsConverter.ConvertSceneToUpdateParams(s)
}

// BodyModInputToModel converts []models.BodyModificationInput to []models.BodyModification
func BodyModInputToModel(inputs []models.BodyModificationInput) []models.BodyModification {
	var inputConverter = goverter.InputConverterImpl{}
	return inputConverter.ConvertBodyModInputSlice(inputs)
}

// PerformerToCreateParams converts a models.Performer to a db.CreatePerformerParams
func PerformerToCreateParams(p models.Performer) db.CreatePerformerParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertPerformerToCreateParams(p)
}

// PerformerToUpdateParams converts a models.Performer to a db.UpdatePerformerParams
func PerformerToUpdateParams(p models.Performer) db.UpdatePerformerParams {
	var updateParamsConverter = goverter.UpdateParamsConverterImpl{}
	return updateParamsConverter.ConvertPerformerToUpdateParams(p)
}

// EditToUpdateParams converts a models.Edit to a db.UpdateEditParams
func EditToUpdateParams(e models.Edit) db.UpdateEditParams {
	var updateParamsConverter = goverter.UpdateParamsConverterImpl{}
	return updateParamsConverter.ConvertEditToUpdateParams(e)
}

// EditToCreateParams converts a models.Edit to a db.CreateEditParams
func EditToCreateParams(e models.Edit) db.CreateEditParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertEditToCreateParams(e)
}

// EditCommentToCreateParams converts a models.EditComment to a db.CreateEditCommentParams
func EditCommentToCreateParams(ec models.EditComment) db.CreateEditCommentParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertEditCommentToCreateParams(ec)
}

// UserToModel converts a db.User to a models.User
func UserToModel(u db.User) models.User {
	var modelConverter = goverter.ModelConverterImpl{}
	return modelConverter.ConvertUser(u)
}

func UserToModelPtr(u db.User) *models.User {
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

// SiteToCreateParams converts a models.Site to a db.CreateSiteParams
func SiteToCreateParams(s models.Site) db.CreateSiteParams {
	var createParamsConverter = goverter.CreateParamsConverterImpl{}
	return createParamsConverter.ConvertSiteToCreateParams(s)
}

// SiteToUpdateParams converts a models.Site to a db.UpdateSiteParams
func SiteToUpdateParams(s models.Site) db.UpdateSiteParams {
	var updateParamsConverter = goverter.UpdateParamsConverterImpl{}
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

// StudioCreateInputToCreateParams converts a models.StudioCreateInput to a db.CreateStudioParams
func StudioCreateInputToCreateParams(input models.StudioCreateInput) (db.CreateStudioParams, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return db.CreateStudioParams{}, err
	}

	var parentStudioID uuid.NullUUID
	if input.ParentID != nil {
		parentStudioID = uuid.NullUUID{UUID: *input.ParentID, Valid: true}
	}

	return db.CreateStudioParams{
		ID:             id,
		Name:           input.Name,
		ParentStudioID: parentStudioID,
	}, nil
}

// UpdateStudioFromUpdateInput applies changes from models.StudioUpdateInput to db.Studio and returns db.UpdateStudioParams
func UpdateStudioFromUpdateInput(studio db.Studio, input models.StudioUpdateInput) db.UpdateStudioParams {
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

	return db.UpdateStudioParams{
		ID:             studio.ID,
		Name:           name,
		ParentStudioID: parentStudioID,
	}
}

// TagCategoryCreateInputToCreateParams converts a models.TagCategoryCreateInput to a db.CreateTagCategoryParams
func TagCategoryCreateInputToCreateParams(input models.TagCategoryCreateInput) (db.CreateTagCategoryParams, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return db.CreateTagCategoryParams{}, err
	}

	return db.CreateTagCategoryParams{
		ID:          id,
		Group:       string(input.Group),
		Name:        input.Name,
		Description: input.Description,
	}, nil
}

// UpdateTagCategoryFromUpdateInput applies changes from models.TagCategoryUpdateInput to db.TagCategory and returns db.UpdateTagCategoryParams
func UpdateTagCategoryFromUpdateInput(tagCategory db.TagCategory, input models.TagCategoryUpdateInput) db.UpdateTagCategoryParams {
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

	return db.UpdateTagCategoryParams{
		ID:          tagCategory.ID,
		Group:       group,
		Name:        name,
		Description: description,
	}
}

// TagCreateInputToCreateParams converts a models.TagCreateInput to a db.CreateTagParams
func TagCreateInputToCreateParams(input models.TagCreateInput) (db.CreateTagParams, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return db.CreateTagParams{}, err
	}

	var categoryID uuid.NullUUID
	if input.CategoryID != nil {
		categoryID = uuid.NullUUID{UUID: *input.CategoryID, Valid: true}
	}

	return db.CreateTagParams{
		ID:          id,
		Name:        input.Name,
		CategoryID:  categoryID,
		Description: input.Description,
	}, nil
}

// UpdateTagFromUpdateInput applies changes from models.TagUpdateInput to db.Tag and returns db.UpdateTagParams
func UpdateTagFromUpdateInput(tag db.Tag, input models.TagUpdateInput) db.UpdateTagParams {
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

	return db.UpdateTagParams{
		ID:          tag.ID,
		Name:        name,
		CategoryID:  categoryID,
		Description: input.Description,
	}
}

// UserCreateInputToCreateParams converts a models.UserCreateInput to a db.CreateUserParams
func UserCreateInputToCreateParams(input models.UserCreateInput, id uuid.UUID, passwordHash, apiKey string) db.CreateUserParams {
	var invitedBy uuid.NullUUID
	if input.InvitedByID != nil {
		invitedBy = uuid.NullUUID{UUID: *input.InvitedByID, Valid: true}
	}

	return db.CreateUserParams{
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

// UpdateUserFromUpdateInput applies changes from models.UserUpdateInput to db.User and returns db.UpdateUserParams
func UpdateUserFromUpdateInput(user db.User, input models.UserUpdateInput, passwordHash string) db.UpdateUserParams {
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

	return db.UpdateUserParams{
		ID:           user.ID,
		Name:         name,
		PasswordHash: userPasswordHash,
		Email:        email,
	}
}

// CreateUserTokenParamsFromData creates a db.CreateUserTokenParams with token expiring 15 minutes from now
func CreateUserTokenParamsFromData(tokenType string, data any) (db.CreateUserTokenParams, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return db.CreateUserTokenParams{}, err
	}

	dataBytes, err := json.Marshal(data)
	if err != nil {
		return db.CreateUserTokenParams{}, err
	}

	now := time.Now()
	expires := now.Add(15 * time.Minute)

	return db.CreateUserTokenParams{
		ID:        id,
		Data:      dataBytes,
		Type:      tokenType,
		CreatedAt: now,
		ExpiresAt: expires,
	}, nil
}

// DraftToModel converts a db.Draft to a models.Draft
func DraftToModel(d db.Draft) models.Draft {
	return models.Draft{
		ID:        d.ID,
		UserID:    d.UserID,
		Type:      d.Type,
		Data:      json.RawMessage(d.Data),
		CreatedAt: d.CreatedAt,
	}
}

func DraftToModelPtr(d db.Draft) *models.Draft {
	draft := DraftToModel(d)
	return &draft
}

// CreateEditCommentParams creates a db.CreateEditCommentParams from editID, userID, and comment text
func CreateEditCommentParams(editID, userID uuid.UUID, commentText string) (db.CreateEditCommentParams, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return db.CreateEditCommentParams{}, err
	}

	return db.CreateEditCommentParams{
		ID:     id,
		EditID: editID,
		UserID: uuid.NullUUID{UUID: userID, Valid: true},
		Text:   commentText,
	}, nil
}

// PerformersToModels converts []db.Performer to []models.Performer
func PerformersToModels(performers []db.Performer) []models.Performer {
	result := make([]models.Performer, len(performers))
	for i, performer := range performers {
		result[i] = PerformerToModel(performer)
	}
	return result
}

func ScenesToModels(scenes []db.Scene) []models.Scene {
	result := make([]models.Scene, len(scenes))
	for i, scene := range scenes {
		result[i] = SceneToModel(scene)
	}
	return result
}

// StudiosToModels converts []db.Studio to []models.Studio
func StudiosToModels(studios []db.Studio) []models.Studio {
	result := make([]models.Studio, len(studios))
	for i, studio := range studios {
		result[i] = StudioToModel(studio)
	}
	return result
}

// TagCategoriesToModels converts []db.TagCategory to []models.TagCategory
func TagCategoriesToModels(tagCategories []db.TagCategory) []models.TagCategory {
	result := make([]models.TagCategory, len(tagCategories))
	for i, tagCategory := range tagCategories {
		result[i] = TagCategoryToModel(tagCategory)
	}
	return result
}

// TagsToModels converts []db.Tag to []models.Tag
func TagsToModels(tags []db.Tag) []models.Tag {
	result := make([]models.Tag, len(tags))
	for i, tag := range tags {
		result[i] = TagToModel(tag)
	}
	return result
}

// InviteKeyToModel converts a db.InviteKey to a models.InviteKey
func InviteKeyToModel(ik db.InviteKey) models.InviteKey {
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
func NotificationToModel(dbNotification db.Notification) models.Notification {
	notification := models.Notification{
		UserID:    dbNotification.UserID,
		Type:      models.NotificationEnum(dbNotification.Type),
		TargetID:  dbNotification.ID,
		CreatedAt: dbNotification.CreatedAt,
		ReadAt:    dbNotification.ReadAt,
	}

	return notification
}
