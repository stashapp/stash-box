package bulkimport

import (
	"fmt"
	"io"

	"github.com/stashapp/stash-box/pkg/models"
)

type processFn func(row map[string]string) error

type importFileReader interface {
	parse(file io.Reader, fn processFn) error
}

func readImportData(repo models.Repo, t models.ImportDataType, file io.Reader, fn processFn) error {
	var r importFileReader

	switch t {
	case models.ImportDataTypeCsv:
		r = csvParser{}
	default:
		return fmt.Errorf("unknown type: %s", t.String())
	}

	if err := r.parse(file, fn); err != nil {
		return err
	}

	return nil
}
