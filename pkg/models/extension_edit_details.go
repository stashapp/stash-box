package models

func (e TagEditDetailsInput) TagEditFromDiff(orig Tag) (TagEditData) {
	newData := &TagEdit{}
	oldData := &TagEdit{}

	if e.Name != nil && *e.Name != orig.Name {
		newName := *e.Name
		newData.Name = &newName
        oldData.Name = &orig.Name
	}

	if e.Description != nil && (!orig.Description.Valid || *e.Description != orig.Description.String) {
		newDesc := *e.Description
		newData.Description = &newDesc
		oldData.Description = &orig.Description.String
	}

    return TagEditData {
        New: newData,
        Old: oldData,
    }
}

func (e TagEditDetailsInput) TagEditFromMerge(orig Tag, sources []string) (TagEditData) {
    data := e.TagEditFromDiff(orig)
    data.MergeSources = sources

    return data
}

func (e TagEditDetailsInput) TagEditFromCreate() (TagEditData) {
	newData := &TagEdit{}

	if e.Name != nil {
		newName := *e.Name
		newData.Name = &newName
	}

	if e.Description != nil {
		newDesc := *e.Description
		newData.Description = &newDesc
    }

    return TagEditData {
        New: newData,
    }
}
