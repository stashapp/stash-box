package models

import (
	"database/sql"
	"errors"
	"fmt"
	"reflect"
)

func CopyFull(target interface{}, source interface{}) error {
	// copy all fields from source onto target
	// nil values are set, where possible

	// target must be pointer
	if reflect.TypeOf(target).Kind() != reflect.Ptr {
		return errors.New("target must be pointer")
	}

	targetValue := reflect.ValueOf(target)
	targetType := targetValue.Elem().Type()

	// source must be value
	if reflect.TypeOf(source).Kind() == reflect.Ptr {
		return errors.New("source must be value")
	}

	sourceValue := reflect.ValueOf(source)
	sourceType := sourceValue.Type()

	for i := 0; i < targetValue.Elem().NumField(); i++ {
		field := targetType.Field(i)

		sourceField, sourceHasField := sourceType.FieldByName(field.Name)

		if !sourceHasField {
			// no direct conversion
			continue
		}

		sourceFieldValue := sourceValue.FieldByName(field.Name)
		targetFieldValue := targetValue.Elem().FieldByName(field.Name)

		if field.Type == sourceField.Type {
			// direct copy
			targetFieldValue.Set(sourceFieldValue)
		} else if reflect.PtrTo(field.Type) == sourceField.Type {
			// source field is pointer, target field is value
			// if nil, then set to zero value, otherwise copy
			if sourceFieldValue.IsNil() {
				targetFieldValue.Set(reflect.Zero(field.Type))
			} else {
				targetFieldValue.Set(sourceFieldValue.Elem())
			}
		} else {
			// perform translation for limited number of fields
			translateField(targetFieldValue, sourceFieldValue)
		}
	}

	return nil
}

func translateField(targetFieldValue reflect.Value, sourceFieldValue reflect.Value) {
	targetFieldType := targetFieldValue.Type()
	sourceFieldType := sourceFieldValue.Type()

	if sourceFieldType.Kind() == reflect.Ptr {
		if sourceFieldValue.IsNil() {
			targetFieldValue.Set(reflect.Zero(targetFieldType))
			return
		}

		sourceFieldValue = sourceFieldValue.Elem()
		sourceFieldType = sourceFieldType.Elem()
	}

	if targetFieldType == reflect.TypeOf(sql.NullString{}) && sourceFieldType == reflect.TypeOf(string("")) {
		output := sql.NullString{String: sourceFieldValue.String(), Valid: true}
		targetFieldValue.Set(reflect.ValueOf(output))
	}

	if targetFieldType == reflect.TypeOf(sql.NullInt64{}) && sourceFieldType.ConvertibleTo(reflect.TypeOf(int(0))) {
		output := sql.NullInt64{Int64: sourceFieldValue.Int(), Valid: true}
		targetFieldValue.Set(reflect.ValueOf(output))
	}

	// cover enum -> nullstring conversion
	if targetFieldType == reflect.TypeOf(sql.NullString{}) && sourceFieldType.Implements(reflect.TypeOf((*fmt.Stringer)(nil)).Elem()) {
		output := sql.NullString{String: sourceFieldValue.String(), Valid: true}
		targetFieldValue.Set(reflect.ValueOf(output))
	}
}
