package models

type MultiCriterionInput interface {
	Count() int
	GetModifier() CriterionModifier
}

func (i MultiIDCriterionInput) Count() int {
	return len(i.Value)
}

func (i MultiIDCriterionInput) GetModifier() CriterionModifier {
	return i.Modifier
}

func (i MultiStringCriterionInput) Count() int {
	return len(i.Value)
}

func (i MultiStringCriterionInput) GetModifier() CriterionModifier {
	return i.Modifier
}
