package edit

import (
	"errors"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"
)

// InputSpecifiedFunc is function that returns true if the qualified field name
// was specified in the input. Used to distinguish between nil/empty fields and
// unspecified fields
type InputSpecifiedFunc func(qualifiedField string) bool

func ModifyTagEdit(tx *sqlx.Tx, edit *models.Edit, input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := models.NewTagQueryBuilder(tx)

	// get the existing tag
	tagID, _ := uuid.FromString(*input.Edit.ID)
	tag, err := tqb.Find(tagID)

	if err != nil {
		return err
	}

	if tag == nil {
		return errors.New("tag with id " + tagID.String() + " not found")
	}

	// perform a diff against the input and the current object
	tagEdit := input.Details.TagEditFromDiff(*tag)

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		aliases, err := tqb.GetAliases(tagID)

		if err != nil {
			return err
		}

		tagEdit.AddedAliases, tagEdit.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases)
	}

	return edit.SetData(tagEdit)
}
