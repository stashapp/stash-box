package edit

import (
	"context"
	"strings"

	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/notification"
)

// normalizeMentions resolves @name / @"quoted name" tokens in the body to
// @<uuid> references using the database. Unmatched names are left intact so
// the user can see they didn't resolve. Lookup errors are returned; the
// caller should abort the write rather than persist un-normalized text.
// Only the first notification.MaxMentions distinct names are resolved; any
// additional mentions are left as plain @<name> text to limit notification
// spam from a single comment.
func normalizeMentions(ctx context.Context, q *queries.Queries, body string) (string, error) {
	names := notification.ExtractMentionedUserNames(body)
	if len(names) == 0 {
		return body, nil
	}
	if len(names) > notification.MaxMentions {
		names = names[:notification.MaxMentions]
	}
	users, err := q.FindUsersByNames(ctx, names)
	if err != nil {
		return body, err
	}
	if len(users) == 0 {
		return body, nil
	}
	lookup := make(map[string]string, len(users))
	for _, u := range users {
		lookup[strings.ToLower(u.Name)] = u.ID.String()
	}
	return notification.RewriteMentionsToIDs(body, lookup), nil
}
