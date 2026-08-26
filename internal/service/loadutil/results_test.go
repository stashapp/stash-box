package loadutil

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

type testValue struct {
	id    int
	value string
}

func TestOneHandlesFetchAndErrors(t *testing.T) {
	wantErr := errors.New("fetch failed")
	values, errs := One(
		[]int{1, 2},
		func([]int) ([]testValue, error) { return nil, wantErr },
		func(value testValue) int { return value.id },
		func(value testValue) string { return value.value },
	)

	assert.Nil(t, values)
	assert.Equal(t, []error{wantErr, wantErr}, errs)
}

func TestManySkipsFetchForEmptyKeys(t *testing.T) {
	called := false
	values, errs := Many(
		[]int{},
		func([]int) ([]testValue, error) { called = true; return nil, nil },
		func(value testValue) int { return value.id },
		func(value testValue) string { return value.value },
	)

	assert.False(t, called)
	assert.NotNil(t, values)
	assert.Empty(t, values)
	assert.Nil(t, errs)
}

func TestMatchByKey(t *testing.T) {
	values := []testValue{
		{id: 2, value: "two"},
		{id: 1, value: "old"},
		{id: 1, value: "one"},
	}

	result := matchByKey(
		[]int{1, 2, 1, 3},
		values,
		func(value testValue) int { return value.id },
		func(value testValue) string { return value.value },
	)

	assert.Equal(t, []string{"one", "two", "one", ""}, result)
}

func TestMatchByKeyEmpty(t *testing.T) {
	result := matchByKey(
		[]int{},
		[]testValue{},
		func(value testValue) int { return value.id },
		func(value testValue) string { return value.value },
	)

	assert.Empty(t, result)
	assert.NotNil(t, result)
}

func TestGroupByKey(t *testing.T) {
	values := []testValue{
		{id: 2, value: "two"},
		{id: 1, value: "one-a"},
		{id: 1, value: "one-b"},
	}

	result := groupByKey(
		[]int{1, 2, 1, 3},
		values,
		func(value testValue) int { return value.id },
		func(value testValue) string { return value.value },
	)

	assert.Equal(t, [][]string{{"one-a", "one-b"}, {"two"}, {"one-a", "one-b"}, nil}, result)
}
