package croptemplate

import (
	"encoding/binary"
	"errors"
	"math"
	"testing"
)

// Fixtures are assembled here rather than committed as files. A binary
// fixture cannot be reviewed, and one built by hand would only prove the
// parser agrees with whatever this package already believes. The committed
// templates are checked against their documented percentages separately, which
// is where a real Photoshop file earns its place in the tests.
//
// Everything the file format dictates -- the signatures, the guides resource
// ID, the 1/32 px fixed point -- is written out as a literal below rather than
// taken from the constants in psd.go. A fixture built from the constant it is
// meant to be checking agrees with any value of it, so the mutation that
// matters most, getting one of these numbers wrong, would survive.

type rawGuide struct {
	// location is in 1/32 px, as stored.
	location uint32
	axis     byte
}

const (
	rawVertical   = 0
	rawHorizontal = 1
)

// px converts pixels to the 1/32 px units a guide is stored in.
func px(n int) uint32 { return uint32(n) * 32 }

// guidesResourceID is "Grid and guides information".
const guidesResourceID = 1032

// faceGuides is the real geometry of the corpus Face template on an 800x1200
// canvas: quarters across, and hair, eye line and chin down. Stored in
// creation order, which is not sorted -- that is the point of one of the tests
// below.
var faceGuides = []rawGuide{
	{px(400), rawVertical},
	{px(600), rawVertical},
	{px(200), rawVertical},
	{px(30), rawHorizontal},
	{px(924), rawHorizontal},
	{px(510), rawHorizontal},
	{px(12), rawVertical},
	{px(788), rawVertical},
	{px(1188), rawHorizontal},
}

func guidesBlock(guides []rawGuide) []byte {
	var b []byte
	b = binary.BigEndian.AppendUint32(b, 1)   // version
	b = binary.BigEndian.AppendUint32(b, 576) // grid cycle, horizontal
	b = binary.BigEndian.AppendUint32(b, 576) // grid cycle, vertical
	b = binary.BigEndian.AppendUint32(b, uint32(len(guides)))
	for _, g := range guides {
		b = binary.BigEndian.AppendUint32(b, g.location)
		b = append(b, g.axis)
	}
	return b
}

// resourceBlock wraps a payload with an empty Pascal name, which is what
// Photoshop writes for every block in the corpus templates.
func resourceBlock(id uint16, data []byte) []byte {
	var b []byte
	b = append(b, "8BIM"...)
	b = binary.BigEndian.AppendUint16(b, id)
	b = append(b, 0, 0) // zero-length name, padded to an even length
	b = binary.BigEndian.AppendUint32(b, uint32(len(data)))
	b = append(b, data...)
	if len(data)%2 != 0 {
		b = append(b, 0)
	}
	return b
}

func buildPSD(width, height int, resources []byte) []byte {
	var b []byte
	b = append(b, "8BPS"...)
	b = binary.BigEndian.AppendUint16(b, 1) // 2 would be PSB
	b = append(b, make([]byte, 6)...)       // reserved
	b = binary.BigEndian.AppendUint16(b, 3) // channels
	b = binary.BigEndian.AppendUint32(b, uint32(height))
	b = binary.BigEndian.AppendUint32(b, uint32(width))
	b = binary.BigEndian.AppendUint16(b, 8) // bit depth
	b = binary.BigEndian.AppendUint16(b, 3) // colour mode: RGB
	b = binary.BigEndian.AppendUint32(b, 0) // colour mode data, empty
	b = binary.BigEndian.AppendUint32(b, uint32(len(resources)))
	b = append(b, resources...)
	b = binary.BigEndian.AppendUint32(b, 0) // layer and mask info, empty
	b = append(b, 0, 0)                     // image data, raw
	return b
}

func facePSD() []byte {
	return buildPSD(800, 1200, resourceBlock(guidesResourceID, guidesBlock(faceGuides)))
}

