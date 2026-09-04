package croptemplate

import (
	"embed"
	"fmt"
	"path"
	"strings"
	"sync"
)

// The built-in templates, one per Crop type, named for the image type key they
// belong to. Embedded so the feature works with no setup at all
//
//go:embed templates/*.psd
var defaultTemplates embed.FS

const templateDir = "templates"

// TemplateExt is the extension a template file carries
const TemplateExt = ".psd"

// Defaults parses the embedded templates, once
//
// An error means a file that shipped in the binary does not parse, which is a
// build fault: the tests parse every one of them and check its guides against
// the documented geometry, so this cannot reach a release
var Defaults = sync.OnceValues(func() (map[string]Template, error) {
	entries, err := defaultTemplates.ReadDir(templateDir)
	if err != nil {
		return nil, err
	}

	out := make(map[string]Template, len(entries))
	for _, entry := range entries {
		name := entry.Name()
		data, err := defaultTemplates.ReadFile(path.Join(templateDir, name))
		if err != nil {
			return nil, err
		}

		template, err := Parse(data)
		if err != nil {
			return nil, fmt.Errorf("built-in template %s: %w", name, err)
		}
		out[strings.TrimSuffix(name, TemplateExt)] = template
	}

	return out, nil
})
