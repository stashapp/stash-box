// Package embedding provides an optional TwelveLabs Marengo client for
// computing content-based video/text embeddings. These 512-dimension vectors
// complement the existing perceptual-hash (PHASH) fingerprints: pHash matches
// near-identical encodes, while Marengo embeddings catch re-encoded, cropped,
// or otherwise visually-similar content that pHash misses, improving duplicate
// detection and similarity search.
//
// The integration is opt-in. It is only active when a TwelveLabs API key is
// configured; with no key configured the rest of the application is unaffected.
package embedding

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"time"
)

const (
	// defaultBaseURL is the TwelveLabs API base used when none is configured.
	defaultBaseURL = "https://api.twelvelabs.io/v1.3"
	// defaultModel is the Marengo embedding model. Marengo produces 512-dim
	// multimodal embeddings shared across text and video, so a text query can
	// be matched against video embeddings and vice versa.
	defaultModel = "marengo3.0"
	// EmbeddingDimensions is the fixed size of a Marengo embedding vector.
	EmbeddingDimensions = 512

	defaultTimeout = 60 * time.Second
)

// Client is a minimal TwelveLabs embedding client. The zero value is not
// usable; construct one with New.
type Client struct {
	apiKey     string
	model      string
	baseURL    string
	httpClient *http.Client
}

// New constructs a Client. apiKey is required. model and baseURL fall back to
// the Marengo defaults when empty.
func New(apiKey, model, baseURL string) *Client {
	if model == "" {
		model = defaultModel
	}
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		apiKey:     apiKey,
		model:      model,
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: defaultTimeout},
	}
}

// embedResponse mirrors the relevant fields of the /embed response. The API
// returns the vector under text_embedding.segments[].float.
type embedResponse struct {
	TextEmbedding struct {
		Segments []struct {
			Float []float32 `json:"float"`
		} `json:"segments"`
	} `json:"text_embedding"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// TextEmbedding returns the 512-dimension Marengo embedding for the given text.
// The resulting vector lives in the same space as video embeddings, so it can
// be compared directly (via Cosine) against indexed scene embeddings.
func (c *Client) TextEmbedding(ctx context.Context, text string) ([]float32, error) {
	if text == "" {
		return nil, fmt.Errorf("text must not be empty")
	}

	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	if err := w.WriteField("model_name", c.model); err != nil {
		return nil, fmt.Errorf("writing model_name field: %w", err)
	}
	if err := w.WriteField("text", text); err != nil {
		return nil, fmt.Errorf("writing text field: %w", err)
	}
	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("closing multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/embed", &body)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("calling TwelveLabs embed: %w", err)
	}
	defer resp.Body.Close()

	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var apiErr apiError
		if json.Unmarshal(payload, &apiErr) == nil && apiErr.Message != "" {
			return nil, fmt.Errorf("TwelveLabs embed failed (%d %s): %s", resp.StatusCode, apiErr.Code, apiErr.Message)
		}
		return nil, fmt.Errorf("TwelveLabs embed failed with status %d", resp.StatusCode)
	}

	return parseEmbedding(payload)
}

// parseEmbedding extracts the first segment's embedding from an /embed
// response body. Split out from TextEmbedding so it can be unit-tested without
// a network call.
func parseEmbedding(payload []byte) ([]float32, error) {
	var parsed embedResponse
	if err := json.Unmarshal(payload, &parsed); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}
	if len(parsed.TextEmbedding.Segments) == 0 {
		return nil, fmt.Errorf("response contained no embedding segments")
	}
	vec := parsed.TextEmbedding.Segments[0].Float
	if len(vec) == 0 {
		return nil, fmt.Errorf("embedding segment was empty")
	}
	return vec, nil
}

// Cosine returns the cosine similarity of two embeddings, in the range
// [-1, 1]; higher means more similar. It returns an error when the vectors
// differ in length or either has zero magnitude. This is the primary signal
// for ranking content similarity between scenes.
func Cosine(a, b []float32) (float64, error) {
	if len(a) != len(b) {
		return 0, fmt.Errorf("embedding length mismatch: %d != %d", len(a), len(b))
	}
	if len(a) == 0 {
		return 0, fmt.Errorf("embeddings must not be empty")
	}
	var dot, normA, normB float64
	for i := range a {
		av, bv := float64(a[i]), float64(b[i])
		dot += av * bv
		normA += av * av
		normB += bv * bv
	}
	if normA == 0 || normB == 0 {
		return 0, fmt.Errorf("embedding has zero magnitude")
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB)), nil
}
