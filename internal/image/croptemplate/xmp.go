package croptemplate

import (
	"bytes"
	"encoding/xml"
	"math"
	"strconv"
	"strings"
)

// Namespace is the XMP vocabulary carrying guide annotations
//
// Block 1032 has room for a position and an axis and nothing else, so a guide
// cannot say it is the eye line, or that it is an anchor to be hit rather than
// a reference to be judged against. That distinction is most of what makes an
// overlay teach instead of decorate, so it rides along in the XMP packet
// instead of in a sidecar file: one file still holds the whole template, and
// what a contributor downloads cannot arrive separated from its labels.
const Namespace = "https://stashapp.github.io/stash-box/ns/crop-template/1.0/"

const (
	// "Image Resource IDs": 1060 is "(Photoshop 7.0) XMP metadata. File info as
	// XML description." See the spec reference at the top of psd.go's
	// constants. The payload is an XMP packet and nothing here is
	// Photoshop-specific -- what is read out of it is our own vocabulary,
	// declared at Namespace above.
	resourceXMP = 1060

	// positionTolerance is how far an annotation may sit from the guide it
	// describes.
	//
	// Generous on purpose. Guides land on whole pixels, so a template drawn at
	// 800 px wide puts its thirds at 33.25% rather than 33.333%, and an author
	// writing the round number should still match. The smallest gap between
	// two guides in any of the templates is around twenty percentage points,
	// so there is no risk of an annotation reaching the wrong line.
	positionTolerance = 0.005
)

// Role is how closely a guide is meant to be followed. The corpus draws this
// distinction in prose -- some lines "act as anchors that should be used with
// some precision", others are "merely intended for additional reference" --
// and it is worth keeping, because it is the difference between a rule and a
// suggestion.
type Role string

const (
	RoleAnchor    Role = "ANCHOR"
	RoleReference Role = "REFERENCE"
	RoleMargin    Role = "MARGIN"
)

// annotation is one guide's description, before it is matched to a guide.
type annotation struct {
	Axis     Axis
	Position float64
	Role     Role
	Label    string
	Pivot    bool
}

// annotate attaches labels to guides, matching on axis and position.
//
// Geometry stays the authority: block 1032 says where the lines are and XMP
// only names them. That ordering is what stops the two disagreeing about
// anything that matters -- an annotation matching no guide is dropped rather
// than conjuring a line the template does not have, and a guide matching no
// annotation simply goes unlabelled.
func annotate(guides []Guide, annotations []annotation) []Guide {
	for i, guide := range guides {
		for _, a := range annotations {
			// An entry carrying nothing is not naming anything, so it does not
			// get to consume the match: a typo'd role with a blank label would
			// otherwise take the guide and leave a better entry at the same
			// position unread. A pivot counts as something to say, or an entry
			// marking only that would be discarded as empty.
			if a.Role == "" && a.Label == "" && !a.Pivot {
				continue
			}
			if a.Axis == guide.Axis && math.Abs(a.Position-guide.Position) <= positionTolerance {
				guides[i].Role = a.Role
				guides[i].Label = a.Label
				guides[i].Pivot = a.Pivot
				break
			}
		}
	}
	return dropAmbiguousPivots(guides)
}

// parseAnnotations reads guide descriptions out of an XMP packet.
//
// Every failure here is silent, and deliberately so: the packet is mostly
// written by other software and full of vocabularies that are none of our
// business, so anything unreadable means an unannotated template rather than a
// broken one. Geometry is the contract; labels are a bonus, and losing them
// must never cost an instance its templates.
func parseAnnotations(packet []byte) []annotation {
	decoder := xml.NewDecoder(bytes.NewReader(packet))

	// Photoshop and Adobe's toolkit disagree with each other about how deeply
	// rdf:Description is nested, so the element is searched for by name rather
	// than reached by a path.
	for {
		// Any error, including a clean EOF, means there is nothing of ours in
		// the packet.
		token, err := decoder.Token()
		if err != nil {
			return nil
		}

		start, ok := token.(xml.StartElement)
		if !ok || start.Name.Space != Namespace || start.Name.Local != "guides" {
			continue
		}

		var parsed xmpGuides
		if err := decoder.DecodeElement(&parsed, &start); err != nil {
			return nil
		}
		return parsed.annotations()
	}
}

