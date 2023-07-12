package models

type MultiCriterionInput interface {
	Count() int
	GetValues() []interface{}
	GetModifier() CriterionModifier
}

func (i MultiIDCriterionInput) Count() int {
	return len(i.Value)
}

func (i MultiIDCriterionInput) GetValues() []interface{} {
	args := make([]interface{}, len(i.Value))
	for index := range i.Value {
		args[index] = i.Value[index]
	}
	return args
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

func (i MultiStringCriterionInput) GetValues() []interface{} {
	args := make([]interface{}, len(i.Value))
	for index := range i.Value {
		args[index] = i.Value[index]
	}
	return args
}
