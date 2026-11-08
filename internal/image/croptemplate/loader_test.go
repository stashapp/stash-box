package croptemplate_test

import (
	"slices"
	"testing"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/internal/image/croptemplate/psdparse"
)

// The guarantee the whole design rests on: the file a contributor downloads
// parses to the frame the edit form draws. Doubly load-bearing now that the
// geometry ships as a generated table: this is the drift test that fails when
// a template file changes without go generate being re-run
func TestLoaderBytesParseToTheTemplateServed(t *testing.T) {
	loader := croptemplate.NewLoader()

	for _, key := range loaderKeys(t) {
		t.Run(key, func(t *testing.T) {
			data, ok := loader.Bytes(key)
			if !ok {
				t.Fatal("no bytes")
			}
			downloaded, err := psdparse.Parse(data)
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
	loader := croptemplate.NewLoader()

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
	defaults, err := croptemplate.Defaults()
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
