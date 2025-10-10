package gen

//go:generate go run github.com/jmattheis/goverter/cmd/goverter gen .

import (
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// ModelConverter handles all DB to Model conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertNullIntToInt ConvertTime
type ModelConverter interface {
	// goverter:map Url RemoteURL
	ConvertImage(source queries.Image) models.Image

	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	// goverter:map Birthdate BirthDate
	// goverter:map Deathdate DeathDate
	ConvertPerformer(source queries.Performer) models.Performer

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertScene(source queries.Scene) models.Scene

	// goverter:map Url URL
	ConvertSite(source queries.Site) models.Site

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertStudio(source queries.Studio) models.Studio

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertTagCategory(source queries.TagCategory) models.TagCategory

	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	ConvertTag(source queries.Tag) models.Tag

	// goverter:map CreatedAt CreatedAt
	// goverter:map ExpiresAt ExpiresAt
	ConvertUserToken(source queries.UserToken) models.UserToken

	// goverter:map Votes VoteCount
	ConvertEdit(source queries.Edit) models.Edit

	ConvertEditVote(source queries.EditVote) models.EditVote

	ConvertEditComment(source queries.EditComment) models.EditComment

	// goverter:map ApiKey APIKey
	// goverter:map ApiCalls APICalls
	// goverter:map InvitedBy InvitedByID
	// goverter:map LastApiCall LastAPICall
	ConvertUser(source queries.User) models.User

	// goverter:map ExpireTime Expires
	ConvertInviteKey(source queries.InviteKey) models.InviteKey

	// goverter:map ID TargetID
	// goverter:map Type Type | ConvertNotificationType
	ConvertNotification(source queries.Notification) models.Notification

	// Slice converters
	ConvertImages(source []queries.Image) []models.Image
	ConvertEdits(source []queries.Edit) []models.Edit
	ConvertEditComments(source []queries.EditComment) []models.EditComment
	ConvertEditVotes(source []queries.EditVote) []models.EditVote
	ConvertPerformers(source []queries.Performer) []models.Performer
	ConvertScenes(source []queries.Scene) []models.Scene
	ConvertStudios(source []queries.Studio) []models.Studio
	ConvertTagCategories(source []queries.TagCategory) []models.TagCategory
	ConvertTags(source []queries.Tag) []models.Tag
	ConvertInviteKeys(source []queries.InviteKey) []models.InviteKey
	ConvertNotifications(source []queries.Notification) []models.Notification
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
	ConvertTagToCreateParams(source models.Tag) queries.CreateTagParams

	ConvertStudioToCreateParams(source models.Studio) queries.CreateStudioParams

	ConvertSceneToCreateParams(source models.Scene) queries.CreateSceneParams

	// goverter:map BirthDate Birthdate
	// goverter:map DeathDate Deathdate
	ConvertPerformerToCreateParams(source models.Performer) queries.CreatePerformerParams

	// goverter:map UserID
	// goverter:map VoteCount Votes
	ConvertEditToCreateParams(source models.Edit) queries.CreateEditParams

	// goverter:map URL Url
	ConvertSiteToCreateParams(source models.Site) queries.CreateSiteParams

	ConvertEditCommentToCreateParams(source models.EditComment) queries.CreateEditCommentParams
}

// UpdateParamsConverter handles all Model to DB Update Params conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertTime
type UpdateParamsConverter interface {
	ConvertSceneToUpdateParams(source models.Scene) queries.UpdateSceneParams

	// goverter:map BirthDate Birthdate
	// goverter:map DeathDate Deathdate
	ConvertPerformerToUpdateParams(source models.Performer) queries.UpdatePerformerParams

	// goverter:map VoteCount Votes
	ConvertEditToUpdateParams(source models.Edit) queries.UpdateEditParams

	// goverter:map URL Url
	ConvertSiteToUpdateParams(source models.Site) queries.UpdateSiteParams

	ConvertTagToUpdateParams(source models.Tag) queries.UpdateTagParams

	ConvertStudioToUpdateParams(source models.Studio) queries.UpdateStudioParams
}
