package models

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/utils"
)

func (e TagEditDetailsInput) TagEditFromDiff(orig Tag, inputArgs utils.ArgumentsQuery) TagEditData {
	newData := &TagEdit{}
	oldData := &TagEdit{}

	ed := editDiff{}

	if e.Name != nil || inputArgs.Field("name").IsNull() {
		oldData.Name, newData.Name = ed.string(&orig.Name, e.Name)
	}
	if e.Description != nil || inputArgs.Field("description").IsNull() {
		oldData.Description, newData.Description = ed.nullString(orig.Description, e.Description)
	}
	if e.CategoryID != nil || inputArgs.Field("category_id").IsNull() {
		oldData.CategoryID, newData.CategoryID = ed.nullUUID(orig.CategoryID, e.CategoryID)
	}

	return TagEditData{
		New: newData,
		Old: oldData,
	}
}

func (e TagEditDetailsInput) TagEditFromMerge(orig Tag, sources []uuid.UUID, inputArgs utils.ArgumentsQuery) TagEditData {
	data := e.TagEditFromDiff(orig, inputArgs)
	data.MergeSources = sources

	return data
}

func (e TagEditDetailsInput) TagEditFromCreate(inputArgs utils.ArgumentsQuery) TagEditData {
	ret := e.TagEditFromDiff(Tag{}, inputArgs)

	return TagEditData{
		New: ret.New,
	}
}

func (e PerformerEditDetailsInput) PerformerEditFromDiff(orig Performer, inputArgs utils.ArgumentsQuery) (*PerformerEditData, error) {
	if err := ValidateFuzzyString(e.Birthdate); err != nil {
		return nil, err
	}

	newData := &PerformerEdit{}
	oldData := &PerformerEdit{}

	ed := editDiff{}
	if e.Name != nil || inputArgs.Field("name").IsNull() {
		oldData.Name, newData.Name = ed.string(&orig.Name, e.Name)
	}
	if e.Disambiguation != nil || inputArgs.Field("disambiguation").IsNull() {
		oldData.Disambiguation, newData.Disambiguation = ed.nullString(orig.Disambiguation, e.Disambiguation)
	}
	if e.Gender != nil || inputArgs.Field("gender").IsNull() {
		oldData.Gender, newData.Gender = ed.nullStringEnum(orig.Gender, e.Gender)
	}
	if e.Birthdate != nil || inputArgs.Field("birthdate").IsNull() {
		oldData.Birthdate, newData.Birthdate = ed.nullString(orig.Birthdate, e.Birthdate)
	}
	if e.Ethnicity != nil || inputArgs.Field("ethnicity").IsNull() {
		oldData.Ethnicity, newData.Ethnicity = ed.nullStringEnum(orig.Ethnicity, e.Ethnicity)
	}
	if e.Country != nil || inputArgs.Field("country").IsNull() {
		oldData.Country, newData.Country = ed.nullString(orig.Country, e.Country)
	}
	if e.EyeColor != nil || inputArgs.Field("eye_color").IsNull() {
		oldData.EyeColor, newData.EyeColor = ed.nullStringEnum(orig.EyeColor, e.EyeColor)
	}
	if e.HairColor != nil || inputArgs.Field("hair_color").IsNull() {
		oldData.HairColor, newData.HairColor = ed.nullStringEnum(orig.HairColor, e.HairColor)
	}
	if e.Height != nil || inputArgs.Field("height").IsNull() {
		oldData.Height, newData.Height = ed.nullInt64(orig.Height, e.Height)
	}

	if e.CupSize != nil || inputArgs.Field("cup_size").IsNull() {
		oldData.CupSize, newData.CupSize = ed.nullString(orig.CupSize, e.CupSize)
	}
	if e.BandSize != nil || inputArgs.Field("band_size").IsNull() {
		oldData.BandSize, newData.BandSize = ed.nullInt64(orig.BandSize, e.BandSize)
	}
	if e.WaistSize != nil || inputArgs.Field("waist_size").IsNull() {
		oldData.WaistSize, newData.WaistSize = ed.nullInt64(orig.WaistSize, e.WaistSize)
	}
	if e.HipSize != nil || inputArgs.Field("hip_size").IsNull() {
		oldData.HipSize, newData.HipSize = ed.nullInt64(orig.HipSize, e.HipSize)
	}

	if e.BreastType != nil || inputArgs.Field("breast_type").IsNull() {
		oldData.BreastType, newData.BreastType = ed.nullStringEnum(orig.BreastType, e.BreastType)
	}
	if e.CareerStartYear != nil || inputArgs.Field("career_start_year").IsNull() {
		oldData.CareerStartYear, newData.CareerStartYear = ed.nullInt64(orig.CareerStartYear, e.CareerStartYear)
	}
	if e.CareerEndYear != nil || inputArgs.Field("career_end_year").IsNull() {
		oldData.CareerEndYear, newData.CareerEndYear = ed.nullInt64(orig.CareerEndYear, e.CareerEndYear)
	}

	return &PerformerEditData{
		New: newData,
		Old: oldData,
	}, nil
}