func assertGuides(t *testing.T, got []Guide, want []Guide) {
	t.Helper()

	if len(got) != len(want) {
		t.Fatalf("got %d guides, want %d: %+v", len(got), len(want), got)
	}
	for i := range want {
		if got[i].Axis != want[i].Axis {
			t.Errorf("guide %d: axis %q, want %q", i, got[i].Axis, want[i].Axis)
		}
		// A tolerance because positions are a division, and the templates put
		// thirds on a canvas that cannot hold them exactly.
		if math.Abs(got[i].Position-want[i].Position) > 1e-9 {
			t.Errorf("guide %d: position %v, want %v", i, got[i].Position, want[i].Position)
		}
	}
}

func TestParseReadsGuidesAsFractions(t *testing.T) {
	template, err := Parse(facePSD())
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}

	if template.Width != 800 || template.Height != 1200 {
		t.Errorf("canvas %dx%d, want 800x1200", template.Width, template.Height)
	}

	// Sorted by axis, then position: the margins and quarters across, then the
	// hair, eye line, chin and bottom margin down.
	assertGuides(t, template.Guides, []Guide{
		{Axis: AxisX, Position: 12.0 / 800},
		{Axis: AxisX, Position: 0.25},
		{Axis: AxisX, Position: 0.50},
		{Axis: AxisX, Position: 0.75},
		{Axis: AxisX, Position: 788.0 / 800},
		{Axis: AxisY, Position: 0.025},
		{Axis: AxisY, Position: 0.425},
		{Axis: AxisY, Position: 0.77},
		{Axis: AxisY, Position: 0.99},
	})
}

// A vertical guide is a fraction of width and a horizontal one a fraction of
// height, so a non-square canvas is the only thing that catches the two being
// swapped.
func TestParseMeasuresEachAxisAgainstItsOwnSpan(t *testing.T) {
	psd := buildPSD(800, 1200, resourceBlock(guidesResourceID, guidesBlock([]rawGuide{
		{px(400), rawVertical},
		{px(400), rawHorizontal},
	})))

	template, err := Parse(psd)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}

	assertGuides(t, template.Guides, []Guide{
		{Axis: AxisX, Position: 0.5},          // 400 of 800
		{Axis: AxisY, Position: 400.0 / 1200}, // the same pixel, a third of the way down
	})
}

func TestAspectRatioComesFromTheCanvas(t *testing.T) {
	for _, tc := range []struct {
		name          string
		width, height int
		want          float64
	}{
		{"portrait", 800, 1200, 2.0 / 3.0},
		{"landscape", 1280, 720, 16.0 / 9.0},
		{"a swapped-in shape", 900, 1200, 3.0 / 4.0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			// Guides placed for this canvas rather than the face template's, so
			// the test says something about the aspect ratio and nothing about
			// whether guides drawn for one shape fit another.
			centre := []rawGuide{
				{px(tc.width / 2), rawVertical},
				{px(tc.height / 2), rawHorizontal},
			}
			psd := buildPSD(tc.width, tc.height, resourceBlock(guidesResourceID, guidesBlock(centre)))
			template, err := Parse(psd)
			if err != nil {
				t.Fatalf("Parse: %v", err)
			}
			if got := template.AspectRatio(); math.Abs(got-tc.want) > 1e-9 {
				t.Errorf("aspect ratio %v, want %v", got, tc.want)
			}
		})
	}
}

// Photoshop stores guides in creation order and writes blocks we have no
// interest in, including odd-length ones that shift every later block by a pad
// byte if the walk gets it wrong.
func TestParseWalksPastOtherResources(t *testing.T) {
	var resources []byte
	resources = append(resources, resourceBlock(1005, make([]byte, 16))...) // resolution info
	resources = append(resources, resourceBlock(1024, []byte{0, 1, 2})...)  // odd length, forces a pad
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1039, make([]byte, 672))...) // ICC profile

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if len(template.Guides) != len(faceGuides) {
		t.Fatalf("got %d guides, want %d", len(template.Guides), len(faceGuides))
	}
}

