package utils

import (
	"encoding/json"
	"testing"
)

type findFieldTest struct {
	subjectJSON    string
	qualifiedField string
	expected       interface{}
	expectedBool   bool
}

var findFieldTests = []findFieldTest{
	{`{"foo": "bar"}`, "foo", "bar", true},
	{`{"foo": "bar"}`, "bar", nil, false},
	{`{"foo": "bar"}`, "foo.bar", nil, false},
	{`{"foo": null}`, "foo", nil, true},
	{`{"foo": {"bar": "baz"}}`, "foo.bar", "baz", true},
	{`{"foo": {"bar": "baz"}}`, "foo.baz", nil, false},
}

func TestFindField(t *testing.T) {
	for _, test := range findFieldTests {
		var m map[string]interface{}
		err := json.Unmarshal([]byte(test.subjectJSON), &m)
		if err != nil {
			t.Errorf("(%v) Unexpected error: %s", test, err.Error())
			continue
		}

		v, found := FindField(m, test.qualifiedField)

		if test.expectedBool != found {
			t.Errorf("found(%v,%v) = %v; want %v", test.subjectJSON, test.qualifiedField, found, test.expectedBool)
		}

		if test.expected != v {
			t.Errorf("value(%v,%v) = %v; want %v", test.subjectJSON, test.qualifiedField, v, test.expected)
		}
	}
}
