//go:build !unix

package image

// Crop on platforms without libvips: the exact complement of crop_unix.go's
// build tag, so every platform has one Crop and none has two -- unlike the
// resize pair, where unix and windows||darwin both claim darwin.
func Crop(data []byte, rect CropRect) ([]byte, error) {
	return cropFallback(data, rect)
}
