package notification

import (
	"regexp"
	"strings"

	"github.com/gofrs/uuid"
)

// MaxMentions caps the number of unique @-mentions allowed per comment to
// keep notification spam in check.
const MaxMentions = 4

// mentionUUIDRegex matches stored @<uuid> tokens in normalized comment text.
// The leading boundary char must not be alphanumeric so things like
// `foo@<uuid>` don't accidentally match.
var mentionUUIDRegex = regexp.MustCompile(`(?:^|[^A-Za-z0-9_])@([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})`)

// ExtractMentionedUserIDs returns the unique UUIDs referenced as @<uuid>
// in the comment body, preserving the order of first occurrence and ignoring
// tokens inside inline/fenced code spans. Used on normalized (post-write)
// comment text.
func ExtractMentionedUserIDs(body string) []uuid.UUID {
	stripped := stripCode(body)
	matches := mentionUUIDRegex.FindAllStringSubmatch(stripped, -1)
	seen := make(map[uuid.UUID]struct{}, len(matches))
	var ids []uuid.UUID
	for _, m := range matches {
		id, err := uuid.FromString(m[1])
		if err != nil {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}
	return ids
}

// MentionToken describes an @name or @"quoted name" reference found in raw,
// user-typed comment text (pre-normalization).
type MentionToken struct {
	Start int
	End   int
	Name  string
}

// ScanMentionTokens walks the body and collects every editing-form mention
// (`@name` or `@"name with spaces"`) outside of inline/fenced code spans.
func ScanMentionTokens(body string) []MentionToken {
	var toks []MentionToken
	i := 0
	n := len(body)
	for i < n {
		if i+2 < n && body[i] == '`' && body[i+1] == '`' && body[i+2] == '`' {
			end := indexFrom(body, "```", i+3)
			if end == -1 {
				return toks
			}
			i = end + 3
			continue
		}
		if body[i] == '`' {
			end := indexFrom(body, "`", i+1)
			if end == -1 {
				return toks
			}
			i = end + 1
			continue
		}
		if body[i] == '@' {
			var prev byte
			if i > 0 {
				prev = body[i-1]
			}
			if i == 0 || !isWordChar(prev) {
				// Quoted form: @"any chars except quote"
				if i+1 < n && body[i+1] == '"' {
					rel := strings.IndexByte(body[i+2:], '"')
					if rel >= 0 {
						end := i + 2 + rel + 1
						toks = append(toks, MentionToken{Start: i, End: end, Name: body[i+2 : i+2+rel]})
						i = end
						continue
					}
				}
				// Bare form: @[A-Za-z0-9][A-Za-z0-9._-]*
				if i+1 < n && isAlphaNum(body[i+1]) {
					j := i + 2
					for j < n && isNameChar(body[j]) {
						j++
					}
					toks = append(toks, MentionToken{Start: i, End: j, Name: body[i+1 : j]})
					i = j
					continue
				}
			}
		}
		i++
	}
	return toks
}

// ExtractMentionedUserNames returns the unique @name / @"quoted name" tokens
// in the comment body. Names are returned in their original case; callers
// should resolve them to users with a case-insensitive lookup.
func ExtractMentionedUserNames(body string) []string {
	toks := ScanMentionTokens(body)
	if len(toks) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(toks))
	var out []string
	for _, t := range toks {
		key := strings.ToLower(t.Name)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, t.Name)
	}
	return out
}

// RewriteMentionsToIDs returns the body with each `@name` / `@"quoted name"`
// token whose lowercased name is in `lookup` replaced with `@<uuid>`. Tokens
// without a match are left as-is. Code spans are preserved verbatim.
func RewriteMentionsToIDs(body string, lookup map[string]string) string {
	toks := ScanMentionTokens(body)
	if len(toks) == 0 {
		return body
	}
	var b strings.Builder
	b.Grow(len(body))
	last := 0
	for _, t := range toks {
		b.WriteString(body[last:t.Start])
		if id, ok := lookup[strings.ToLower(t.Name)]; ok {
			b.WriteByte('@')
			b.WriteString(id)
		} else {
			b.WriteString(body[t.Start:t.End])
		}
		last = t.End
	}
	b.WriteString(body[last:])
	return b.String()
}

// stripCode removes fenced and inline code spans so mentions inside them
// don't trigger notifications.
func stripCode(s string) string {
	out := make([]byte, 0, len(s))
	i := 0
	for i < len(s) {
		if i+2 < len(s) && s[i] == '`' && s[i+1] == '`' && s[i+2] == '`' {
			end := indexFrom(s, "```", i+3)
			if end == -1 {
				return string(out)
			}
			i = end + 3
			continue
		}
		if s[i] == '`' {
			end := indexFrom(s, "`", i+1)
			if end == -1 {
				return string(out)
			}
			i = end + 1
			continue
		}
		out = append(out, s[i])
		i++
	}
	return string(out)
}

func indexFrom(s, sub string, from int) int {
	if from >= len(s) {
		return -1
	}
	for i := from; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

func isWordChar(b byte) bool {
	return isAlphaNum(b) || b == '_'
}

func isAlphaNum(b byte) bool {
	return (b >= 'A' && b <= 'Z') || (b >= 'a' && b <= 'z') || (b >= '0' && b <= '9')
}

func isNameChar(b byte) bool {
	return isAlphaNum(b) || b == '_' || b == '.' || b == '-'
}
