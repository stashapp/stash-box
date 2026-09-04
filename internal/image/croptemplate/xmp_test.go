package croptemplate

import (
	"fmt"
	"strings"
	"testing"
)

// The namespace is written out here rather than taken from the constant, for
// the same reason the format literals in psd_test.go are: a fixture that reads
// its namespace from the code it is checking agrees with any namespace.
const testNamespace = "https://stashapp.github.io/stash-box/ns/crop-template/1.0/"

// xmpPacket wraps guide entries in the envelope Photoshop writes, so the
// element is found at the depth it really appears at rather than at the root.
func xmpPacket(entries string) []byte {
	return []byte(fmt.Sprintf(`<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
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
<?xpacket end="w"?>`, testNamespace, entries))
}

// shorthandEntry puts a struct's fields in attributes.
func shorthandEntry(axis string, position float64, role, label string) string {
	return fmt.Sprintf(`     <rdf:li sbox:axis=%q sbox:position=%q sbox:role=%q sbox:label=%q/>`,
		axis, fmt.Sprintf("%g", position), role, label)
}

// expandedEntry puts them in child elements, which is what Adobe's toolkit
// rewrites shorthand into.
func expandedEntry(axis string, position float64, role, label string) string {
	return fmt.Sprintf(`     <rdf:li rdf:parseType="Resource">
      <sbox:axis>%s</sbox:axis>
      <sbox:position>%g</sbox:position>
      <sbox:role>%s</sbox:role>
      <sbox:label>%s</sbox:label>
     </rdf:li>`, axis, position, role, label)
}

// annotatedFacePSD is the Face template with its eye line and chin named.
func annotatedFacePSD(entry func(string, float64, string, string) string) []byte {
	packet := xmpPacket(strings.Join([]string{
		entry("Y", 0.025, "anchor", "Top of hair"),
		entry("Y", 0.425, "anchor", "Eye line"),
		entry("Y", 0.77, "reference", "Chin"),
		entry("X", 0.5, "reference", "Centre"),
	}, "\n"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, packet)...)
	return buildPSD(800, 1200, resources)
}

func guideAt(t *testing.T, template Template, axis Axis, position float64) Guide {
	t.Helper()
	for _, g := range template.Guides {
		if g.Axis == axis && g.Position > position-1e-6 && g.Position < position+1e-6 {
			return g
		}
	}
	t.Fatalf("no %s guide at %v in %+v", axis, position, template.Guides)
	return Guide{}
}

// Both encodings are legal XMP and we do not control which one a file comes
// back in, so both have to read the same.
func TestAnnotationsReadInEitherEncoding(t *testing.T) {
	for _, tc := range []struct {
		name  string
		entry func(string, float64, string, string) string
	}{
		{"shorthand attributes", shorthandEntry},
		{"expanded elements", expandedEntry},
	} {
		t.Run(tc.name, func(t *testing.T) {
			template, err := Parse(annotatedFacePSD(tc.entry))
			if err != nil {
				t.Fatalf("Parse: %v", err)
			}

			eyeLine := guideAt(t, template, AxisY, 0.425)
			if eyeLine.Label != "Eye line" {
				t.Errorf("label %q, want %q", eyeLine.Label, "Eye line")
			}
			if eyeLine.Role != RoleAnchor {
				t.Errorf("role %q, want %q", eyeLine.Role, RoleAnchor)
			}

			chin := guideAt(t, template, AxisY, 0.77)
			if chin.Role != RoleReference {
				t.Errorf("chin role %q, want %q", chin.Role, RoleReference)
			}
		})
	}
}

// An annotation reaching the wrong line would be worse than no annotation, so
// axis is part of the match and not only position.
func TestAnnotationsDoNotCrossAxes(t *testing.T) {
	packet := xmpPacket(shorthandEntry("X", 0.5, "anchor", "A vertical line"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock([]rawGuide{
		{px(400), rawVertical},   // X at 0.5
		{px(600), rawHorizontal}, // Y at 0.5
	}))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}

	if got := guideAt(t, template, AxisX, 0.5); got.Label != "A vertical line" {
		t.Errorf("vertical guide label %q, want %q", got.Label, "A vertical line")
	}
	if got := guideAt(t, template, AxisY, 0.5); got.Label != "" {
		t.Errorf("horizontal guide label %q, want it unlabelled", got.Label)
	}
}

