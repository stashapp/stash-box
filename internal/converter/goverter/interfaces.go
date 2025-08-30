package goverter

//go:generate go run github.com/jmattheis/goverter/cmd/goverter gen .

import (
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
)

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertNullString ConvertInt32ToInt
type ImageConverter interface {
	// goverter:map Url RemoteURL
	ConvertImage(source db.Image) *models.Image
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullUUID ConvertNullString ConvertNullInt ConvertTextToGenderEnum ConvertTextToEthnicityEnum ConvertTextToEyeColorEnum ConvertTextToHairColorEnum ConvertTextToBreastTypeEnum
type PerformerConverter interface {
	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	// goverter:map Birthdate BirthDate
	// goverter:map Deathdate DeathDate
	// goverter:map Gender | ConvertTextToGenderEnum
	// goverter:map Ethnicity | ConvertTextToEthnicityEnum
	// goverter:map EyeColor | ConvertTextToEyeColorEnum
	// goverter:map HairColor | ConvertTextToHairColorEnum
	// goverter:map BreastType | ConvertTextToBreastTypeEnum
	ConvertPerformer(source db.Performer) *models.Performer
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullUUID ConvertNullString ConvertNullInt
type SceneConverter interface {
	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertScene(source db.Scene) *models.Scene
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullString
type SiteConverter interface {
	// goverter:map Url URL
	ConvertSite(source db.Site) *models.Site
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullUUID ConvertNullString
type StudioConverter interface {
	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertStudio(source db.Studio) *models.Studio
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullUUID ConvertNullString
type TagCategoryConverter interface {
	// goverter:map CreatedAt CreatedAt
	// goverter:map UpdatedAt UpdatedAt
	ConvertTagCategory(source db.TagCategory) *models.TagCategory
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullUUID ConvertNullString
type TagConverter interface {
	// goverter:map CreatedAt Created
	// goverter:map UpdatedAt Updated
	ConvertTag(source db.Tag) *models.Tag
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertBytesToJSON
type UserTokenConverter interface {
	// goverter:map CreatedAt CreatedAt
	// goverter:map ExpiresAt ExpiresAt
	ConvertUserToken(source db.UserToken) *models.UserToken
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertDraftEntityInputPtr ConvertDraftEntityInputSlice FilterDraftFingerprints
type SceneDraftInputConverter interface {
	// goverter:map Urls URLs
	// goverter:map Studio | ConvertDraftEntityInputPtr
	// goverter:map Performers | ConvertDraftEntityInputSlice
	// goverter:map Fingerprints | FilterDraftFingerprints
	// goverter:ignore Tags
	// goverter:ignore Image
	ConvertSceneDraftInput(source models.SceneDraftInput) models.SceneDraft
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertNullTimestamp ConvertBytesToJSON ConvertInt32ToInt
type EditConverter interface {
	// goverter:map Votes VoteCount | ConvertInt32ToInt
	// goverter:map UpdateCount | ConvertInt32ToInt
	// goverter:map Data | ConvertBytesToJSON
	// goverter:map CreatedAt | ConvertPgTimestamp
	// goverter:map UpdatedAt | ConvertNullTimestamp
	// goverter:map ClosedAt | ConvertNullTimestamp
	ConvertEdit(source db.Edit) *models.Edit
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp
type EditCommentConverter interface {
	// goverter:map CreatedAt | ConvertPgTimestamp
	ConvertEditComment(source db.EditComment) *models.EditComment
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertUUIDToNullUUID
type EditVoteConverter interface {
	// goverter:map UserID | ConvertUUIDToNullUUID
	// goverter:map CreatedAt | ConvertPgTimestamp
	ConvertEditVote(source db.EditVote) *models.EditVote
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertStringPtrToPgText ConvertTimeToPgTimestamp
type TagToCreateParamsConverter interface {
	// goverter:map Description | ConvertStringPtrToPgText
	// goverter:map Created CreatedAt | ConvertTimeToPgTimestamp
	// goverter:map Updated UpdatedAt | ConvertTimeToPgTimestamp
	ConvertTagToCreateParams(source models.Tag) db.CreateTagParams
}

// goverter:converter
// goverter:output:file ./generated.go
type URLInputToURLConverter interface {
	ConvertURLInputToURL(source models.URLInput) models.URL
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertTimeToPgTimestamp
type StudioToCreateParamsConverter interface {
	// goverter:map CreatedAt | ConvertTimeToPgTimestamp
	// goverter:map UpdatedAt | ConvertTimeToPgTimestamp
	ConvertStudioToCreateParams(source models.Studio) db.CreateStudioParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertStringPtrToPgText ConvertTimeToPgTimestamp ConvertIntPtrToPgInt4
type SceneToCreateParamsConverter interface {
	// goverter:map Title | ConvertStringPtrToPgText
	// goverter:map Details | ConvertStringPtrToPgText
	// goverter:map Date | ConvertStringPtrToPgText
	// goverter:map ProductionDate | ConvertStringPtrToPgText
	// goverter:map CreatedAt | ConvertTimeToPgTimestamp
	// goverter:map UpdatedAt | ConvertTimeToPgTimestamp
	// goverter:map Duration | ConvertIntPtrToPgInt4
	// goverter:map Director | ConvertStringPtrToPgText
	// goverter:map Code | ConvertStringPtrToPgText
	ConvertSceneToCreateParams(source models.Scene) db.CreateSceneParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertStringPtrToPgText ConvertTimeToPgTimestamp ConvertIntPtrToPgInt4
type SceneToUpdateParamsConverter interface {
	// goverter:map Title | ConvertStringPtrToPgText
	// goverter:map Details | ConvertStringPtrToPgText
	// goverter:map Date | ConvertStringPtrToPgText
	// goverter:map ProductionDate | ConvertStringPtrToPgText
	// goverter:map UpdatedAt | ConvertTimeToPgTimestamp
	// goverter:map Duration | ConvertIntPtrToPgInt4
	// goverter:map Director | ConvertStringPtrToPgText
	// goverter:map Code | ConvertStringPtrToPgText
	ConvertSceneToUpdateParams(source models.Scene) db.UpdateSceneParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertStringPtrToPgText ConvertTimeToPgTimestamp ConvertIntPtrToPgInt4 ConvertGenderEnumToPgText ConvertEthnicityEnumToPgText ConvertEyeColorEnumToPgText ConvertHairColorEnumToPgText ConvertBreastTypeEnumToPgText
type PerformerToCreateParamsConverter interface {
	// goverter:map Disambiguation | ConvertStringPtrToPgText
	// goverter:map Gender | ConvertGenderEnumToPgText
	// goverter:map BirthDate Birthdate | ConvertStringPtrToPgText
	// goverter:map Ethnicity | ConvertEthnicityEnumToPgText
	// goverter:map Country | ConvertStringPtrToPgText
	// goverter:map EyeColor | ConvertEyeColorEnumToPgText
	// goverter:map HairColor | ConvertHairColorEnumToPgText
	// goverter:map Height | ConvertIntPtrToPgInt4
	// goverter:map CupSize | ConvertStringPtrToPgText
	// goverter:map BandSize | ConvertIntPtrToPgInt4
	// goverter:map HipSize | ConvertIntPtrToPgInt4
	// goverter:map WaistSize | ConvertIntPtrToPgInt4
	// goverter:map BreastType | ConvertBreastTypeEnumToPgText
	// goverter:map CareerStartYear | ConvertIntPtrToPgInt4
	// goverter:map CareerEndYear | ConvertIntPtrToPgInt4
	// goverter:map Created CreatedAt | ConvertTimeToPgTimestamp
	// goverter:map Updated UpdatedAt | ConvertTimeToPgTimestamp
	// goverter:map DeathDate Deathdate | ConvertStringPtrToPgText
	ConvertPerformerToCreateParams(source models.Performer) db.CreatePerformerParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertStringPtrToPgText ConvertTimeToPgTimestamp ConvertIntPtrToPgInt4 ConvertGenderEnumToPgText ConvertEthnicityEnumToPgText ConvertEyeColorEnumToPgText ConvertHairColorEnumToPgText ConvertBreastTypeEnumToPgText
type PerformerToUpdateParamsConverter interface {
	// goverter:map Disambiguation | ConvertStringPtrToPgText
	// goverter:map Gender | ConvertGenderEnumToPgText
	// goverter:map BirthDate Birthdate | ConvertStringPtrToPgText
	// goverter:map Ethnicity | ConvertEthnicityEnumToPgText
	// goverter:map Country | ConvertStringPtrToPgText
	// goverter:map EyeColor | ConvertEyeColorEnumToPgText
	// goverter:map HairColor | ConvertHairColorEnumToPgText
	// goverter:map Height | ConvertIntPtrToPgInt4
	// goverter:map CupSize | ConvertStringPtrToPgText
	// goverter:map BandSize | ConvertIntPtrToPgInt4
	// goverter:map HipSize | ConvertIntPtrToPgInt4
	// goverter:map WaistSize | ConvertIntPtrToPgInt4
	// goverter:map BreastType | ConvertBreastTypeEnumToPgText
	// goverter:map CareerStartYear | ConvertIntPtrToPgInt4
	// goverter:map CareerEndYear | ConvertIntPtrToPgInt4
	// goverter:map Updated UpdatedAt | ConvertTimeToPgTimestamp
	// goverter:map DeathDate Deathdate | ConvertStringPtrToPgText
	ConvertPerformerToUpdateParams(source models.Performer) db.UpdatePerformerParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertTimePtrToPgTimestamp ConvertJSONToBytes ConvertIntToInt32 ConvertUUIDNullToNullUUID
type EditToUpdateParamsConverter interface {
	// goverter:map UserID | ConvertUUIDNullToNullUUID
	// goverter:map Data | ConvertJSONToBytes
	// goverter:map VoteCount Votes | ConvertIntToInt32
	// goverter:map UpdatedAt | ConvertTimePtrToPgTimestamp
	ConvertEditToUpdateParams(source models.Edit) db.UpdateEditParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertTimeToPgTimestamp ConvertTimePtrToPgTimestamp ConvertJSONToBytes ConvertIntToInt32 ConvertUUIDNullToNullUUID
type EditToCreateParamsConverter interface {
	// goverter:map UserID | ConvertUUIDNullToNullUUID
	// goverter:map Data | ConvertJSONToBytes
	// goverter:map VoteCount Votes | ConvertIntToInt32
	// goverter:map CreatedAt | ConvertTimeToPgTimestamp
	// goverter:map UpdatedAt | ConvertTimePtrToPgTimestamp
	ConvertEditToCreateParams(source models.Edit) db.CreateEditParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertTimeToPgTimestamp ConvertNullUUIDToUUID
type EditVoteToCreateParamsConverter interface {
	// goverter:map UserID | ConvertNullUUIDToUUID
	ConvertEditVoteToCreateParams(source models.EditVote) db.CreateEditVoteParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertPgTimestamp ConvertPgInt4ToInt ConvertInt32ToInt
type UserConverter interface {
	// goverter:map ApiKey APIKey
	// goverter:map ApiCalls APICalls | ConvertPgInt4ToInt
	// goverter:map InvitedBy InvitedByID
	// goverter:map InviteTokens | ConvertInt32ToInt
	// goverter:map LastApiCall LastAPICall | ConvertPgTimestamp
	// goverter:map CreatedAt | ConvertPgTimestamp
	// goverter:map UpdatedAt | ConvertPgTimestamp
	ConvertUser(source db.User) *models.User
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertTimeToPgTimestamp ConvertStringPtrToPgText
type SiteToCreateParamsConverter interface {
	// goverter:map Description | ConvertStringPtrToPgText
	// goverter:map URL Url | ConvertStringPtrToPgText
	// goverter:map Regex | ConvertStringPtrToPgText
	// goverter:map CreatedAt | ConvertTimeToPgTimestamp
	// goverter:map UpdatedAt | ConvertTimeToPgTimestamp
	ConvertSiteToCreateParams(source models.Site) db.CreateSiteParams
}

// goverter:converter
// goverter:output:file ./generated.go
// goverter:extend ConvertTimeToPgTimestamp ConvertStringPtrToPgText
type SiteToUpdateParamsConverter interface {
	// goverter:map Description | ConvertStringPtrToPgText
	// goverter:map URL Url | ConvertStringPtrToPgText
	// goverter:map Regex | ConvertStringPtrToPgText
	// goverter:map UpdatedAt | ConvertTimeToPgTimestamp
	ConvertSiteToUpdateParams(source models.Site) db.UpdateSiteParams
}
