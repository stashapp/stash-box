package embedding

import (
	"context"
	"math"
	"os"
	"testing"
)

func TestParseEmbedding(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		want    []float32
		wantErr bool
	}{
		{
			name:    "valid",
			payload: `{"model_name":"marengo3.0","text_embedding":{"segments":[{"float":[0.1,-0.2,0.3]}]}}`,
			want:    []float32{0.1, -0.2, 0.3},
		},
		{
			name:    "no segments",
			payload: `{"text_embedding":{"segments":[]}}`,
			wantErr: true,
		},
		{
			name:    "empty segment",
			payload: `{"text_embedding":{"segments":[{"float":[]}]}}`,
			wantErr: true,
		},
		{
			name:    "malformed json",
			payload: `not json`,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseEmbedding([]byte(tt.payload))
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if len(got) != len(tt.want) {
				t.Fatalf("length %d != %d", len(got), len(tt.want))
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("index %d: %v != %v", i, got[i], tt.want[i])
				}
			}
		})
	}
}

func TestCosine(t *testing.T) {
	tests := []struct {
		name    string
		a, b    []float32
		want    float64
		wantErr bool
	}{
		{name: "identical", a: []float32{1, 0, 0}, b: []float32{1, 0, 0}, want: 1},
		{name: "orthogonal", a: []float32{1, 0}, b: []float32{0, 1}, want: 0},
		{name: "opposite", a: []float32{1, 1}, b: []float32{-1, -1}, want: -1},
		{name: "length mismatch", a: []float32{1, 0}, b: []float32{1}, wantErr: true},
		{name: "empty", a: []float32{}, b: []float32{}, wantErr: true},
		{name: "zero magnitude", a: []float32{0, 0}, b: []float32{1, 1}, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Cosine(tt.a, tt.b)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if math.Abs(got-tt.want) > 1e-6 {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

// TestTextEmbeddingLive hits the real TwelveLabs API. It is skipped unless
// TWELVELABS_API_KEY is set, so it never runs in CI without credentials.
func TestTextEmbeddingLive(t *testing.T) {
	apiKey := os.Getenv("TWELVELABS_API_KEY")
	if apiKey == "" {
		t.Skip("TWELVELABS_API_KEY not set; skipping live embedding test")
	}

	c := New(apiKey, "", "")
	vec, err := c.TextEmbedding(context.Background(), "a person walking on a beach at sunset")
	if err != nil {
		t.Fatalf("TextEmbedding failed: %v", err)
	}
	if len(vec) != EmbeddingDimensions {
		t.Fatalf("expected %d dimensions, got %d", EmbeddingDimensions, len(vec))
	}

	// A self-similarity sanity check on the cosine helper against a live vector.
	sim, err := Cosine(vec, vec)
	if err != nil {
		t.Fatalf("Cosine failed: %v", err)
	}
	if math.Abs(sim-1) > 1e-6 {
		t.Errorf("self-similarity should be 1, got %v", sim)
	}
}
