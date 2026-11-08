package psdparse

import (
	"github.com/stashapp/stash-box/internal/image/croptemplate"

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

type annotation struct {
	Axis     croptemplate.Axis
	Position float64
	Role     croptemplate.Role
	Label    string
}

// annotate attaches labels to guides, matching on axis and position.
//
// Geometry stays the authority: block 1032 says where the lines are and XMP
// only names them. That ordering is what stops the two disagreeing about
// anything that matters -- an annotation matching no guide is dropped rather
// than conjuring a line the template does not have, and a guide matching no
// annotation simply goes unlabelled.
func annotate(guides []croptemplate.Guide, annotations []annotation) []croptemplate.Guide {
	for i, guide := range guides {
		for _, a := range annotations {
			// An entry carrying nothing is not naming anything, so it does not
			// get to consume the match: a typo'd role with a blank label would
			// otherwise take the guide and leave a better entry at the same
			// position unread.
			if a.Role == "" && a.Label == "" {
				continue
			}
			if a.Axis == guide.Axis && math.Abs(a.Position-guide.Position) <= positionTolerance {
				guides[i].Role = a.Role
				guides[i].Label = a.Label
				break
			}
		}
	}
	return guides
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

	AxisElem     string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ axis"`
	PositionElem string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ position"`
	RoleElem     string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ role"`
	LabelElem    string `xml:"https://stashapp.github.io/stash-box/ns/crop-template/1.0/ label"`
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

func parseAxis(s string) croptemplate.Axis {
	switch strings.ToUpper(strings.TrimSpace(s)) {
	case "X":
		return croptemplate.AxisX
	case "Y":
		return croptemplate.AxisY
	default:
		return ""
	}
}

func parseRole(s string) croptemplate.Role {
	switch strings.ToUpper(strings.TrimSpace(s)) {
	case "ANCHOR":
		return croptemplate.RoleAnchor
	case "REFERENCE":
		return croptemplate.RoleReference
	case "MARGIN":
		return croptemplate.RoleMargin
	default:
		return ""
	}
}
