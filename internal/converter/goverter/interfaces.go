package goverter

//go:generate go run github.com/jmattheis/goverter/cmd/goverter gen .

import (
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
)

// ModelConverter handles all DB to Model conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertNullIntToInt ConvertTime
type ModelConverter interface {
	// goverter:map Url RemoteURL
	ConvertImage(source db.Image) models.Image

	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	// goverter:map Birthdate BirthDate
	// goverter:map Deathdate DeathDate
	ConvertPerformer(source db.Performer) models.Performer

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertScene(source db.Scene) models.Scene

	// goverter:map Url URL
	ConvertSite(source db.Site) models.Site

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertStudio(source db.Studio) models.Studio

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertTagCategory(source db.TagCategory) models.TagCategory

	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	ConvertTag(source db.Tag) models.Tag

	// goverter:map CreatedAt CreatedAt
	// goverter:map ExpiresAt ExpiresAt
	ConvertUserToken(source db.UserToken) models.UserToken

	// goverter:map Votes VoteCount
	ConvertEdit(source db.Edit) models.Edit

	ConvertEditVote(source db.EditVote) models.EditVote

	ConvertEditComment(source db.EditComment) models.EditComment

	// goverter:map ApiKey APIKey
	// goverter:map ApiCalls APICalls
	// goverter:map InvitedBy InvitedByID
	// goverter:map LastApiCall LastAPICall
	ConvertUser(source db.User) models.User

	// goverter:map ExpireTime Expires
	ConvertInviteKey(source db.InviteKey) models.InviteKey

	// goverter:map ID TargetID
	// goverter:map Type Type | ConvertNotificationType
	ConvertNotification(source db.Notification) models.Notification

	// Slice converters
	ConvertImages(source []db.Image) []models.Image
	ConvertEdits(source []db.Edit) []models.Edit
	ConvertEditComments(source []db.EditComment) []models.EditComment
	ConvertEditVotes(source []db.EditVote) []models.EditVote
	ConvertPerformers(source []db.Performer) []models.Performer
	ConvertScenes(source []db.Scene) []models.Scene
	ConvertStudios(source []db.Studio) []models.Studio
	ConvertTagCategories(source []db.TagCategory) []models.TagCategory
	ConvertTags(source []db.Tag) []models.Tag
	ConvertInviteKeys(source []db.InviteKey) []models.InviteKey
	ConvertNotifications(source []db.Notification) []models.Notification
}

// InputConverter handles all Input to Model conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
type InputConverter interface {
	// goverter:map Urls URLs
	// goverter:map Studio
	// goverter:ignore Tags
	// goverter:ignore Image
	ConvertSceneDraftInput(source models.SceneDraftInput) models.SceneDraft

	ConvertBodyModInputSlice(source []models.BodyModificationInput) []models.BodyModification
}

// CreateParamsConverter handles all Model to DB Create Params conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertTime
type CreateParamsConverter interface {
	ConvertTagToCreateParams(source models.Tag) db.CreateTagParams

	ConvertStudioToCreateParams(source models.Studio) db.CreateStudioParams

	ConvertSceneToCreateParams(source models.Scene) db.CreateSceneParams

	// goverter:map BirthDate Birthdate
	// goverter:map DeathDate Deathdate
	ConvertPerformerToCreateParams(source models.Performer) db.CreatePerformerParams

	// goverter:map UserID
	// goverter:map VoteCount Votes
	ConvertEditToCreateParams(source models.Edit) db.CreateEditParams

	// goverter:map URL Url
	ConvertSiteToCreateParams(source models.Site) db.CreateSiteParams

	ConvertEditCommentToCreateParams(source models.EditComment) db.CreateEditCommentParams
}

// UpdateParamsConverter handles all Model to DB Update Params conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertTime
type UpdateParamsConverter interface {
	ConvertSceneToUpdateParams(source models.Scene) db.UpdateSceneParams

	// goverter:map BirthDate Birthdate
	// goverter:map DeathDate Deathdate
	ConvertPerformerToUpdateParams(source models.Performer) db.UpdatePerformerParams

	// goverter:map VoteCount Votes
	ConvertEditToUpdateParams(source models.Edit) db.UpdateEditParams

	// goverter:map URL Url
	ConvertSiteToUpdateParams(source models.Site) db.UpdateSiteParams

	ConvertTagToUpdateParams(source models.Tag) db.UpdateTagParams

	ConvertStudioToUpdateParams(source models.Studio) db.UpdateStudioParams
}
