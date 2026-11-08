package croptemplate

import (
	"bytes"
	"encoding/xml"
	"math"
	"strconv"
	"strings"
)

// Namespace is the XMP vocabulary carrying guide roles and labels, which block 1032 has no room for
const Namespace = "https://stashapp.github.io/stash-box/ns/crop-template/1.0/"

const (
	// "Image Resource IDs": 1060 is the XMP packet
	resourceXMP = 1060

	// positionTolerance allows for guides landing on whole pixels: thirds of 800 px sit at 33.25%
	positionTolerance = 0.005
)

type annotation struct {
	Axis     Axis
	Position float64
	Role     Role
	Label    string
}

// annotate attaches labels to guides, matching on axis and position; an annotation matching no guide is
// dropped
func annotate(guides []Guide, annotations []annotation) []Guide {
	for i, guide := range guides {
		for _, a := range annotations {
			if a.Axis == guide.Axis && math.Abs(a.Position-guide.Position) <= positionTolerance {
				guides[i].Role = a.Role
				guides[i].Label = a.Label
				break
			}
		}
	}
	return guides
}

// parseAnnotations reads guide descriptions out of an XMP packet; anything unreadable yields none
func parseAnnotations(packet []byte) []annotation {
	decoder := xml.NewDecoder(bytes.NewReader(packet))

	// Searched by name: Photoshop and Adobe's toolkit nest rdf:Description at different depths
	for {
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

// A nested struct rather than an "a>b" path, which does not carry namespaces through each segment
type xmpGuides struct {
	Seq xmpSeq `xml:"http://www.w3.org/1999/02/22-rdf-syntax-ns# Seq"`
}

type xmpSeq struct {
	Items []xmpGuide `xml:"http://www.w3.org/1999/02/22-rdf-syntax-ns# li"`
}

// xmpGuide reads both the attribute and the child-element form, since Adobe's toolkit rewrites one as the
// other
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
			// An unrecognised role keeps the label
			Role:  parseRole(pick(item.RoleElem, item.RoleAttr)),
			Label: strings.TrimSpace(pick(item.LabelElem, item.LabelAttr)),
		})
	}

	return out
}

// pick prefers the expanded form, which a packet normalised by Adobe's toolkit carries
func pick(elem, attr string) string {
	if strings.TrimSpace(elem) != "" {
		return elem
	}
	return attr
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
