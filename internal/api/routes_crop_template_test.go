package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
)

func TestCropTemplateRoute(t *testing.T) {
	face, ok := croptemplate.Bytes("CROP_FACE")
	require.True(t, ok)

	for _, tc := range []struct {
		path   string
		status int
	}{
		{"/CROP_FACE", http.StatusOK},
		{"/CROP_FACE.psd", http.StatusOK},
		{"/CROP_NOSUCH", http.StatusNotFound},
		{"/VIEW_FRONT", http.StatusNotFound},
	} {
		t.Run(tc.path, func(t *testing.T) {
			res := httptest.NewRecorder()
			cropTemplateRoutes().ServeHTTP(res, httptest.NewRequestWithContext(context.Background(), http.MethodGet, tc.path, nil))
			assert.Equal(t, tc.status, res.Code)
			if tc.status != http.StatusOK {
				return
			}
			assert.Equal(t, face, res.Body.Bytes())
			assert.Equal(t, "image/vnd.adobe.photoshop", res.Header().Get("Content-Type"))
			assert.Equal(t, `attachment; filename="CROP_FACE.psd"`, res.Header().Get("Content-Disposition"))
		})
	}
}
