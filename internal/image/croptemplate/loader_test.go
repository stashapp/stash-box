package croptemplate

import (
	"slices"
	"testing"
)

// The guarantee the whole design rests on: the file a contributor downloads
// parses to the frame the edit form draws. If these ever diverge, two people
// cropping the same image to the same type get different frames
func TestLoaderBytesParseToTheTemplateServed(t *testing.T) {
	loader := NewLoader()

	for _, key := range loaderKeys(t) {
		t.Run(key, func(t *testing.T) {
			data, ok := loader.Bytes(key)
			if !ok {
				t.Fatal("no bytes")
			}
			downloaded, err := Parse(data)
			if err != nil {
				t.Fatalf("the served file does not parse: %v", err)
			}

			shown, ok := loader.Template(key)
			if !ok {
				t.Fatal("no template")
			}

			if downloaded.Width != shown.Width || downloaded.Height != shown.Height {
				t.Errorf("download is %dx%d but the overlay is %dx%d",
					downloaded.Width, downloaded.Height, shown.Width, shown.Height)
			}
			if !slices.Equal(downloaded.Guides, shown.Guides) {
				t.Errorf("download guides %+v, overlay %+v", downloaded.Guides, shown.Guides)
			}
		})
	}
}

// Keys reach Bytes from a URL. They are resolved against the parsed set rather
// than joined onto a path, so a traversal cannot name a file - this asserts
// that guard stays.
func TestLoaderBytesRefuseKeysThatNameNoTemplate(t *testing.T) {
	loader := NewLoader()

	for _, key := range []string{"", "..", "../secret", "/etc/passwd", "CROP_FACE/../../secret", "nope"} {
		t.Run(key, func(t *testing.T) {
			if _, ok := loader.Bytes(key); ok {
				t.Errorf("key %q served bytes", key)
			}
		})
	}
}

func loaderKeys(t *testing.T) []string {
	t.Helper()
	defaults, err := Defaults()
	if err != nil {
		t.Fatalf("Defaults: %v", err)
	}
	if len(defaults) == 0 {
		t.Fatal("no templates are shipped")
	}
	keys := make([]string, 0, len(defaults))
	for key := range defaults {
		keys = append(keys, key)
	}
	slices.Sort(keys)
	return keys
}
