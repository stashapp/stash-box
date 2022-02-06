//go:build integration
// +build integration

package api_test

import (
	"reflect"
	"strings"

	"github.com/99designs/gqlgen/client"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
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
	ID           string                 `json:"id"`
	Title        *string                `json:"title"`
	Details      *string                `json:"details"`
	Date         *string                `json:"date"`
	Urls         []*siteURL             `json:"urls"`
	Studio       *idObject              `json:"studio"`
	Tags         []*idObject            `json:"tags"`
	Images       []*idObject            `json:"images"`
	Performers   []*performerAppearance `json:"performers"`
	Fingerprints []*fingerprint         `json:"fingerprints"`
	Duration     *int                   `json:"duration"`
	Director     *string                `json:"director"`
	Code         *string                `json:"code"`
	Deleted      bool                   `json:"deleted"`
}

func (s sceneOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(s.ID)
}

type queryScenesResultType struct {
	Count  int            `json:"count"`
	Scenes []*sceneOutput `json:"scenes"`
}

type fuzzyDate struct {
	Date     string                  `json:"date"`
	Accuracy models.DateAccuracyEnum `json:"accuracy"`
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
	Birthdate       *fuzzyDate    `json:"birthdate"`
	Ethnicity       *string       `json:"ethnicity"`
	Country         *string       `json:"country"`
	EyeColor        *string       `json:"eye_color"`
	HairColor       *string       `json:"hair_color"`
	Height          *int64        `json:"height"`
	Measurements    *measurements `json:"measurements"`
	BreastType      *string       `json:"breast_type"`
	CareerStartYear *int64        `json:"career_start_year"`
	CareerEndYear   *int64        `json:"career_end_year"`
}

func (p performerOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(p.ID)
}

type studioOutput struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Urls         []*models.URL `json:"urls"`
	Parent       *idObject     `json:"parent"`
	ChildStudios []*idObject   `json:"child_studios"`
	Images       []*idObject   `json:"images"`
	Deleted      bool          `json:"deleted"`
}

func (s studioOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(s.ID)
}

type tagOutput struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description *string     `json:"description"`
	Aliases     []string    `json:"aliases"`
	Deleted     bool        `json:"deleted"`
	Edits       []*idObject `json:"edits"`
	Category    *idObject   `json:"category"`
}

func (t tagOutput) UUID() uuid.UUID {
	return uuid.FromStringOrNil(t.ID)
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

func (c *graphqlClient) findSceneByFingerprint(fingerprint models.FingerprintQueryInput) ([]*sceneOutput, error) {
	q := `
	query FindSceneByFingerprint($input: FingerprintQueryInput!) {
		findSceneByFingerprint(fingerprint: $input) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		FindSceneByFingerprint []*sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("input", fingerprint)); err != nil {
		return nil, err
	}

	return resp.FindSceneByFingerprint, nil
}

func (c *graphqlClient) findScenesByFingerprints(fingerprints []string) ([]*sceneOutput, error) {
	q := `
	query FindScenesByFingerprints($input: [String!]!) {
		findScenesByFingerprints(fingerprints: $input) {
			` + makeFragment(reflect.TypeOf(sceneOutput{})) + `
		}
	}`

	var resp struct {
		FindScenesByFingerprints []*sceneOutput
	}
	if err := c.Post(q, &resp, client.Var("input", fingerprints)); err != nil {
		return nil, err
	}

	return resp.FindScenesByFingerprints, nil
}

func (c *graphqlClient) queryScenes(sceneFilter *models.SceneFilterType, filter *models.QuerySpec) (*queryScenesResultType, error) {
	q := `
	query QueryScenes($sceneFilter: SceneFilterType, $filter: QuerySpec) {
		queryScenes(scene_filter: $sceneFilter, filter: $filter) {
			` + makeFragment(reflect.TypeOf(queryScenesResultType{})) + `
		}
	}`

	var resp struct {
		QueryScenes *queryScenesResultType
	}
	if err := c.Post(q, &resp, client.Var("sceneFilter", sceneFilter), client.Var("filter", filter)); err != nil {
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
