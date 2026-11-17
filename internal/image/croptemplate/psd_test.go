package croptemplate

import (
	"encoding/binary"
	"fmt"
	"math"
	"slices"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Format literals are written out here rather than taken from the constants under test
const (
	rawVertical      = 0
	rawHorizontal    = 1
	guidesResourceID = 1032
	xmpResourceID    = 1060
	testNamespace    = "https://stashapp.github.io/stash-box/ns/crop-template/1.0/"
)

type rawGuide struct {
	location uint32 // 1/32 px, as stored
	axis     byte
	role     string
	label    string
}

func px(n int) uint32 { return uint32(n) * 32 }

// The Face template on an 800x1200 canvas, in creation order
var faceGuides = []rawGuide{
	{px(400), rawVertical, "reference", "Centre"},
	{px(600), rawVertical, "reference", "Right quarter"},
	{px(200), rawVertical, "reference", "Left quarter"},
	{px(30), rawHorizontal, "anchor", "Top of hair"},
	{px(924), rawHorizontal, "reference", "Chin"},
	{px(510), rawHorizontal, "anchor", "Eye line"},
	{px(12), rawVertical, "margin", "Left margin"},
	{px(788), rawVertical, "margin", "Right margin"},
	{px(1188), rawHorizontal, "margin", "Bottom margin"},
}

var faceTemplate = Template{Width: 800, Height: 1200, Guides: []Guide{
	{AxisX, 12.0 / 800, RoleMargin, "Left margin"},
	{AxisX, 0.25, RoleReference, "Left quarter"},
	{AxisX, 0.5, RoleReference, "Centre"},
	{AxisX, 0.75, RoleReference, "Right quarter"},
	{AxisX, 788.0 / 800, RoleMargin, "Right margin"},
	{AxisY, 0.025, RoleAnchor, "Top of hair"},
	{AxisY, 0.425, RoleAnchor, "Eye line"},
	{AxisY, 0.77, RoleReference, "Chin"},
	{AxisY, 0.99, RoleMargin, "Bottom margin"},
}}

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

func resourceBlock(id uint16, data []byte) []byte {
	var b []byte
	b = append(b, "8BIM"...)
	b = binary.BigEndian.AppendUint16(b, id)
	b = append(b, 0, 0) // empty Pascal name, padded
	b = binary.BigEndian.AppendUint32(b, uint32(len(data)))
	b = append(b, data...)
	if len(data)%2 != 0 {
		b = append(b, 0)
	}
	return b
}

func buildPSD(width, height int, resources ...[]byte) []byte {
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
	all := slices.Concat(resources...)
	b = binary.BigEndian.AppendUint32(b, uint32(len(all)))
	b = append(b, all...)
	b = binary.BigEndian.AppendUint32(b, 0) // layer and mask info, empty
	b = append(b, 0, 0)                     // image data, raw
	return b
}

func xmpPacket(entries string) []byte {
	return fmt.Appendf(nil, `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
     xmlns:tiff="http://ns.adobe.com/tiff/1.0/"
     xmlns:sbox="%s">
   <tiff:Orientation>1</tiff:Orientation>
   <sbox:guides>
    <rdf:Seq>
%s
    </rdf:Seq>
   </sbox:guides>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`, testNamespace, entries)
}

type entryFunc func(axis string, position float64, role, label string) string

func shorthandEntry(axis string, position float64, role, label string) string {
	return fmt.Sprintf(`     <rdf:li sbox:axis=%q sbox:position=%q sbox:role=%q sbox:label=%q/>`,
		axis, fmt.Sprintf("%g", position), role, label)
}

func expandedEntry(axis string, position float64, role, label string) string {
	return fmt.Sprintf(`     <rdf:li rdf:parseType="Resource">
      <sbox:axis>%s</sbox:axis>
      <sbox:position>%g</sbox:position>
      <sbox:role>%s</sbox:role>
      <sbox:label>%s</sbox:label>
     </rdf:li>`, axis, position, role, label)
}

func entries(width, height int, guides []rawGuide, entry entryFunc) string {
	out := make([]string, 0, len(guides))
	for _, g := range guides {
		axis, span := "Y", height
		if g.axis == rawVertical {
			axis, span = "X", width
		}
		out = append(out, entry(axis, float64(g.location)/32/float64(span), g.role, g.label))
	}
	return strings.Join(out, "\n")
}

func annotatedPSD(width, height int, guides []rawGuide) []byte {
	return buildPSD(width, height,
		resourceBlock(guidesResourceID, guidesBlock(guides)),
		resourceBlock(xmpResourceID, xmpPacket(entries(width, height, guides, shorthandEntry))))
}

func facePSD() []byte { return annotatedPSD(800, 1200, faceGuides) }

func facePSDWithPacket(packet []byte) []byte {
	resources := [][]byte{resourceBlock(guidesResourceID, guidesBlock(faceGuides))}
	if packet != nil {
		resources = append(resources, resourceBlock(xmpResourceID, packet))
	}
	return buildPSD(800, 1200, resources...)
}

func TestParseReadsAnnotatedGuidesSortedByAxisThenPosition(t *testing.T) {
	template, err := Parse(facePSD())
	require.NoError(t, err)
	assert.Equal(t, faceTemplate, template)
}

func TestParseMeasuresEachAxisAgainstItsOwnCanvas(t *testing.T) {
	for _, tc := range []struct {
		name          string
		width, height int
	}{
		{"portrait", 800, 1200},
		{"landscape", 1280, 720},
		{"four by three", 900, 1200},
	} {
		t.Run(tc.name, func(t *testing.T) {
			guides := []rawGuide{
				{px(tc.width / 4), rawVertical, "anchor", "Quarter across"},
				{px(tc.height / 2), rawHorizontal, "anchor", "Halfway down"},
			}
			template, err := Parse(annotatedPSD(tc.width, tc.height, guides))
			require.NoError(t, err)
			assert.Equal(t, Template{Width: tc.width, Height: tc.height, Guides: []Guide{
				{AxisX, 0.25, RoleAnchor, "Quarter across"},
				{AxisY, 0.5, RoleAnchor, "Halfway down"},
			}}, template)
			assert.InDelta(t, float64(tc.width)/float64(tc.height), template.AspectRatio(), 1e-9)
		})
	}
}

func TestParseWalksPastOtherResources(t *testing.T) {
	template, err := Parse(buildPSD(800, 1200,
		resourceBlock(1005, make([]byte, 16)),
		resourceBlock(1024, []byte{0, 1, 2}), // odd length forces a pad byte
		resourceBlock(guidesResourceID, guidesBlock(faceGuides)),
		resourceBlock(1039, make([]byte, 672)),
		resourceBlock(xmpResourceID, xmpPacket(entries(800, 1200, faceGuides, shorthandEntry)))))
	require.NoError(t, err)
	assert.Equal(t, faceTemplate, template)
}

func TestParseAcceptsGuidesOnTheCanvasEdge(t *testing.T) {
	_, err := Parse(annotatedPSD(800, 1200, []rawGuide{
		{px(0), rawVertical, "margin", "Left"},
		{px(800), rawVertical, "margin", "Right"},
		{px(1200), rawHorizontal, "margin", "Bottom"},
	}))
	assert.NoError(t, err)
}

func TestParseRejects(t *testing.T) {
	psb := facePSD()
	binary.BigEndian.PutUint16(psb[4:], 2)

	overlong := resourceBlock(guidesResourceID, guidesBlock(faceGuides))
	binary.BigEndian.PutUint32(overlong[8:], math.MaxUint32)

	hugeCount := guidesBlock(faceGuides)
	binary.BigEndian.PutUint32(hugeCount[12:16], 0x40000001)

	misspelledRole := slices.Clone(faceGuides)
	misspelledRole[5].role = "anchour"

	for _, tc := range []struct {
		name string
		psd  []byte
	}{
		{"an empty file", nil},
		{"a file that is not a PSD", []byte("GIF89a and then some padding to get past the header")},
		{"PSB, whose section lengths are 64-bit", psb},
		{"a zero-height canvas", buildPSD(800, 0, resourceBlock(guidesResourceID, guidesBlock(faceGuides)))},
		{"a resource length running past the file", buildPSD(800, 1200, overlong)},
		{"garbage where a resource block should start", buildPSD(800, 1200, []byte("not a block at all, but long enough to try"))},
		{"no guides block", buildPSD(800, 1200, resourceBlock(1005, make([]byte, 16)))},
		{"an empty guides block", buildPSD(800, 1200, resourceBlock(guidesResourceID, guidesBlock(nil)))},
		{"a guide count larger than the block", buildPSD(800, 1200, resourceBlock(guidesResourceID, hugeCount))},
		{"a guide past the right edge", annotatedPSD(800, 1200, []rawGuide{{px(801), rawVertical, "margin", "Off"}})},
		{"a guide below the bottom", annotatedPSD(800, 1200, []rawGuide{{px(1201), rawHorizontal, "margin", "Off"}})},
		{"no XMP packet", facePSDWithPacket(nil)},
		{"XMP that is not XML", facePSDWithPacket([]byte("\x00\x01 this is not markup"))},
		{"truncated XMP", facePSDWithPacket([]byte(`<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF`))},
		{"XMP from other software only", facePSDWithPacket([]byte(`<x:xmpmeta xmlns:x="adobe:ns:meta/">
			<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
			<rdf:Description xmlns:GIMP="http://www.gimp.org/xmp/">
			<GIMP:Version>2.10</GIMP:Version></rdf:Description></rdf:RDF></x:xmpmeta>`))},
		{"a guides element outside our namespace", facePSDWithPacket([]byte(`<x:xmpmeta xmlns:x="adobe:ns:meta/">
			<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
			<rdf:Description xmlns:other="http://example.invalid/other" xmlns:sbox="` + testNamespace + `">
			<other:guides><rdf:Seq>` + entries(800, 1200, faceGuides, shorthandEntry) + `</rdf:Seq></other:guides>
			</rdf:Description></rdf:RDF></x:xmpmeta>`))},
		{"a guide without an annotation", facePSDWithPacket(xmpPacket(entries(800, 1200, faceGuides[:8], shorthandEntry)))},
		{"a misspelled role", facePSDWithPacket(xmpPacket(entries(800, 1200, misspelledRole, shorthandEntry)))},
		{"an annotation on the other axis", buildPSD(800, 1200,
			resourceBlock(guidesResourceID, guidesBlock([]rawGuide{{px(600), rawHorizontal, "", ""}})),
			resourceBlock(xmpResourceID, xmpPacket(shorthandEntry("X", 0.5, "anchor", "A vertical line"))))},
		{"an annotation far from its guide", buildPSD(800, 1200,
			resourceBlock(guidesResourceID, guidesBlock([]rawGuide{{px(120), rawHorizontal, "", ""}})),
			resourceBlock(xmpResourceID, xmpPacket(shorthandEntry("Y", 0.5, "anchor", "Nowhere near"))))},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, err := Parse(tc.psd)
			assert.Error(t, err)
		})
	}
}
