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

func (e PerformerEditDetailsInput) PerformerEditFromDiff(orig Performer) PerformerEditData {
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

	measurements := e.Measurements
	if measurements == nil {
		measurements = &MeasurementsInput{}
	}

	oldData.CupSize, newData.CupSize = ed.nullString(orig.CupSize, measurements.CupSize)
	oldData.BandSize, newData.BandSize = ed.nullInt64(orig.BandSize, measurements.BandSize)
	oldData.WaistSize, newData.WaistSize = ed.nullInt64(orig.WaistSize, measurements.Waist)
	oldData.HipSize, newData.HipSize = ed.nullInt64(orig.HipSize, measurements.Hip)

	oldData.BreastType, newData.BreastType = ed.nullStringEnum(orig.BreastType, e.BreastType)
	oldData.CareerStartYear, newData.CareerStartYear = ed.nullInt64(orig.CareerStartYear, e.CareerStartYear)
	oldData.CareerEndYear, newData.CareerEndYear = ed.nullInt64(orig.CareerEndYear, e.CareerEndYear)

	return PerformerEditData{
		New: newData,
		Old: oldData,
	}
}

func (e PerformerEditDetailsInput) PerformerEditFromMerge(orig Performer, sources []uuid.UUID) PerformerEditData {
	data := e.PerformerEditFromDiff(orig)
	data.MergeSources = sources

	return data
}

func (e PerformerEditDetailsInput) PerformerEditFromCreate() PerformerEditData {
	ret := e.PerformerEditFromDiff(Performer{})

	return PerformerEditData{
		New: ret.New,
	}
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

func (e SceneEditDetailsInput) SceneEditFromDiff(orig Scene) SceneEditData {
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

	return SceneEditData{
		New: newData,
		Old: oldData,
	}
}

func (e SceneEditDetailsInput) SceneEditFromMerge(orig Scene, sources []uuid.UUID) SceneEditData {
	data := e.SceneEditFromDiff(orig)
	data.MergeSources = sources

	return data
}

func (e SceneEditDetailsInput) SceneEditFromCreate() SceneEditData {
	ret := e.SceneEditFromDiff(Scene{})

	return SceneEditData{
		New: ret.New,
	}
}

type EditSliceValue interface {
	ID() string
}

type EditSlice interface {
	Each(fn func(interface{}))
	EachPtr(fn func(interface{}))
	Add(o interface{})
	Remove(v string)
}

func ProcessSlice(current EditSlice, added EditSlice, removed EditSlice, entityType string) {
	idMap := map[string]bool{}
	current.Each(func(v interface{}) {
		idMap[v.(EditSliceValue).ID()] = true
	})

	removed.Each(func(v interface{}) {
		id := v.(EditSliceValue).ID()
		if idMap[id] {
			current.Remove(id)
			idMap[id] = false
		}
	})

	added.EachPtr(func(v interface{}) {
		id := v.(EditSliceValue).ID()
		if !idMap[id] {
			current.Add(v)
			idMap[id] = true
		}
	})
}
