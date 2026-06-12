package edit

import (
	"context"
	"regexp"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// Matches a whitespace-delimited UUID. Requiring leading whitespace (or the
// start of the string) leaves UUIDs that are already part of a link or URL
// (e.g. [uuid](id) or /tags/uuid) untouched. The trailing \b is non-consuming
// so adjacent UUIDs separated by a single space are both matched.
var commentUUIDRe = regexp.MustCompile(`(?i)(?:^|\s)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`)

// Frontend path each entity type is reachable at.
var entityTypePaths = map[string]string{
	models.TargetTypeEnumPerformer.String(): "/performers/",
	models.TargetTypeEnumScene.String():     "/scenes/",
	models.TargetTypeEnumStudio.String():    "/studios/",
	models.TargetTypeEnumTag.String():       "/tags/",
}

// parseCommentUUIDs returns the distinct whitespace-delimited UUIDs in text.
func parseCommentUUIDs(text string) []uuid.UUID {
	matches := commentUUIDRe.FindAllString(text, -1)
	ids := make([]uuid.UUID, 0, len(matches))
	seen := make(map[uuid.UUID]struct{})
	for _, m := range matches {
		id, err := uuid.FromString(strings.TrimSpace(m))
		if err != nil {
			continue
		}
		if _, ok := seen[id]; !ok {
			seen[id] = struct{}{}
			ids = append(ids, id)
		}
	}
	return ids
}

// replaceCommentUUIDs rewrites each UUID found in paths into a markdown link to
// the given path, leaving everything else untouched.
func replaceCommentUUIDs(text string, paths map[uuid.UUID]string) string {
	if len(paths) == 0 {
		return text
	}
	return commentUUIDRe.ReplaceAllStringFunc(text, func(match string) string {
		raw := strings.TrimSpace(match)
		id, err := uuid.FromString(raw)
		if err != nil {
			return match
		}
		path, ok := paths[id]
		if !ok {
			return match
		}
		// Preserve the leading whitespace consumed by the pattern.
		return match[:len(match)-len(raw)] + "[" + raw + "](" + path + raw + ")"
	})
}

// linkCommentEntities rewrites bare UUIDs in a comment into markdown links that
// point to the entity they identify.
func linkCommentEntities(ctx context.Context, q *queries.Queries, text string) (string, error) {
	ids := parseCommentUUIDs(text)
	if len(ids) == 0 {
		return text, nil
	}

	rows, err := q.ResolveEntityTypes(ctx, ids)
	if err != nil {
		return text, err
	}

	paths := make(map[uuid.UUID]string, len(rows))
	for _, row := range rows {
		if path, ok := entityTypePaths[row.EntityType]; ok {
			paths[row.ID] = path
		}
	}

	return replaceCommentUUIDs(text, paths), nil
}