func (e PerformerEditDetailsInput) PerformerEditFromMerge(orig Performer, sources []uuid.UUID, inputArgs utils.ArgumentsQuery) (*PerformerEditData, error) {
	data, err := e.PerformerEditFromDiff(orig, inputArgs)
	if err != nil {
		return nil, err
	}
	data.MergeSources = sources

	return data, nil
}

func (e PerformerEditDetailsInput) PerformerEditFromCreate(inputArgs utils.ArgumentsQuery) (*PerformerEditData, error) {
	ret, err := e.PerformerEditFromDiff(Performer{}, inputArgs)
	if err != nil {
		return nil, err
	}

	return &PerformerEditData{
		New: ret.New,
	}, nil
}

func (e StudioEditDetailsInput) StudioEditFromDiff(orig Studio, inputArgs utils.ArgumentsQuery) (*StudioEditData, error) {
	newData := &StudioEdit{}
	oldData := &StudioEdit{}

	ed := editDiff{}
	if e.Name != nil || inputArgs.Field("name").IsNull() {
		oldData.Name, newData.Name = ed.string(&orig.Name, e.Name)
	}

	if e.ParentID != nil || inputArgs.Field("parent_id").IsNull() {
		oldData.ParentID, newData.ParentID = ed.nullUUID(orig.ParentStudioID, e.ParentID)
	}

	return &StudioEditData{
		New: newData,
		Old: oldData,
	}, nil
}

func (e StudioEditDetailsInput) StudioEditFromMerge(orig Studio, sources []uuid.UUID, inputArgs utils.ArgumentsQuery) (*StudioEditData, error) {
	data, err := e.StudioEditFromDiff(orig, inputArgs)
	data.MergeSources = sources

	return data, err
}

func (e StudioEditDetailsInput) StudioEditFromCreate() StudioEditData {
	newData := &StudioEdit{}

	ed := editDiff{}
	_, newData.Name = ed.string(nil, e.Name)
	_, newData.ParentID = ed.nullUUID(uuid.NullUUID{}, e.ParentID)

	return StudioEditData{
		New: newData,
	}
}

func (e SceneEditDetailsInput) SceneEditFromDiff(orig Scene, inputArgs utils.ArgumentsQuery) (*SceneEditData, error) {
	if err := ValidateFuzzyString(e.Date); err != nil {
		return nil, err
	}

	newData := &SceneEdit{}
	oldData := &SceneEdit{}

	ed := editDiff{}
	if e.Title != nil || inputArgs.Field("title").IsNull() {
		oldData.Title, newData.Title = ed.nullString(orig.Title, e.Title)
	}
	if e.Details != nil || inputArgs.Field("details").IsNull() {
		oldData.Details, newData.Details = ed.nullString(orig.Details, e.Details)
	}
	if e.Date != nil || inputArgs.Field("date").IsNull() {
		oldData.Date, newData.Date = ed.nullString(orig.Date, e.Date)
	}
	if e.StudioID != nil || inputArgs.Field("studio_id").IsNull() {
		oldData.StudioID, newData.StudioID = ed.nullUUID(orig.StudioID, e.StudioID)
	}
	if e.Duration != nil || inputArgs.Field("duration").IsNull() {
		oldData.Duration, newData.Duration = ed.nullInt64(orig.Duration, e.Duration)
	}
	if e.Director != nil || inputArgs.Field("director").IsNull() {
		oldData.Director, newData.Director = ed.nullString(orig.Director, e.Director)
	}
	if e.Code != nil || inputArgs.Field("code").IsNull() {
		oldData.Code, newData.Code = ed.nullString(orig.Code, e.Code)
	}

	return &SceneEditData{
		New: newData,
		Old: oldData,
	}, nil
}

func (e SceneEditDetailsInput) SceneEditFromMerge(orig Scene, sources []uuid.UUID, inputArgs utils.ArgumentsQuery) (*SceneEditData, error) {
	data, err := e.SceneEditFromDiff(orig, inputArgs)
	if err != nil {
		return nil, err
	}
	data.MergeSources = sources

	return data, nil
}

func (e SceneEditDetailsInput) SceneEditFromCreate(inputArgs utils.ArgumentsQuery) (*SceneEditData, error) {
	ret, err := e.SceneEditFromDiff(Scene{}, inputArgs)
	if err != nil {
		return nil, err
	}

	return &SceneEditData{
		New: ret.New,
	}, nil
}