// The rdf:Seq is a nested struct rather than an "a>b" path in the tag, because
// that shorthand does not carry namespaces through each segment and silently
// matches nothing here.
type xmpGuides struct {
	Seq xmpSeq `xml:"http://www.w3.org/1999/02/22-rdf-syntax-ns# Seq"`
}

type xmpSeq struct {
	Items []xmpGuide `xml:"http://www.w3.org/1999/02/22-rdf-syntax-ns# li"`
}

// xmpGuide accepts both the shorthand form, where a struct's fields are
// attributes, and the expanded form, where they are child elements.
//
// Both are legal XMP and we do not control which one survives: Adobe's toolkit
// normalises shorthand to the expanded form when it rewrites a packet, so a
// template that round-trips through Photoshop can come back in the other
// shape. Reading only one of them would lose every label the first time a
// designer re-saved a file.
type xmpGuide struct {
	AxisAttr     string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ axis,attr"`
	PositionAttr string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ position,attr"`
	RoleAttr     string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ role,attr"`
	LabelAttr    string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ label,attr"`
	PivotAttr    string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ pivot,attr"`

	AxisElem     string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ axis"`
	PositionElem string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ position"`
	RoleElem     string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ role"`
	LabelElem    string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ label"`
	PivotElem    string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ pivot"`
}

func (g xmpGuides) annotations() []annotation {
	out := make([]annotation, 0, len(g.Seq.Items))

	for _, item := range g.Seq.Items {
		axis := parseAxis(pick(item.AxisElem, item.AxisAttr))
		if axis == "" {
			continue
		}
		position, err := strconv.ParseFloat(strings.TrimSpace(pick(item.PositionElem, item.PositionAttr)), 64)
		if err != nil {
			continue
		}

		out = append(out, annotation{
			Axis:     axis,
			Position: position,
			// An unrecognised role leaves the guide unroled but keeps its
			// label. A typo should cost the distinction it got wrong, not the
			// name of the line.
			Role:  parseRole(pick(item.RoleElem, item.RoleAttr)),
			Label: strings.TrimSpace(pick(item.LabelElem, item.LabelAttr)),
			Pivot: parseBool(pick(item.PivotElem, item.PivotAttr)),
		})
	}

	return out
}

// pick prefers the expanded form, which is what a packet normalised by Adobe's
// toolkit will carry.
func pick(elem, attr string) string {
	if strings.TrimSpace(elem) != "" {
		return elem
	}
	return attr
}

// parseBool reads the flag forms an XMP packet actually carries. "True" is
// what Adobe's toolkit writes for a boolean; "1" is what a hand-written packet
// is likely to say. Anything else, a typo included, leaves the flag unset -- a
// guide that cannot say whether it is the pivot is not the pivot.
func parseBool(s string) bool {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "true", "1", "yes":
		return true
	default:
		return false
	}
}

// dropAmbiguousPivots clears the pivot from any axis claiming more than one.
//
// A frame cannot be held still at two points on an axis and still have
// anything left for the drag to change, so a template saying so has said
// nothing usable. Cleared rather than resolved by taking the first: the order
// guides arrive in is the order block 1032 happens to store them, and picking
// by it would make the behaviour depend on something no author can see.
//
// Dropping both leaves the axis resizing about its centre, which is what a
// template with no pivot does anyway -- a defined answer rather than an
// arbitrary one. The tool that writes these refuses the pair outright; this is
// for the templates it did not write.
func dropAmbiguousPivots(guides []Guide) []Guide {
	claims := make(map[Axis]int, 2)
	for _, guide := range guides {
		if guide.Pivot {
			claims[guide.Axis]++
		}
	}

	for i, guide := range guides {
		if guide.Pivot && claims[guide.Axis] > 1 {
			guides[i].Pivot = false
		}
	}
	return guides
}

func parseAxis(s string) Axis {
	switch strings.ToUpper(strings.TrimSpace(s)) {
	case "X":
		return AxisX
	case "Y":
		return AxisY
	default:
		return ""
	}
}

func parseRole(s string) Role {
	switch strings.ToUpper(strings.TrimSpace(s)) {
	case "ANCHOR":
		return RoleAnchor
	case "REFERENCE":
		return RoleReference
	case "MARGIN":
		return RoleMargin
	default:
		return ""
	}
}
