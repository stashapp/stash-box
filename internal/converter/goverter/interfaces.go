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
// goverter:extend ConvertNullUUID ConvertNullIntToInt ConvertBytesToJSON ConvertUUIDToNullUUID ConvertTime
type ModelConverter interface {
	// goverter:map Url RemoteURL
	ConvertImage(source db.Image) *models.Image

	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	// goverter:map Birthdate BirthDate
	// goverter:map Deathdate DeathDate
	ConvertPerformer(source db.Performer) *models.Performer

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertScene(source db.Scene) *models.Scene

	// goverter:map Url URL
	ConvertSite(source db.Site) *models.Site

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertStudio(source db.Studio) *models.Studio

	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertTagCategory(source db.TagCategory) *models.TagCategory

	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	ConvertTag(source db.Tag) *models.Tag

	// goverter:map CreatedAt CreatedAt
	// goverter:map ExpiresAt ExpiresAt
	ConvertUserToken(source db.UserToken) *models.UserToken

	// goverter:map Votes VoteCount
	// goverter:map Data | ConvertBytesToJSON
	ConvertEdit(source db.Edit) *models.Edit

	ConvertEditComment(source db.EditComment) *models.EditComment

	// goverter:map UserID | ConvertUUIDToNullUUID
	ConvertEditVote(source db.EditVote) *models.EditVote

	// goverter:map ApiKey APIKey
	// goverter:map ApiCalls APICalls
	// goverter:map InvitedBy InvitedByID
	// goverter:map LastApiCall LastAPICall
	ConvertUser(source db.User) *models.User
}

// InputConverter handles all Input to Model conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertDraftEntityInputPtr ConvertDraftEntityInputSlice FilterDraftFingerprints
type InputConverter interface {
	// goverter:map Urls URLs
	// goverter:map Studio | ConvertDraftEntityInputPtr
	// goverter:map Performers | ConvertDraftEntityInputSlice
	// goverter:map Fingerprints | FilterDraftFingerprints
	// goverter:ignore Tags
	// goverter:ignore Image
	ConvertSceneDraftInput(source models.SceneDraftInput) models.SceneDraft

	ConvertURLInputToURL(source models.URLInput) models.URL
}

// CreateParamsConverter handles all Model to DB Create Params conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertJSONToBytes ConvertUUIDNullToNullUUID ConvertNullUUIDToUUID ConvertTime
type CreateParamsConverter interface {
	// goverter:map Created CreatedAt
	// goverter:map Updated UpdatedAt
	ConvertTagToCreateParams(source models.Tag) db.CreateTagParams

	ConvertStudioToCreateParams(source models.Studio) db.CreateStudioParams

	ConvertSceneToCreateParams(source models.Scene) db.CreateSceneParams

	// goverter:map BirthDate Birthdate
	// goverter:map DeathDate Deathdate
	// goverter:map Created CreatedAt
	// goverter:map Updated UpdatedAt
	ConvertPerformerToCreateParams(source models.Performer) db.CreatePerformerParams

	// goverter:map UserID | ConvertUUIDNullToNullUUID
	// goverter:map Data | ConvertJSONToBytes
	// goverter:map VoteCount Votes
	ConvertEditToCreateParams(source models.Edit) db.CreateEditParams

	// goverter:map UserID | ConvertNullUUIDToUUID
	ConvertEditVoteToCreateParams(source models.EditVote) db.CreateEditVoteParams

	// goverter:map URL Url
	ConvertSiteToCreateParams(source models.Site) db.CreateSiteParams
}

// UpdateParamsConverter handles all Model to DB Update Params conversions
// goverter:converter
// goverter:output:file ./generated.go
// goverter:enum:unknown @ignore
// goverter:extend ConvertJSONToBytes ConvertUUIDNullToNullUUID ConvertTime
type UpdateParamsConverter interface {
	ConvertSceneToUpdateParams(source models.Scene) db.UpdateSceneParams

	// goverter:map BirthDate Birthdate
	// goverter:map DeathDate Deathdate
	// goverter:map Updated UpdatedAt
	ConvertPerformerToUpdateParams(source models.Performer) db.UpdatePerformerParams

	// goverter:map UserID | ConvertUUIDNullToNullUUID
	// goverter:map Data | ConvertJSONToBytes
	// goverter:map VoteCount Votes
	ConvertEditToUpdateParams(source models.Edit) db.UpdateEditParams

	// goverter:map URL Url
	ConvertSiteToUpdateParams(source models.Site) db.UpdateSiteParams
}
