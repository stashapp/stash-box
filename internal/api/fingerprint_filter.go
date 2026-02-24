package api

import "github.com/stashapp/stash-box/internal/models"

// filterMD5FingerprintInputs removes MD5 fingerprints from a slice.
func filterMD5FingerprintInputs(fps []models.FingerprintInput) []models.FingerprintInput {
	result := fps[:0]
	for _, fp := range fps {
		if fp.Algorithm != models.FingerprintAlgorithmMd5 {
			result = append(result, fp)
		}
	}
	return result
}

// filterMD5FingerprintQueryInputs removes MD5 fingerprints from nested slices.
func filterMD5FingerprintQueryInputs(fps [][]models.FingerprintQueryInput) [][]models.FingerprintQueryInput {
	for i, group := range fps {
		filtered := group[:0]
		for _, fp := range group {
			if fp.Algorithm != models.FingerprintAlgorithmMd5 {
				filtered = append(filtered, fp)
			}
		}
		fps[i] = filtered
	}
	return fps
}

// filterMD5FingerprintEditInputs removes MD5 fingerprints from a slice.
func filterMD5FingerprintEditInputs(fps []models.FingerprintEditInput) []models.FingerprintEditInput {
	result := fps[:0]
	for _, fp := range fps {
		if fp.Algorithm != models.FingerprintAlgorithmMd5 {
			result = append(result, fp)
		}
	}
	return result
}