func TestParseReportsMissingGuides(t *testing.T) {
	t.Run("no guides block", func(t *testing.T) {
		psd := buildPSD(800, 1200, resourceBlock(1005, make([]byte, 16)))
		if _, err := Parse(psd); !errors.Is(err, ErrNoGuides) {
			t.Errorf("got %v, want ErrNoGuides", err)
		}
	})

	t.Run("empty guides block", func(t *testing.T) {
		psd := buildPSD(800, 1200, resourceBlock(guidesResourceID, guidesBlock(nil)))
		if _, err := Parse(psd); !errors.Is(err, ErrNoGuides) {
			t.Errorf("got %v, want ErrNoGuides", err)
		}
	})
}

func TestParseRejectsMalformedFiles(t *testing.T) {
	for _, tc := range []struct {
		name string
		psd  []byte
	}{
		{"empty", nil},
		{"not a PSD", []byte("GIF89a and then some padding to get past the header")},
		{
			"PSB, whose section lengths are 64-bit",
			func() []byte {
				psd := facePSD()
				binary.BigEndian.PutUint16(psd[4:], 2)
				return psd
			}(),
		},
		{
			"zero-height canvas",
			buildPSD(800, 0, resourceBlock(guidesResourceID, guidesBlock(faceGuides))),
		},
		{
			"a resource length running past the file",
			func() []byte {
				resources := resourceBlock(guidesResourceID, guidesBlock(faceGuides))
				// The size field sits after the signature, ID and empty name.
				binary.BigEndian.PutUint32(resources[8:], math.MaxUint32)
				return buildPSD(800, 1200, resources)
			}(),
		},
		{
			"garbage where a resource block should start",
			buildPSD(800, 1200, []byte("not a block at all, but long enough to try")),
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := Parse(tc.psd); err == nil {
				t.Error("got nil error, want a parse failure")
			}
		})
	}
}

// A guide is stored where it was dragged, and Photoshop will happily leave one
// off the canvas. Divided by the canvas it becomes a position like 167772.11,
// which the resolver would hand to a client as a Float and the overlay would
// draw somewhere far outside the picture.
//
// Refused rather than clamped: a line outside the frame is a template someone
// needs to look at, and pinning it to the edge would hide that while drawing
// something the designer never placed.
func TestParseRefusesGuidesOutsideTheCanvas(t *testing.T) {
	for _, tc := range []struct {
		name  string
		guide rawGuide
	}{
		{"past the right edge", rawGuide{px(801), rawVertical}},
		{"far past it", rawGuide{px(1 << 20), rawVertical}},
		{"below the bottom", rawGuide{px(1201), rawHorizontal}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			psd := buildPSD(800, 1200,
				resourceBlock(guidesResourceID, guidesBlock([]rawGuide{tc.guide})))

			if _, err := Parse(psd); err == nil {
				t.Error("accepted a guide outside the canvas")
			}
		})
	}

	// The edges themselves are where a crop box is drawn, and must stay legal.
	psd := buildPSD(800, 1200, resourceBlock(guidesResourceID, guidesBlock([]rawGuide{
		{px(0), rawVertical},
		{px(800), rawVertical},
		{px(1200), rawHorizontal},
	})))
	if _, err := Parse(psd); err != nil {
		t.Errorf("refused a guide on the edge: %v", err)
	}
}

// The count is multiplied by the record length to check it fits. On a 32-bit
// int that product wraps long before the comparison could catch it, so the
// check is written as a division instead.
func TestParseRefusesAnImpossibleGuideCount(t *testing.T) {
	block := guidesBlock([]rawGuide{{px(400), rawVertical}})
	// Overwrite the count, which sits after the version and two grid cycles.
	binary.BigEndian.PutUint32(block[12:16], 0x40000001)

	psd := buildPSD(800, 1200, resourceBlock(guidesResourceID, block))
	if _, err := Parse(psd); err == nil {
		t.Error("accepted a guide count larger than the block can hold")
	}
}
