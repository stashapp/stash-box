package croptemplate

import (
	"path"
)

// Loader resolves a crop type to its template. Templates are embedded in the
// binary, so the feature works with no setup and there is nothing to configure
type Loader struct{}

// NewLoader returns a loader over the built-in templates
func NewLoader() *Loader {
	return &Loader{}
}

// Template returns the template for a crop type, and whether one exists
func (l *Loader) Template(key string) (Template, bool) {
	defaults, err := Defaults()
	if err != nil {
		return Template{}, false
	}
	template, ok := defaults[key]
	return template, ok
}

// Bytes returns the template file itself, for downloading: the same bytes the
// overlay was parsed from, not a rendering of them. That is the point of the
// templates being files: a contributor cropping in Photoshop against the
// download and one cropping in our form are working to the same frame, because
// there is only one artefact
func (l *Loader) Bytes(key string) ([]byte, bool) {
	// Looked up in the parsed set first, so a key that names no template can
	// never reach the filesystem path below
	if _, ok := l.Template(key); !ok {
		return nil, false
	}

	data, err := defaultTemplates.ReadFile(path.Join(templateDir, key+TemplateExt))
	if err != nil {
		return nil, false
	}
	return data, true
}
