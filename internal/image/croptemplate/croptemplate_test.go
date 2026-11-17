package croptemplate

import (
	"io/fs"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEveryShippedTemplateIsServed(t *testing.T) {
	entries, err := fs.ReadDir(files, templateDir)
	require.NoError(t, err)
	require.NotEmpty(t, entries)
	for _, entry := range entries {
		key := strings.TrimSuffix(entry.Name(), TemplateExt)
		template, ok := Lookup(key)
		assert.True(t, ok, key)
		assert.NotEmpty(t, template.Guides, key)
		data, ok := Bytes(key)
		assert.True(t, ok, key)
		assert.NotEmpty(t, data, key)
	}
}

func TestBytesRefuseKeysThatNameNoTemplate(t *testing.T) {
	for _, key := range []string{"", "..", "../secret", "/etc/passwd", "CROP_FACE/../../secret", "nope"} {
		_, ok := Bytes(key)
		assert.False(t, ok, key)
	}
}
