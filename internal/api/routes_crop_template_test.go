package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
)

// The route touches no database, so this is a plain test rather than an
// integration one. What it has to establish is the guarantee the whole design
// rests on: the file handed over is the file the overlay was parsed from, so a
// contributor cropping in their own editor and one cropping in the form are
// provably working to the same frame

func serve(t *testing.T, path string) *httptest.ResponseRecorder {
	t.Helper()

	res := httptest.NewRecorder()
	cropTemplateRoutes{templates: croptemplate.NewLoader()}.
		Routes().
		ServeHTTP(res, httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil))
	return res
}

func TestCropTemplateDownloadServesTheFileTheOverlayUses(t *testing.T) {
	res := serve(t, "/CROP_FACE")

	if res.Code != http.StatusOK {
		t.Fatalf("status %d, want 200", res.Code)
	}

	downloaded, err := croptemplate.Parse(res.Body.Bytes())
	if err != nil {
		t.Fatalf("the served file does not parse: %v", err)
	}

	shown, ok := croptemplate.NewLoader().Template("CROP_FACE")
	if !ok {
		t.Fatal("no template to compare against")
	}

	if downloaded.Width != shown.Width || downloaded.Height != shown.Height {
		t.Errorf("download is %dx%d but the overlay is %dx%d",
			downloaded.Width, downloaded.Height, shown.Width, shown.Height)
	}
	if len(downloaded.Guides) != len(shown.Guides) {
		t.Fatalf("download has %d guides, the overlay %d",
			len(downloaded.Guides), len(shown.Guides))
	}
	for i, guide := range downloaded.Guides {
		if guide != shown.Guides[i] {
			t.Errorf("guide %d differs: %+v vs %+v", i, guide, shown.Guides[i])
		}
	}
}

// Photoshop's registered type, and an attachment: this is a file to open in an
// editor, not something a browser should try to preview
func TestCropTemplateDownloadHeaders(t *testing.T) {
	res := serve(t, "/CROP_FACE")

	if got := res.Header().Get("Content-Type"); got != "image/vnd.adobe.photoshop" {
		t.Errorf("Content-Type %q", got)
	}
	if got := res.Header().Get("Content-Disposition"); got != `attachment; filename="CROP_FACE.psd"` {
		t.Errorf("Content-Disposition %q", got)
	}
}

// A link ending in .psd reads as a file; one that does not is easier to write.
// Both have to reach the same template
func TestCropTemplateDownloadAcceptsTheExtensionEitherWay(t *testing.T) {
	bare := serve(t, "/CROP_WIDE")
	suffixed := serve(t, "/CROP_WIDE.psd")

	if bare.Code != http.StatusOK || suffixed.Code != http.StatusOK {
		t.Fatalf("statuses %d and %d, want 200", bare.Code, suffixed.Code)
	}
	if bare.Body.Len() != suffixed.Body.Len() {
		t.Error("the two spellings served different files")
	}
}

func TestCropTemplateDownloadRefusesWhatItHasNoTemplateFor(t *testing.T) {
	for _, path := range []string{
		"/CROP_NOSUCH",
		// A real image type, with no frame of its own: nothing about which way
		// the subject faces says anything about the shape of the picture
		"/VIEW_FRONT",
	} {
		t.Run(path, func(t *testing.T) {
			if code := serve(t, path).Code; code != http.StatusNotFound {
				t.Errorf("status %d, want 404", code)
			}
		})
	}
}
