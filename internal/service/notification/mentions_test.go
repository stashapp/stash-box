package notification

import (
	"reflect"
	"testing"

	"github.com/gofrs/uuid"
)

func TestExtractMentionedUserNames(t *testing.T) {
	tests := []struct {
		name string
		body string
		want []string
	}{
		{
			name: "bare mention",
			body: "hey @alice welcome",
			want: []string{"alice"},
		},
		{
			name: "quoted mention with space",
			body: `ping @"Alice Cooper" please`,
			want: []string{"Alice Cooper"},
		},
		{
			name: "ignores email-like",
			body: "user@example not a mention",
			want: nil,
		},
		{
			name: "dedupes case-insensitive",
			body: "@alice and @Alice",
			want: []string{"alice"},
		},
		{
			name: "preserves order",
			body: `@bob then @"Alice Cooper"`,
			want: []string{"bob", "Alice Cooper"},
		},
		{
			name: "skips inline code",
			body: "see `@alice` not a mention",
			want: nil,
		},
		{
			name: "skips fenced code",
			body: "```\n@alice\n```",
			want: nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ExtractMentionedUserNames(tc.body)
			if !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
		})
	}
}

func TestExtractMentionedUserIDs(t *testing.T) {
	a := uuid.Must(uuid.NewV4())
	b := uuid.Must(uuid.NewV4())

	tests := []struct {
		name string
		body string
		want []uuid.UUID
	}{
		{
			name: "single id",
			body: "hey @" + a.String() + " welcome",
			want: []uuid.UUID{a},
		},
		{
			name: "order preserved, dedup",
			body: "@" + b.String() + " and @" + a.String() + " and @" + b.String(),
			want: []uuid.UUID{b, a},
		},
		{
			name: "skips email-like and code",
			body: "user@" + a.String() + " and `@" + a.String() + "`",
			want: nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ExtractMentionedUserIDs(tc.body)
			if !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
		})
	}
}

func TestRewriteMentionsToIDs(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	lookup := map[string]string{
		"alice":        id.String(),
		"alice cooper": id.String(),
	}

	tests := []struct {
		name string
		body string
		want string
	}{
		{
			name: "bare match",
			body: "hey @alice",
			want: "hey @" + id.String(),
		},
		{
			name: "quoted match",
			body: `ping @"Alice Cooper" now`,
			want: "ping @" + id.String() + " now",
		},
		{
			name: "unknown name kept",
			body: "@bob unchanged",
			want: "@bob unchanged",
		},
		{
			name: "code preserved",
			body: "`@alice` and @alice",
			want: "`@alice` and @" + id.String(),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := RewriteMentionsToIDs(tc.body, lookup)
			if got != tc.want {
				t.Fatalf("got %q, want %q", got, tc.want)
			}
		})
	}
}
