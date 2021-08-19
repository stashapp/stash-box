package bulkimport

import (
	"encoding/csv"
	"io"
)

type csvParser struct{}

func (csvParser) parse(input io.Reader, fn processFn) error {
	reader := csv.NewReader(input)
	var header []string

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		if header == nil {
			header = record
		} else {
			dict := map[string]string{}
			for i := range header {
				dict[header[i]] = record[i]
			}
			if err := fn(dict); err != nil {
				return err
			}
		}
	}

	return nil
}
