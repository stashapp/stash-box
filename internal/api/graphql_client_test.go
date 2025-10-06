//go:build integration
// +build integration

package api_test

import (
	"reflect"
	"strings"

	"github.com/99designs/gqlgen/client"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

type idObject struct {
	ID string `json:"id"`
}

type performerAppearance struct {
	Performer *idObject `json:"performer"`
	// Performing as alias
	As *string `json:"as"`
}

type fingerprint struct {
	Hash        string                      `json:"hash"`
	Algorithm   models.FingerprintAlgorithm `json:"algorithm"`
	Duration    int                         `json:"duration"`
	Submissions int                         `json:"submissions"`
	Created     string                      `json:"created"`
	Updated     string                      `json:"updated"`
}

type siteURL struct {
	Site *idObject `json:"site"`
	URL  string    `json:"url"`
}

type sceneOutput struct {
	ID             string                `json:"id"`
	Title          *string               `json:"title"`
	Details        *string               `json:"details"`
	Date           *string               `json:"release_date"`
	ProductionDate *string               `json:"production_date"`
	Urls           []siteURL             `json:"urls"`
	Studio         *idObject             `json:"studio"`
	Tags           []idObject            `json:"tags"`
	Images         []idObject            `json:"images"`
	Performers     []performerAppearance `json:"performers"`
	Fingerprints   []fingerprint         `json:"fingerprints"`
	Duration       *int                  `json:"duration"`
	Director       *string               `json:"director"`
	Code           *string               `json:"code"`
	Deleted        bool                  `json:"deleted"`
}

func (s sceneOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(s.ID)
}

type queryScenesResultType struct {
	Count  int           `json:"count"`
	Scenes []sceneOutput `json:"scenes"`
}

type measurements struct {
	CupSize  *string `json:"cup_size"`
	BandSize *int    `json:"band_size"`
	Waist    *int    `json:"waist"`
	Hip      *int    `json:"hip"`
}

type performerOutput struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	Disambiguation  *string       `json:"disambiguation"`
	Gender          *string       `json:"gender"`
	Birthdate       *string       `json:"birth_date"`
	Deathdate       *string       `json:"death_date"`
	Ethnicity       *string       `json:"ethnicity"`
	Country         *string       `json:"country"`
	EyeColor        *string       `json:"eye_color"`
	HairColor       *string       `json:"hair_color"`
	Height          *int          `json:"height"`
	Measurements    *measurements `json:"measurements"`
	BreastType      *string       `json:"breast_type"`
	CareerStartYear *int          `json:"career_start_year"`
	CareerEndYear   *int          `json:"career_end_year"`
}

func (p performerOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(p.ID)
}

type studioOutput struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Urls         []siteURL  `json:"urls"`
	Parent       *idObject  `json:"parent"`
	ChildStudios []idObject `json:"child_studios"`
	Images       []idObject `json:"images"`
	Deleted      bool       `json:"deleted"`
}

func (s studioOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(s.ID)
}

type tagOutput struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	Aliases     []string   `json:"aliases"`
	Deleted     bool       `json:"deleted"`
	Edits       []idObject `json:"edits"`
	Category    *idObject  `json:"category"`
}

func (t tagOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(t.ID)
}

type siteOutput struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description *string  `json:"description"`
	URL         *string  `json:"url"`
	Regex       *string  `json:"regex"`
	ValidTypes  []string `json:"valid_types"`
}

func (s siteOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(s.ID)
}

type querySitesResultType struct {
	Sites []siteOutput `json:"sites"`
}

type queryPerformersResultType struct {
	Count      int               `json:"count"`
	Performers []performerOutput `json:"performers"`
}

type queryStudiosResultType struct {
	Count   int            `json:"count"`
	Studios []studioOutput `json:"studios"`
}

type queryTagsResultType struct {
	Count int         `json:"count"`
	Tags  []tagOutput `json:"tags"`
}

type tagCategoryOutput struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

func (tc tagCategoryOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(tc.ID)
}

type queryTagCategoriesResultType struct {
	Count         int                 `json:"count"`
	TagCategories []tagCategoryOutput `json:"tag_categories"`
}

