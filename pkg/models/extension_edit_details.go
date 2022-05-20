package models

import (
	"github.com/gofrs/uuid"
)

func (e TagEditDetailsInput) TagEditFromDiff(orig Tag) TagEditData {
	newData := &TagEdit{}
	oldData := &TagEdit{}

	ed := editDiff{}
	oldData.Name, newData.Name = ed.string(&orig.Name, e.Name)
	oldData.Description, newData.Description = ed.nullString(orig.Description, e.Description)
	oldData.CategoryID, newData.CategoryID = ed.nullUUID(orig.CategoryID, e.CategoryID)

	return TagEditData{
		New: newData,
		Old: oldData,
	}
}

func (e TagEditDetailsInput) TagEditFromMerge(orig Tag, sources []uuid.UUID) TagEditData {
	data := e.TagEditFromDiff(orig)
	data.MergeSources = sources

	return data
}

func (e TagEditDetailsInput) TagEditFromCreate() TagEditData {
	ret := e.TagEditFromDiff(Tag{})

	return TagEditData{
		New: ret.New,
	}
}

func (e PerformerEditDetailsInput) PerformerEditFromDiff(orig Performer) (*PerformerEditData, error) {
	if err := ValidateFuzzyString(e.Birthdate); err != nil {
		return nil, err
	}

	newData := &PerformerEdit{}
	oldData := &PerformerEdit{}

	ed := editDiff{}
	oldData.Name, newData.Name = ed.string(&orig.Name, e.Name)
	oldData.Disambiguation, newData.Disambiguation = ed.nullString(orig.Disambiguation, e.Disambiguation)
	oldData.Gender, newData.Gender = ed.nullStringEnum(orig.Gender, e.Gender)
	oldData.Birthdate, oldData.BirthdateAccuracy, newData.Birthdate, newData.BirthdateAccuracy = ed.fuzzyDate(orig.Birthdate, orig.BirthdateAccuracy, e.Birthdate)
	oldData.Ethnicity, newData.Ethnicity = ed.nullStringEnum(orig.Ethnicity, e.Ethnicity)
	oldData.Country, newData.Country = ed.nullString(orig.Country, e.Country)
	oldData.EyeColor, newData.EyeColor = ed.nullStringEnum(orig.EyeColor, e.EyeColor)
	oldData.HairColor, newData.HairColor = ed.nullStringEnum(orig.HairColor, e.HairColor)
	oldData.Height, newData.Height = ed.nullInt64(orig.Height, e.Height)

	oldData.CupSize, newData.CupSize = ed.nullString(orig.CupSize, e.CupSize)
	oldData.BandSize, newData.BandSize = ed.nullInt64(orig.BandSize, e.BandSize)
	oldData.WaistSize, newData.WaistSize = ed.nullInt64(orig.WaistSize, e.WaistSize)
	oldData.HipSize, newData.HipSize = ed.nullInt64(orig.HipSize, e.HipSize)

	oldData.BreastType, newData.BreastType = ed.nullStringEnum(orig.BreastType, e.BreastType)
	oldData.CareerStartYear, newData.CareerStartYear = ed.nullInt64(orig.CareerStartYear, e.CareerStartYear)
	oldData.CareerEndYear, newData.CareerEndYear = ed.nullInt64(orig.CareerEndYear, e.CareerEndYear)

	return &PerformerEditData{
		New: newData,
		Old: oldData,
	}, nil
}

func (e PerformerEditDetailsInput) PerformerEditFromMerge(orig Performer, sources []uuid.UUID) (*PerformerEditData, error) {
	data, err := e.PerformerEditFromDiff(orig)
	if err != nil {
		return nil, err
	}
	data.MergeSources = sources

	return data, nil
}

func (e PerformerEditDetailsInput) PerformerEditFromCreate() (*PerformerEditData, error) {
	ret, err := e.PerformerEditFromDiff(Performer{})
	if err != nil {
		return nil, err
	}

	return &PerformerEditData{
		New: ret.New,
	}, nil
}

func (e StudioEditDetailsInput) StudioEditFromDiff(orig Studio) StudioEditData {
	newData := &StudioEdit{}
	oldData := &StudioEdit{}

	ed := editDiff{}
	oldData.Name, newData.Name = ed.string(&orig.Name, e.Name)
	oldData.ParentID, newData.ParentID = ed.nullUUID(orig.ParentStudioID, e.ParentID)

	return StudioEditData{
		New: newData,
		Old: oldData,
	}
}

func (e StudioEditDetailsInput) StudioEditFromMerge(orig Studio, sources []uuid.UUID) StudioEditData {
	data := e.StudioEditFromDiff(orig)
	data.MergeSources = sources

	return data
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

func (e SceneEditDetailsInput) SceneEditFromDiff(orig Scene) (*SceneEditData, error) {
	if err := ValidateFuzzyString(e.Date); err != nil {
		return nil, err
	}

	newData := &SceneEdit{}
	oldData := &SceneEdit{}

	ed := editDiff{}
	oldData.Title, newData.Title = ed.nullString(orig.Title, e.Title)
	oldData.Details, newData.Details = ed.nullString(orig.Details, e.Details)
	oldData.Date, oldData.DateAccuracy, newData.Date, newData.DateAccuracy = ed.fuzzyDate(orig.Date, orig.DateAccuracy, e.Date)
	oldData.StudioID, newData.StudioID = ed.nullUUID(orig.StudioID, e.StudioID)
	oldData.Duration, newData.Duration = ed.nullInt64(orig.Duration, e.Duration)
	oldData.Director, newData.Director = ed.nullString(orig.Director, e.Director)
	oldData.Code, newData.Code = ed.nullString(orig.Code, e.Code)

	return &SceneEditData{
		New: newData,
		Old: oldData,
	}, nil
}

func (e SceneEditDetailsInput) SceneEditFromMerge(orig Scene, sources []uuid.UUID) (*SceneEditData, error) {
	data, err := e.SceneEditFromDiff(orig)
	if err != nil {
		return nil, err
	}
	data.MergeSources = sources

	return data, nil
}

func (e SceneEditDetailsInput) SceneEditFromCreate() (*SceneEditData, error) {
	ret, err := e.SceneEditFromDiff(Scene{})
	if err != nil {
		return nil, err
	}

	return &SceneEditData{
		New: ret.New,
	}, nil
}
