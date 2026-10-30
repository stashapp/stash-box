// Package loadutil contains helpers for implementing batched service loaders.
package loadutil

// One executes a batch fetch and matches one fetched value to each input key.
func One[K comparable, V any, R any](keys []K, fetch func([]K) ([]V, error), key func(V) K, convert func(V) R) ([]R, []error) {
	if len(keys) == 0 {
		return make([]R, 0), nil
	}

	values, err := fetch(keys)
	if err != nil {
		return nil, repeatError(err, len(keys))
	}

	return matchByKey(keys, values, key, convert), make([]error, len(keys))
}

// Many executes a batch fetch and groups fetched values for each input key.
func Many[K comparable, V any, R any](keys []K, fetch func([]K) ([]V, error), key func(V) K, convert func(V) R) ([][]R, []error) {
	if len(keys) == 0 {
		return make([][]R, 0), nil
	}

	values, err := fetch(keys)
	if err != nil {
		return nil, repeatError(err, len(keys))
	}

	return groupByKey(keys, values, key, convert), make([]error, len(keys))
}

func repeatError(err error, size int) []error {
	errs := make([]error, size)
	for i := range errs {
		errs[i] = err
	}
	return errs
}

// matchByKey indexes values by key and returns them in the order of keys.
//
// Duplicate values are collapsed with the last value winning. Duplicate keys in
// the input are preserved, and keys without a matching value produce the zero
// value of R.
func matchByKey[K comparable, V any, R any](keys []K, values []V, key func(V) K, convert func(V) R) []R {
	byKey := make(map[K]R, len(values))
	for _, value := range values {
		byKey[key(value)] = convert(value)
	}

	result := make([]R, len(keys))
	for i, key := range keys {
		result[i] = byKey[key]
	}

	return result
}

// groupByKey groups values by key and returns the groups in the order of keys.
// The order of values within each group is preserved. Duplicate input keys are
// preserved, and keys without matching values produce nil groups.
func groupByKey[K comparable, V any, R any](keys []K, values []V, key func(V) K, convert func(V) R) [][]R {
	byKey := make(map[K][]R, len(keys))
	for _, value := range values {
		valueKey := key(value)
		byKey[valueKey] = append(byKey[valueKey], convert(value))
	}

	result := make([][]R, len(keys))
	for i, key := range keys {
		result[i] = byKey[key]
	}

	return result
}