type userOutput struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (u userOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(u.ID)
}

type draftSubmissionStatusOutput struct {
	ID *string `json:"id"`
}

func (d draftSubmissionStatusOutput) UUID() *uuid.UUID {
	if d.ID == nil {
		return nil
	}
	id := uuid.FromStringOrNil(*d.ID)
	return &id
}

type draftEntityOutput struct {
	Name string  `json:"name"`
	ID   *string `json:"id"`
}

type draftFingerprintOutput struct {
	Hash      string `json:"hash"`
	Algorithm string `json:"algorithm"`
	Duration  int    `json:"duration"`
}

type sceneDraftOutput struct {
	ID           *string                  `json:"id"`
	Title        *string                  `json:"title"`
	Code         *string                  `json:"code"`
	Details      *string                  `json:"details"`
	Director     *string                  `json:"director"`
	URLs         []string                 `json:"urls"`
	Date         *string                  `json:"date"`
	Studio       *draftEntityOutput       `json:"studio"`
	Performers   []draftEntityOutput      `json:"performers"`
	Tags         []draftEntityOutput      `json:"tags"`
	Fingerprints []draftFingerprintOutput `json:"fingerprints"`
}

type performerDraftOutput struct {
	ID              *string  `json:"id"`
	Name            string   `json:"name"`
	Disambiguation  *string  `json:"disambiguation"`
	Aliases         *string  `json:"aliases"`
	Gender          *string  `json:"gender"`
	Birthdate       *string  `json:"birthdate"`
	Deathdate       *string  `json:"deathdate"`
	Urls            []string `json:"urls"`
	Ethnicity       *string  `json:"ethnicity"`
	Country         *string  `json:"country"`
	EyeColor        *string  `json:"eye_color"`
	HairColor       *string  `json:"hair_color"`
	Height          *string  `json:"height"`
	Measurements    *string  `json:"measurements"`
	BreastType      *string  `json:"breast_type"`
	Tattoos         *string  `json:"tattoos"`
	Piercings       *string  `json:"piercings"`
	CareerStartYear *int     `json:"career_start_year"`
	CareerEndYear   *int     `json:"career_end_year"`
}

type draftOutput struct {
	ID      string      `json:"id"`
	Created string      `json:"created"`
	Expires string      `json:"expires"`
	Data    interface{} `json:"data"`
}

func (d draftOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(d.ID)
}

type notificationOutput struct {
	Created string `json:"created"`
	Read    bool   `json:"read"`
}

type queryNotificationsResultType struct {
	Count         int                  `json:"count"`
	Notifications []notificationOutput `json:"notifications"`
}

func makeFragment(t reflect.Type) string {
	ret := strings.Builder{}
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		v := f.Tag.Get("json")
		if i > 0 {
			v = "\n" + v
		}

		ft := f.Type
		if ft.Kind() == reflect.Slice {
			ft = ft.Elem()
		}
		if ft.Kind() == reflect.Ptr {
			ft = ft.Elem()
		}

		if ft.Kind() == reflect.Struct {
			v = v + " {\n" + makeFragment(ft) + "\n}"
		}

		ret.WriteString(v)
	}

	return ret.String()
}

type graphqlClient struct {
	*client.Client
}

func (c *graphqlClient) createScene(input models.SceneCreateInput) (*sceneOutput, error) {
	q := `
	mutation SceneCreate($input: SceneCreateInput!) {
		sceneCreate(input: $input) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		SceneCreate *sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.SceneCreate, nil
}

func (c *graphqlClient) findScene(id uuid.UUID) (*sceneOutput, error) {
	q := `
	query FindScene($id: ID!) {
		findScene(id: $id) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		FindScene *sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("id", id)); err != nil {
		return nil, err
	}

	return resp.FindScene, nil
}