// Guides land on whole pixels, so an 800 px canvas puts its thirds at 33.25%.
// An author writing the round number should still match.
func TestAnnotationsToleratePixelRounding(t *testing.T) {
	packet := xmpPacket(shorthandEntry("Y", 1.0/3.0, "reference", "Collarbone"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock([]rawGuide{
		{px(399), rawHorizontal}, // 33.25% of 1200, as the real templates store it
	}))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if template.Guides[0].Label != "Collarbone" {
		t.Errorf("label %q, want %q", template.Guides[0].Label, "Collarbone")
	}
}

// The tolerance must not be so wide that it reaches a neighbour. The closest
// pair in any real template is about twenty percentage points apart.
func TestAnnotationsDoNotReachDistantGuides(t *testing.T) {
	packet := xmpPacket(shorthandEntry("Y", 0.5, "anchor", "Nowhere near"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock([]rawGuide{
		{px(120), rawHorizontal}, // 10%
	}))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if template.Guides[0].Label != "" {
		t.Errorf("label %q, want the guide left unlabelled", template.Guides[0].Label)
	}
}

// Geometry is the authority: XMP names lines, it does not add them.
func TestAnnotationsCannotInventGuides(t *testing.T) {
	packet := xmpPacket(strings.Join([]string{
		shorthandEntry("Y", 0.425, "anchor", "Eye line"),
		shorthandEntry("Y", 0.611, "anchor", "A line the template does not have"),
	}, "\n"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if len(template.Guides) != len(faceGuides) {
		t.Fatalf("got %d guides, want %d", len(template.Guides), len(faceGuides))
	}
	for _, g := range template.Guides {
		if strings.Contains(g.Label, "does not have") {
			t.Errorf("unmatched annotation became a guide: %+v", g)
		}
	}
}

// Labels are a bonus and geometry is the contract, so nothing in the packet
// may cost an instance its template.
func TestUnreadableAnnotationsLeaveGeometryIntact(t *testing.T) {
	for _, tc := range []struct {
		name   string
		packet string
	}{
		{"no XMP at all", ""},
		{"not XML", "\x00\x01 this is not markup"},
		{"truncated XML", `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF`},
		{"XMP from other software only", `<x:xmpmeta xmlns:x="adobe:ns:meta/">
			<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
			<rdf:Description xmlns:GIMP="http://www.gimp.org/xmp/">
			<GIMP:Version>2.10</GIMP:Version></rdf:Description></rdf:RDF></x:xmpmeta>`},
		{"our element, wrong namespace", `<x:xmpmeta xmlns:x="adobe:ns:meta/">
			<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
			<rdf:Description xmlns:sbox="http://example.invalid/other">
			<sbox:guides><rdf:Seq><rdf:li sbox:axis="Y" sbox:position="0.425"
			sbox:label="Eye line"/></rdf:Seq></sbox:guides>
			</rdf:Description></rdf:RDF></x:xmpmeta>`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var resources []byte
			resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
			if tc.packet != "" {
				resources = append(resources, resourceBlock(1060, []byte(tc.packet))...)
			}

			template, err := Parse(buildPSD(800, 1200, resources))
			if err != nil {
				t.Fatalf("Parse: %v", err)
			}
			if len(template.Guides) != len(faceGuides) {
				t.Errorf("got %d guides, want %d", len(template.Guides), len(faceGuides))
			}
			for _, g := range template.Guides {
				if g.Label != "" {
					t.Errorf("expected no labels, got %q", g.Label)
				}
			}
		})
	}
}

// The element's own namespace has to be checked and not just its attributes':
// "guides" is an ordinary enough word that another vocabulary could use it,
// and its contents would then be read as ours. Only this shape catches that --
// a packet where everything *inside* the element is in our namespace and only
// the element itself is not.
func TestGuidesElementMustBeInOurNamespace(t *testing.T) {
	packet := []byte(`<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
     xmlns:other="http://example.invalid/some-other-vocabulary"
     xmlns:sbox="` + testNamespace + `">
   <other:guides>
    <rdf:Seq>
     <rdf:li sbox:axis="Y" sbox:position="0.425" sbox:role="anchor" sbox:label="Eye line"/>
    </rdf:Seq>
   </other:guides>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>`)

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if got := guideAt(t, template, AxisY, 0.425); got.Label != "" {
		t.Errorf("read %q out of another vocabulary's guides element", got.Label)
	}
}

// A typo in a role should cost the distinction it got wrong, not the name of
// the line.
func TestUnknownRoleKeepsTheLabel(t *testing.T) {
	packet := xmpPacket(shorthandEntry("Y", 0.425, "anchour", "Eye line"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}

	eyeLine := guideAt(t, template, AxisY, 0.425)
	if eyeLine.Label != "Eye line" {
		t.Errorf("label %q, want it kept", eyeLine.Label)
	}
	if eyeLine.Role != "" {
		t.Errorf("role %q, want it empty", eyeLine.Role)
	}
}

func TestAnnotationsAcceptLooseCasing(t *testing.T) {
	packet := xmpPacket(shorthandEntry("y", 0.425, "Anchor", "Eye line"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if got := guideAt(t, template, AxisY, 0.425); got.Role != RoleAnchor {
		t.Errorf("role %q, want %q", got.Role, RoleAnchor)
	}
}

// An entry naming nothing must not consume the guide it happens to sit on. A
// blank one first would otherwise take the match and leave the entry that
// actually names the line unread -- and the guide would come back with the
// role and label it would have had if there were no annotation at all, which
// is indistinguishable from an unannotated template.
func TestBlankAnnotationsDoNotConsumeAGuide(t *testing.T) {
	packet := xmpPacket(strings.Join([]string{
		shorthandEntry("Y", 0.425, "", ""),
		shorthandEntry("Y", 0.425, "anchor", "Eye line"),
	}, "\n"))

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, packet)...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}

	eyeLine := guideAt(t, template, AxisY, 0.425)
	if eyeLine.Label != "Eye line" {
		t.Errorf("label %q, want %q", eyeLine.Label, "Eye line")
	}
	if eyeLine.Role != RoleAnchor {
		t.Errorf("role %q, want %q", eyeLine.Role, RoleAnchor)
	}
}

// pivotEntry writes an entry carrying the pivot flag, in either encoding. The
// flag is a separate helper rather than another parameter on the two above,
// which every existing test would otherwise have to pass an empty string to.
func shorthandPivot(axis string, position float64, role, label, pivot string) string {
	return fmt.Sprintf(`     <rdf:li sbox:axis=%q sbox:position=%q sbox:role=%q sbox:label=%q sbox:pivot=%q/>`,
		axis, fmt.Sprintf("%g", position), role, label, pivot)
}

func expandedPivot(axis string, position float64, role, label, pivot string) string {
	return fmt.Sprintf(`     <rdf:li rdf:parseType="Resource">
      <sbox:axis>%s</sbox:axis>
      <sbox:position>%g</sbox:position>
      <sbox:role>%s</sbox:role>
      <sbox:label>%s</sbox:label>
      <sbox:pivot>%s</sbox:pivot>
     </rdf:li>`, axis, position, role, label, pivot)
}

// parseWithEntries builds a Face template whose XMP carries exactly these
// entries.
func parseWithEntries(t *testing.T, entries ...string) Template {
	t.Helper()

	var resources []byte
	resources = append(resources, resourceBlock(guidesResourceID, guidesBlock(faceGuides))...)
	resources = append(resources, resourceBlock(1060, xmpPacket(strings.Join(entries, "\n")))...)

	template, err := Parse(buildPSD(800, 1200, resources))
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	return template
}

// The pivot rides in the packet like the role does, so it has to survive the
// same round trip through Adobe's toolkit -- which rewrites shorthand into the
// expanded form.
func TestPivotIsReadInEitherEncoding(t *testing.T) {
	for _, tc := range []struct {
		name  string
		entry func(string, float64, string, string, string) string
	}{
		{"shorthand", shorthandPivot},
		{"expanded", expandedPivot},
	} {
		t.Run(tc.name, func(t *testing.T) {
			template := parseWithEntries(t,
				tc.entry("Y", 0.425, "reference", "Eye line", "true"),
				tc.entry("Y", 0.77, "anchor", "Chin", ""),
			)

			if eyeLine := guideAt(t, template, AxisY, 0.425); !eyeLine.Pivot {
				t.Error("the eye line did not come back as the pivot")
			}
			if chin := guideAt(t, template, AxisY, 0.77); chin.Pivot {
				t.Error("the chin came back as a pivot without claiming to be one")
			}
		})
	}
}

// Role and pivot are independent, which is the whole reason they are separate
// fields: the softest line in a headshot is the right one to resize about.
func TestPivotIsIndependentOfRole(t *testing.T) {
	template := parseWithEntries(t,
		shorthandPivot("Y", 0.425, "reference", "Eye line", "true"),
		shorthandPivot("Y", 0.025, "anchor", "Top of hair", ""),
	)

	eyeLine := guideAt(t, template, AxisY, 0.425)
	if eyeLine.Role != RoleReference || !eyeLine.Pivot {
		t.Errorf("eye line is role %q pivot %v, want a REFERENCE that is also the pivot",
			eyeLine.Role, eyeLine.Pivot)
	}

	hair := guideAt(t, template, AxisY, 0.025)
	if hair.Role != RoleAnchor || hair.Pivot {
		t.Errorf("top of hair is role %q pivot %v, want an ANCHOR that is not the pivot",
			hair.Role, hair.Pivot)
	}
}

// A guide that says nothing about being the pivot is not the pivot. Worth
// stating, because the whole corpus predates the flag and every line in it
// arrives this way.
func TestAGuideWithNoPivotFlagIsNotThePivot(t *testing.T) {
	template := parseWithEntries(t, shorthandEntry("Y", 0.425, "anchor", "Eye line"))

	if guideAt(t, template, AxisY, 0.425).Pivot {
		t.Error("a guide with no pivot flag came back as the pivot")
	}
}

func TestPivotAcceptsTheFormsAPacketCarries(t *testing.T) {
	for _, tc := range []struct {
		written string
		want    bool
	}{
		// What Adobe's toolkit and a hand-written packet respectively produce.
		{"true", true},
		{"True", true},
		{"1", true},
		{"yes", true},
		{"false", false},
		{"0", false},
		{"", false},
		// A typo costs the flag rather than being guessed at.
		{"ture", false},
	} {
		t.Run(tc.written, func(t *testing.T) {
			template := parseWithEntries(t,
				shorthandPivot("Y", 0.425, "reference", "Eye line", tc.written))

			if got := guideAt(t, template, AxisY, 0.425).Pivot; got != tc.want {
				t.Errorf("pivot=%q read as %v, want %v", tc.written, got, tc.want)
			}
		})
	}
}

// An entry naming only the pivot still has something to say. The empty-entry
// rule exists so a typo'd role with a blank label cannot consume a guide and
// leave a better entry unread -- it must not also throw away a flag.
func TestAPivotAloneIsEnoughToAnnotate(t *testing.T) {
	template := parseWithEntries(t, shorthandPivot("Y", 0.425, "", "", "true"))

	eyeLine := guideAt(t, template, AxisY, 0.425)
	if !eyeLine.Pivot {
		t.Error("an entry carrying nothing but a pivot was discarded as empty")
	}
	if eyeLine.Role != "" || eyeLine.Label != "" {
		t.Errorf("it also invented role %q label %q", eyeLine.Role, eyeLine.Label)
	}
}

// A frame cannot be held still at two points on one axis and have anything
// left for the drag to change. Neither wins: the order guides arrive in is the
// order block 1032 stores them, so picking by it would make the behaviour
// depend on something no author can see. Both cleared leaves the axis
// resizing about its centre, which is what an unmarked template does anyway.
func TestTwoPivotsOnAnAxisLeaveNeither(t *testing.T) {
	template := parseWithEntries(t,
		shorthandPivot("Y", 0.425, "reference", "Eye line", "true"),
		shorthandPivot("Y", 0.77, "anchor", "Chin", "true"),
	)

	for _, position := range []float64{0.425, 0.77} {
		if guide := guideAt(t, template, AxisY, position); guide.Pivot {
			t.Errorf("guide at %v kept its pivot despite the axis claiming two", position)
		}
	}
}

// The two axes are independent. A template that lines a subject up vertically
// and leaves the horizontal to the thirds is the ordinary case.
func TestAPivotOnEachAxisIsKept(t *testing.T) {
	template := parseWithEntries(t,
		shorthandPivot("Y", 0.425, "reference", "Eye line", "true"),
		shorthandPivot("X", 0.5, "reference", "Centre", "true"),
	)

	if !guideAt(t, template, AxisY, 0.425).Pivot {
		t.Error("the Y pivot was dropped")
	}
	if !guideAt(t, template, AxisX, 0.5).Pivot {
		t.Error("the X pivot was dropped")
	}
}

// An axis that over-claims must not cost the other one its pivot.
func TestAnAmbiguousAxisDoesNotDisarmTheOther(t *testing.T) {
	template := parseWithEntries(t,
		shorthandPivot("Y", 0.425, "reference", "Eye line", "true"),
		shorthandPivot("Y", 0.77, "anchor", "Chin", "true"),
		shorthandPivot("X", 0.5, "reference", "Centre", "true"),
	)

	if !guideAt(t, template, AxisX, 0.5).Pivot {
		t.Error("the X pivot was dropped because Y claimed two")
	}
}
