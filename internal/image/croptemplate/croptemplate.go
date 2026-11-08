// Package croptemplate reads the crop frames and guides out of the embedded Photoshop templates
package croptemplate

import (
	"embed"
	"fmt"
	"io/fs"
	"path"
	"strings"
)

//go:embed templates/*.psd
var files embed.FS

const templateDir = "templates"

// TemplateExt is the extension a template file carries
const TemplateExt = ".psd"

var templates = parseAll()

func parseAll() map[string]Template {
	entries, err := fs.ReadDir(files, templateDir)
	if err != nil {
		panic(err)
	}
	parsed := make(map[string]Template, len(entries))
	for _, entry := range entries {
		data, err := files.ReadFile(path.Join(templateDir, entry.Name()))
		if err != nil {
			panic(err)
		}
		template, err := Parse(data)
		if err != nil {
			panic(fmt.Sprintf("crop template %s: %v", entry.Name(), err))
		}
		parsed[strings.TrimSuffix(entry.Name(), TemplateExt)] = template
	}
	return parsed
}

// Lookup returns the template for a crop type, and whether one exists
func Lookup(key string) (Template, bool) {
	template, ok := templates[key]
	return template, ok
}

// Bytes returns the template file itself, the same bytes the guides were parsed from
func Bytes(key string) ([]byte, bool) {
	// Resolved against the parsed set first, so a key can never name a path
	if _, ok := templates[key]; !ok {
		return nil, false
	}
	data, err := files.ReadFile(path.Join(templateDir, key+TemplateExt))
	return data, err == nil
}
