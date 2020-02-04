package models

func (e TagEditDetailsInput) TagEditFromDiff(orig Tag) *TagEdit {
	ret := &TagEdit{}

	if e.Name != nil && *e.Name != orig.Name {
		newName := *e.Name
		ret.Name = &newName
	}

	if e.Description != nil && (!orig.Description.Valid || *e.Description != orig.Description.String) {
		newDesc := *e.Description
		ret.Description = &newDesc
	}

	return ret
}
