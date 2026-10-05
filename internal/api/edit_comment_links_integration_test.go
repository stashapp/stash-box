//go:build integration

package api_test

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// findCommentContaining returns the first comment whose text contains substr.
func findCommentContaining(comments []models.EditComment, substr string) *models.EditComment {
	for i := range comments {
		if strings.Contains(comments[i].Text, substr) {
			return &comments[i]
		}
	}
	return nil
}

func TestEditCommentLinksEntities(t *testing.T) {
	editor := asModify(t)

	// A real tag to reference, plus a non-existent UUID that should stay bare.
	tag, err := editor.createTestTag(nil)
	assert.NoError(t, err)
	tagID := tag.UUID()
	missingID := "00000000-0000-0000-0000-000000000000"

	edit, err := editor.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(t, err)

	// Reference the tag bare, an unknown UUID, one inside a URL, and one already
	// inside a markdown link.
	comment := fmt.Sprintf("dup of %s, unknown %s, see /tags/%s, link [%s](x)", tagID, missingID, tagID, tagID)
	_, err = editor.resolver.Mutation().EditComment(editor.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: comment,
	})
	assert.NoError(t, err)

	comments, err := editor.resolver.Edit().Comments(editor.ctx, edit)
	assert.NoError(t, err)
	stored := findCommentContaining(comments, "dup of")
	assert.NotNil(t, stored)

	// The bare UUID becomes a markdown link to the tag.
	assert.Contains(t, stored.Text, fmt.Sprintf("[%s](/tags/%s)", tagID, tagID))
	// An unresolvable UUID is left untouched.
	assert.Contains(t, stored.Text, fmt.Sprintf("unknown %s", missingID))
	assert.NotContains(t, stored.Text, fmt.Sprintf("[%s]", missingID))
	// A UUID already part of a URL is not linked again.
	assert.Contains(t, stored.Text, fmt.Sprintf("see /tags/%s", tagID))
	assert.NotContains(t, stored.Text, fmt.Sprintf("/tags/[%s]", tagID))
	// A UUID already inside a markdown link is left intact.
	assert.Contains(t, stored.Text, fmt.Sprintf("link [%s](x)", tagID))
}

func TestEditSubmissionCommentLinksEntities(t *testing.T) {
	editor := asModify(t)

	tag, err := editor.createTestTag(nil)
	assert.NoError(t, err)
	tagID := tag.UUID()

	submission := fmt.Sprintf("split from %s", tagID)
	edit, err := editor.createTestTagEdit(models.OperationEnumCreate, nil, &models.EditInput{
		Operation: models.OperationEnumCreate,
		Comment:   &submission,
	})
	assert.NoError(t, err)

	comments, err := editor.resolver.Edit().Comments(editor.ctx, edit)
	assert.NoError(t, err)
	stored := findCommentContaining(comments, "split from")
	assert.NotNil(t, stored)
	assert.Contains(t, stored.Text, fmt.Sprintf("[%s](/tags/%s)", tagID, tagID))
}