func (c *graphqlClient) findSceneByFingerprint(fingerprint models.FingerprintQueryInput) ([]sceneOutput, error) {
	q := `
	query FindSceneByFingerprint($input: FingerprintQueryInput!) {
		findSceneByFingerprint(fingerprint: $input) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		FindSceneByFingerprint []sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("input", fingerprint)); err != nil {
		return nil, err
	}

	return resp.FindSceneByFingerprint, nil
}

func (c *graphqlClient) findScenesByFingerprints(fingerprints []string) ([]sceneOutput, error) {
	q := `
	query FindScenesByFingerprints($input: [String!]!) {
		findScenesByFingerprints(fingerprints: $input) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		FindScenesByFingerprints []sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("input", fingerprints)); err != nil {
		return nil, err
	}

	return resp.FindScenesByFingerprints, nil
}

func (c *graphqlClient) queryScenes(input models.SceneQueryInput) (*queryScenesResultType, error) {
	q := `
	query QueryScenes($input: SceneQueryInput!) {
		queryScenes(input: $input) {
			` + makeFragment(reflect.TypeOf(queryScenesResultType{})) + `
		}
	}`

	var resp struct {
		QueryScenes *queryScenesResultType
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.QueryScenes, nil
}

func (c *graphqlClient) updateScene(updateInput models.SceneUpdateInput) (*sceneOutput, error) {
	q := `
	mutation SceneUpdate($input: SceneUpdateInput!) {
		sceneUpdate(input: $input) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		SceneUpdate *sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("input", updateInput)); err != nil {
		return nil, err
	}

	return resp.SceneUpdate, nil
}

func (c *graphqlClient) destroyScene(input models.SceneDestroyInput) (bool, error) {
	q := `
	mutation SceneDestroy($input: SceneDestroyInput!) {
		sceneDestroy(input: $input)
	}`

	var resp struct {
		SceneDestroy bool
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return false, err
	}

	return resp.SceneDestroy, nil
}

func (c *graphqlClient) submitFingerprint(input models.FingerprintSubmission) (bool, error) {
	q := `
	mutation SubmitFingerprint($input: FingerprintSubmission!) {
		submitFingerprint(input: $input)
	}`

	var resp struct {
		SubmitFingerprint bool
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return false, err
	}

	return resp.SubmitFingerprint, nil
}

func (c *graphqlClient) createPerformer(input models.PerformerCreateInput) (*performerOutput, error) {
	q := `
	mutation PerformerCreate($input: PerformerCreateInput!) {
		performerCreate(input: $input) {
			` + makeFragment(reflect.TypeOf(performerOutput{})) + `
		}
	}`

	var resp struct {
		PerformerCreate *performerOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.PerformerCreate, nil
}

func (c *graphqlClient) findPerformer(id uuid.UUID) (*performerOutput, error) {
	q := `
	query FindPerformer($id: ID!) {
		findPerformer(id: $id) {
			` + makeFragment(reflect.TypeOf(performerOutput{})) + `
		}
	}`

	var resp struct {
		FindPerformer *performerOutput
	}
	if err := c.Post(q, &resp, client.Var("id", id)); err != nil {
		return nil, err
	}

	return resp.FindPerformer, nil
}

func (c *graphqlClient) createStudio(input models.StudioCreateInput) (*studioOutput, error) {
	q := `
	mutation StudioCreate($input: StudioCreateInput!) {
		studioCreate(input: $input) {
			` + makeFragment(reflect.TypeOf(studioOutput{})) + `
		}
	}`

	var resp struct {
		StudioCreate *studioOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.StudioCreate, nil
}

func (c *graphqlClient) createTag(input models.TagCreateInput) (*tagOutput, error) {
	q := `
	mutation TagCreate($input: TagCreateInput!) {
		tagCreate(input: $input) {
			` + makeFragment(reflect.TypeOf(tagOutput{})) + `
		}
	}`

	var resp struct {
		TagCreate *tagOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.TagCreate, nil
}

func (c *graphqlClient) findSite(id uuid.UUID) (*siteOutput, error) {
	q := `
	query FindSite($id: ID!) {
		findSite(id: $id) {
			` + makeFragment(reflect.TypeOf(siteOutput{})) + `
		}
	}`

	var resp struct {
		FindSite *siteOutput
	}
	if err := c.Post(q, &resp, client.Var("id", id)); err != nil {
		return nil, err
	}

	return resp.FindSite, nil
}

func (c *graphqlClient) querySites() (*querySitesResultType, error) {
	q := `
	query QuerySites {
		querySites {
			` + makeFragment(reflect.TypeOf(querySitesResultType{})) + `
		}
	}`

	var resp struct {
		QuerySites *querySitesResultType
	}
	if err := c.Post(q, &resp); err != nil {
		return nil, err
	}

	return resp.QuerySites, nil
}

func (c *graphqlClient) updateSite(input models.SiteUpdateInput) (*siteOutput, error) {
	q := `
	mutation SiteUpdate($input: SiteUpdateInput!) {
		siteUpdate(input: $input) {
			` + makeFragment(reflect.TypeOf(siteOutput{})) + `
		}
	}`

	var resp struct {
		SiteUpdate *siteOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.SiteUpdate, nil
}

func (c *graphqlClient) destroySite(input models.SiteDestroyInput) (bool, error) {
	q := `
	mutation SiteDestroy($input: SiteDestroyInput!) {
		siteDestroy(input: $input)
	}`

	var resp struct {
		SiteDestroy bool
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return false, err
	}

	return resp.SiteDestroy, nil
}

func (c *graphqlClient) queryPerformers(input models.PerformerQueryInput) (*queryPerformersResultType, error) {
	q := `
	query QueryPerformers($input: PerformerQueryInput!) {
		queryPerformers(input: $input) {
			` + makeFragment(reflect.TypeOf(queryPerformersResultType{})) + `
		}
	}`

	var resp struct {
		QueryPerformers *queryPerformersResultType
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.QueryPerformers, nil
}

func (c *graphqlClient) queryStudios(input models.StudioQueryInput) (*queryStudiosResultType, error) {
	q := `
	query QueryStudios($input: StudioQueryInput!) {
		queryStudios(input: $input) {
			` + makeFragment(reflect.TypeOf(queryStudiosResultType{})) + `
		}
	}`

	var resp struct {
		QueryStudios *queryStudiosResultType
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.QueryStudios, nil
}

func (c *graphqlClient) queryTags(input models.TagQueryInput) (*queryTagsResultType, error) {
	q := `
	query QueryTags($input: TagQueryInput!) {
		queryTags(input: $input) {
			` + makeFragment(reflect.TypeOf(queryTagsResultType{})) + `
		}
	}`

	var resp struct {
		QueryTags *queryTagsResultType
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return resp.QueryTags, nil
}

func (c *graphqlClient) queryTagCategories() (*queryTagCategoriesResultType, error) {
	q := `
	query QueryTagCategories {
		queryTagCategories {
			` + makeFragment(reflect.TypeOf(queryTagCategoriesResultType{})) + `
		}
	}`

	var resp struct {
		QueryTagCategories *queryTagCategoriesResultType
	}
	if err := c.Post(q, &resp); err != nil {
		return nil, err
	}

	return resp.QueryTagCategories, nil
}

func (c *graphqlClient) findTagOrAlias(name string) (*tagOutput, error) {
	q := `
	query FindTagOrAlias($name: String!) {
		findTagOrAlias(name: $name) {
			` + makeFragment(reflect.TypeOf(tagOutput{})) + `
		}
	}`

	var resp struct {
		FindTagOrAlias *tagOutput
	}
	if err := c.Post(q, &resp, client.Var("name", name)); err != nil {
		return nil, err
	}

	return resp.FindTagOrAlias, nil
}

func (c *graphqlClient) me() (*userOutput, error) {
	q := `
	query Me {
		me {
			` + makeFragment(reflect.TypeOf(userOutput{})) + `
		}
	}`

	var resp struct {
		Me *userOutput
	}
	if err := c.Post(q, &resp); err != nil {
		return nil, err
	}

	return resp.Me, nil
}

func (c *graphqlClient) favoritePerformer(id uuid.UUID, favorite bool) (bool, error) {
	q := `
	mutation FavoritePerformer($id: ID!, $favorite: Boolean!) {
		favoritePerformer(id: $id, favorite: $favorite)
	}`

	var resp struct {
		FavoritePerformer bool
	}
	if err := c.Post(q, &resp, client.Var("id", id), client.Var("favorite", favorite)); err != nil {
		return false, err
	}

	return resp.FavoritePerformer, nil
}

func (c *graphqlClient) favoriteStudio(id uuid.UUID, favorite bool) (bool, error) {
	q := `
	mutation FavoriteStudio($id: ID!, $favorite: Boolean!) {
		favoriteStudio(id: $id, favorite: $favorite)
	}`

	var resp struct {
		FavoriteStudio bool
	}
	if err := c.Post(q, &resp, client.Var("id", id), client.Var("favorite", favorite)); err != nil {
		return false, err
	}

	return resp.FavoriteStudio, nil
}

func (c *graphqlClient) submitSceneDraft(input models.SceneDraftInput) (*draftSubmissionStatusOutput, error) {
	q := `
	mutation SubmitSceneDraft($input: SceneDraftInput!) {
		submitSceneDraft(input: $input) {
			id
		}
	}`

	var resp struct {
		SubmitSceneDraft draftSubmissionStatusOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return &resp.SubmitSceneDraft, nil
}

func (c *graphqlClient) submitPerformerDraft(input models.PerformerDraftInput) (*draftSubmissionStatusOutput, error) {
	q := `
	mutation SubmitPerformerDraft($input: PerformerDraftInput!) {
		submitPerformerDraft(input: $input) {
			id
		}
	}`

	var resp struct {
		SubmitPerformerDraft draftSubmissionStatusOutput
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return &resp.SubmitPerformerDraft, nil
}

func (c *graphqlClient) findDraft(id uuid.UUID) (*draftOutput, error) {
	q := `
	query FindDraft($id: ID!) {
		findDraft(id: $id) {
			id
			created
			expires
		}
	}`

	var resp struct {
		FindDraft *draftOutput
	}
	if err := c.Post(q, &resp, client.Var("id", id)); err != nil {
		return nil, err
	}

	return resp.FindDraft, nil
}

func (c *graphqlClient) findDrafts() ([]draftOutput, error) {
	q := `
	query FindDrafts {
		findDrafts {
			id
			created
			expires
		}
	}`

	var resp struct {
		FindDrafts []draftOutput
	}
	if err := c.Post(q, &resp); err != nil {
		return nil, err
	}

	return resp.FindDrafts, nil
}

func (c *graphqlClient) destroyDraft(id uuid.UUID) (bool, error) {
	q := `
	mutation DestroyDraft($id: ID!) {
		destroyDraft(id: $id)
	}`

	var resp struct {
		DestroyDraft bool
	}
	if err := c.Post(q, &resp, client.Var("id", id)); err != nil {
		return false, err
	}

	return resp.DestroyDraft, nil
}

func (c *graphqlClient) queryNotifications(input models.QueryNotificationsInput) (*queryNotificationsResultType, error) {
	q := `
	query QueryNotifications($input: QueryNotificationsInput!) {
		queryNotifications(input: $input) {
			count
			notifications {
				created
				read
			}
		}
	}`

	var resp struct {
		QueryNotifications queryNotificationsResultType
	}
	if err := c.Post(q, &resp, client.Var("input", input)); err != nil {
		return nil, err
	}

	return &resp.QueryNotifications, nil
}

func (c *graphqlClient) getUnreadNotificationCount() (int, error) {
	q := `
	query GetUnreadNotificationCount {
		getUnreadNotificationCount
	}`

	var resp struct {
		GetUnreadNotificationCount int
	}
	if err := c.Post(q, &resp); err != nil {
		return 0, err
	}

	return resp.GetUnreadNotificationCount, nil
}

func (c *graphqlClient) updateNotificationSubscriptions(subscriptions []models.NotificationEnum) (bool, error) {
	q := `
	mutation UpdateNotificationSubscriptions($subscriptions: [NotificationEnum!]!) {
		updateNotificationSubscriptions(subscriptions: $subscriptions)
	}`

	var resp struct {
		UpdateNotificationSubscriptions bool
	}
	if err := c.Post(q, &resp, client.Var("subscriptions", subscriptions)); err != nil {
		return false, err
	}

	return resp.UpdateNotificationSubscriptions, nil
}
