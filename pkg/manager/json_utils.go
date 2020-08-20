package manager

import (
	"github.com/stashapp/stashdb/pkg/manager/jsonschema"
)

type jsonUtils struct{}

func (jp *jsonUtils) getMappings() (*jsonschema.Mappings, error) {
	return jsonschema.LoadMappingsFile(instance.Paths.JSON.MappingsFile)
}

func (jp *jsonUtils) saveMappings(mappings *jsonschema.Mappings) error {
	return jsonschema.SaveMappingsFile(instance.Paths.JSON.MappingsFile, mappings)
}

func (jp *jsonUtils) getPerformer(checksum string) (*jsonschema.Performer, error) {
	return jsonschema.LoadPerformerFile(instance.Paths.JSON.PerformerJSONPath(checksum))
}

func (jp *jsonUtils) savePerformer(checksum string, performer *jsonschema.Performer) error {
	return jsonschema.SavePerformerFile(instance.Paths.JSON.PerformerJSONPath(checksum), performer)
}
