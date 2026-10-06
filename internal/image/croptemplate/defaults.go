package croptemplate

import (
	"embed"
)

// The built-in templates, one per Crop type, named for the image type key they
// belong to. Embedded so the feature works with no setup at all
//
//go:embed templates/*.psd
var defaultTemplates embed.FS

const templateDir = "templates"

// TemplateExt is the extension a template file carries
const TemplateExt = ".psd"

//go:generate go run ./gen

// Defaults is the built-in template geometry, generated offline from the
// embedded .psd files (see gen) rather than parsed at runtime: the files
// stay the single authoring artifact -- the bytes a contributor downloads --
// but the server links no PSD parser. TestLoaderBytesParseToTheTemplateServed
// re-parses every served file and fails if this table drifts from them.
//
// The error return is kept for the callers' sake; a generated table cannot
// fail to load.
func Defaults() (map[string]Template, error) {
	return builtinTemplates(), nil
}
