package edit

import "encoding/json"

// computeEditDataDiff computes a minimal diff between old and new edit data
func computeEditDataDiff(oldData, newData json.RawMessage) (json.RawMessage, error) {
	var oldMap, newMap map[string]any
	if err := json.Unmarshal(oldData, &oldMap); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(newData, &newMap); err != nil {
		return nil, err
	}

	diff := make(map[string]any)
	computeMapDiff(oldMap, newMap, diff)

	if len(diff) == 0 {
		return json.RawMessage("{}"), nil
	}

	return json.Marshal(diff)
}

// computeMapDiff recursively computes differences between two maps
func computeMapDiff(oldMap, newMap map[string]any, diff map[string]any) {
	// Check for changed or added fields in newMap
	for key, newVal := range newMap {
		oldVal, exists := oldMap[key]
		if !exists {
			// Field added
			diff[key] = map[string]any{"added": newVal}
			continue
		}

		// Check if both are maps for recursive comparison
		oldMapVal, oldIsMap := oldVal.(map[string]any)
		newMapVal, newIsMap := newVal.(map[string]any)
		if oldIsMap && newIsMap {
			subDiff := make(map[string]any)
			computeMapDiff(oldMapVal, newMapVal, subDiff)
			if len(subDiff) > 0 {
				diff[key] = subDiff
			}
			continue
		}

		// Check if both are arrays
		oldArr, oldIsArr := oldVal.([]any)
		newArr, newIsArr := newVal.([]any)
		if oldIsArr && newIsArr {
			arrayDiff := computeArrayDiff(oldArr, newArr)
			if arrayDiff != nil {
				diff[key] = arrayDiff
			}
			continue
		}

		// Compare values using JSON marshaling for reliable comparison
		oldJSON, _ := json.Marshal(oldVal)
		newJSON, _ := json.Marshal(newVal)
		if string(oldJSON) != string(newJSON) {
			diff[key] = map[string]any{"old": oldVal, "new": newVal}
		}
	}

	// Check for removed fields
	for key, oldVal := range oldMap {
		if _, exists := newMap[key]; !exists {
			diff[key] = map[string]any{"removed": oldVal}
		}
	}
}

// computeArrayDiff computes the difference between two arrays
// Returns nil if arrays are identical
func computeArrayDiff(oldArr, newArr []any) map[string]any {
	// Convert arrays to sets of JSON strings for comparison
	oldSet := make(map[string]any)
	newSet := make(map[string]any)

	for _, v := range oldArr {
		key := getArrayElementKey(v)
		oldSet[key] = v
	}
	for _, v := range newArr {
		key := getArrayElementKey(v)
		newSet[key] = v
	}

	var added, removed []any

	// Find added elements (in new but not in old)
	for key, v := range newSet {
		if _, exists := oldSet[key]; !exists {
			added = append(added, v)
		}
	}

	// Find removed elements (in old but not in new)
	for key, v := range oldSet {
		if _, exists := newSet[key]; !exists {
			removed = append(removed, v)
		}
	}

	if len(added) == 0 && len(removed) == 0 {
		return nil
	}

	result := make(map[string]any)
	if len(added) > 0 {
		result["added"] = added
	}
	if len(removed) > 0 {
		result["removed"] = removed
	}
	return result
}

// getArrayElementKey returns a unique key for an array element
// For objects, uses id/url/hash fields if present, otherwise JSON representation
// For primitives, uses the string representation
func getArrayElementKey(v any) string {
	switch val := v.(type) {
	case map[string]any:
		// Try common identifier fields
		if id, ok := val["id"].(string); ok {
			return id
		}
		if url, ok := val["url"].(string); ok {
			return url
		}
		if hash, ok := val["hash"].(string); ok {
			return hash
		}
		// Fall back to JSON representation
		b, _ := json.Marshal(val)
		return string(b)
	case string:
		return val
	default:
		b, _ := json.Marshal(v)
		return string(b)
	}
}
