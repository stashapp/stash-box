package edit

import (
	"testing"

	"github.com/gofrs/uuid"
)

func mustUUID(t *testing.T, s string) uuid.UUID {
	t.Helper()
	id, err := uuid.FromString(s)
	if err != nil {
		t.Fatalf("invalid uuid %q: %v", s, err)
	}
	return id
}

func TestParseCommentUUIDs(t *testing.T) {
	a := "11111111-1111-1111-1111-111111111111"
	b := "22222222-2222-2222-2222-222222222222"

	tests := []struct {
		name string
		text string
		want []string
	}{
		{"none", "no uuids here", nil},
		{"bare", "dup of " + a, []string{a}},
		{"at start", a + " is a dup", []string{a}},
		{"trailing punctuation", "see " + a + ".", []string{a}},
		{"adjacent single space", a + " " + b, []string{a, b}},
		{"deduplicated", a + " and " + a, []string{a}},
		{"uppercase normalized", "ID 11111111-1111-1111-1111-11111111AAAA", []string{"11111111-1111-1111-1111-11111111aaaa"}},
		{"inside url skipped", "see /tags/" + a, nil},
		{"inside markdown link skipped", "[" + a + "](x)", nil},
		{"no separator skipped", "x" + a, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseCommentUUIDs(tt.text)
			if len(got) != len(tt.want) {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
			for i, id := range got {
				if id != mustUUID(t, tt.want[i]) {
					t.Errorf("index %d: got %s, want %s", i, id, tt.want[i])
				}
			}
		})
	}
}

func TestReplaceCommentUUIDs(t *testing.T) {
	a := "11111111-1111-1111-1111-111111111111"
	b := "22222222-2222-2222-2222-222222222222"

	paths := map[uuid.UUID]string{
		mustUUID(t, a): "/scenes/",
		mustUUID(t, b): "/performers/",
	}

	tests := []struct {
		name string
		text string
		want string
	}{
		{
			name: "bare uuid linked",
			text: "dup of " + a,
			want: "dup of [" + a + "](/scenes/" + a + ")",
		},
		{
			name: "uuid at start linked without leading space",
			text: a + " end",
			want: "[" + a + "](/scenes/" + a + ") end",
		},
		{
			name: "different types use different paths",
			text: a + " " + b,
			want: "[" + a + "](/scenes/" + a + ") [" + b + "](/performers/" + b + ")",
		},
		{
			name: "unresolved uuid left bare",
			text: "unknown 33333333-3333-3333-3333-333333333333",
			want: "unknown 33333333-3333-3333-3333-333333333333",
		},
		{
			name: "url not double linked",
			text: "see /scenes/" + a,
			want: "see /scenes/" + a,
		},
		{
			name: "existing markdown link untouched",
			text: "link [" + a + "](x)",
			want: "link [" + a + "](x)",
		},
		{
			name: "trailing punctuation preserved",
			text: "see " + a + ", ok",
			want: "see [" + a + "](/scenes/" + a + "), ok",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := replaceCommentUUIDs(tt.text, paths); got != tt.want {
				t.Errorf("got  %q\nwant %q", got, tt.want)
			}
		})
	}
}

func TestReplaceCommentUUIDsNoPaths(t *testing.T) {
	text := "dup of 11111111-1111-1111-1111-111111111111"
	if got := replaceCommentUUIDs(text, nil); got != text {
		t.Errorf("got %q, want unchanged %q", got, text)
	}
}
