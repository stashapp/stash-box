// Package croptemplate reads crop guide geometry out of Photoshop template
// files
//
// The .psd files are the source of truth for the crop overlay, rather than a
// table in Go that a writer turns into downloadable files. The bytes a
// contributor downloads are the bytes the frame in the edit form was parsed
// from, so the two cannot drift
package croptemplate

import (
	"encoding/binary"
	"errors"
	"fmt"
	"sort"
)

// ErrNoGuides reports a structurally valid PSD carrying no guides. Separate
// from a parse failure because the file is fine and the mistake in it is a
// specific one: guides were drawn as lines rather than dragged off a ruler, or
// flattened away on export
var ErrNoGuides = errors.New("psd contains no guides")

// Axis is a guide's orientation, which also decides what its position is a
// fraction of
type Axis string

const (
	AxisX Axis = "X"
	AxisY Axis = "Y"
)

// Guide is one line of a template
type Guide struct {
	Axis Axis
	// Position is a fraction of the canvas along Axis: 0 is the left or top
	// edge, 1 the right or bottom. Fractions rather than pixels because a
	// template is drawn at one size and rendered at every other
	Position float64

	// Role and Label come from the template's XMP, and are empty when it
	// carries none. A template with guides and no annotation is a usable
	// overlay, just an unlabelled one, so neither is required
	Role  Role
	Label string

	// Pivot marks the line a frame resizes about when Shift is held, and comes
	// from the XMP like the rest. Not derivable from Role: Role says how closely
	// a line is meant to be followed, this says what the frame turns about, and
	// in the face template the eye line is the softest line and also the right
	// one to resize around. At most one per axis; none means the centre
	Pivot bool
}

// Template is the geometry of one crop
type Template struct {
	Width  int
	Height int
	Guides []Guide
}

// AspectRatio is width over height, taken from the canvas rather than
// configured anywhere
func (t Template) AspectRatio() float64 {
	return float64(t.Width) / float64(t.Height)
}

// Layout of the guide payload, which container.go's walk delivers here whole
//
// Every number here is quoted from the Adobe Photoshop File Formats
// Specification, which is the only authority on any of it:
//
//	https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
//
// The section names below are that document's own headings. Naming them is
// worth the lines: checking whether a constant is right is otherwise a day of
// counting bytes against a hex dump, and a wrong one does not fail - it reads
// a plausible number out of the wrong offset and draws a shape nobody made
const (
	// "Image Resource IDs": 1032 is "(Photoshop 4.0) Grid and guides
	// information". Its payload, per "Grid and guides resource format", is a
	// version, the grid spacing, a guide count, then one fixed-size record per
	// guide -- position and axis, and nothing else. Labels cannot live here;
	// they come from the XMP resource instead.
	resourceGuides = 1032

	// The spec calls a guide's position "Location of guide in document
	// coordinates" and does not give the unit. It is 1/32 of a pixel: that is
	// what every other implementation assumes, and what this corpus confirms
	// -- CROP_FACE's eye line reads back at exactly 508.0625 px on a 1280-high
	// canvas, which is 16258 units and nothing else.
	guideUnitsPerPixel = 32

	// "Grid and guides resource format", per guide: 4 bytes of location and
	// 1 byte of direction.
	guideRecordLen = 5

	// The same section, before the records: 4 bytes of version, 8 of grid
	// cycle (horizontal then vertical), and 4 of guide count.
	guideHeaderLen = 16

	// Direction, same section: 0 is a vertical guide, 1 horizontal. A vertical
	// line is positioned across the width, which is AxisX here -- the two
	// vocabularies name it from different ends.
	axisVertical = 0
)

// Parse reads a template's geometry from PSD bytes
//
// Guides come back sorted by axis and then position. Photoshop stores them in
// the order they were created, which makes otherwise identical templates
// compare unequal and test failures hard to read
func Parse(data []byte) (Template, error) {
	// No pixel is ever decoded. A template is geometry, and a layer's raster
	// is several megabytes of something nothing here looks at.
	file, err := decode(data)
	if err != nil {
		return Template{}, fmt.Errorf("reading PSD: %w", err)
	}

	width, height := file.width, file.height
	if width <= 0 || height <= 0 {
		return Template{}, fmt.Errorf("PSD has empty canvas: %dx%d", width, height)
	}

	var guides []Guide
	if block, ok := file.res[resourceGuides]; ok {
		if guides, err = parseGuides(block, width, height); err != nil {
			return Template{}, fmt.Errorf("reading guides: %w", err)
		}
	}

	if len(guides) == 0 {
		return Template{}, ErrNoGuides
	}

	sort.Slice(guides, func(a, b int) bool {
		if guides[a].Axis != guides[b].Axis {
			return guides[a].Axis < guides[b].Axis
		}
		return guides[a].Position < guides[b].Position
	})

	// Annotations are optional and their absence is not an error, so a missing
	// or unreadable XMP packet costs the labels and nothing else
	if packet, ok := file.res[resourceXMP]; ok {
		guides = annotate(guides, parseAnnotations(packet))
	}

	return Template{Width: width, Height: height, Guides: guides}, nil
}

func parseGuides(block []byte, width, height int) ([]Guide, error) {
	r := &reader{buf: block}

	r.skip(4) // version
	r.skip(4) // grid cycle, horizontal
	r.skip(4) // grid cycle, vertical
	count := int(r.uint32())

	if r.err != nil {
		return nil, r.err
	}

	// The count is a length field in a file we did not write, so it is checked
	// against what the block can actually hold before it is used to size
	// anything. Divided rather than multiplied: the product overflows a 32-bit
	// int well before the comparison could catch it
	if count < 0 || count > (len(block)-guideHeaderLen)/guideRecordLen {
		return nil, fmt.Errorf("guide count %d exceeds block of %d bytes", count, len(block))
	}

	guides := make([]Guide, 0, count)
	for range count {
		location := r.uint32()
		axis := AxisY
		span := height
		if r.uint8() == axisVertical {
			axis = AxisX
			span = width
		}
		if r.err != nil {
			return nil, r.err
		}

		// A guide dragged off the canvas and left there is stored as it was
		// placed, and would reach the client as a Float of 167772.11. Refused
		// rather than clamped: a line outside the picture is a template someone
		// needs to look at, and pinning it to the edge would hide that while
		// drawing something the designer never placed
		position := float64(location) / guideUnitsPerPixel / float64(span)
		if position < 0 || position > 1 {
			return nil, fmt.Errorf("guide at %.3f is outside the canvas", position)
		}

		guides = append(guides, Guide{Axis: axis, Position: position})
	}

	return guides, nil
}

// reader walks a byte slice, refusing to read past the end
//
// Every length in the format is treated as untrusted regardless of where the
// file came from: a field can claim more bytes than the file holds, and
// slicing on it directly would panic inside a GraphQL resolver. The error is
// sticky, so a caller can read a run of fields and check once at the end.
type reader struct {
	buf []byte
	pos int
	err error
}

func (r *reader) remaining() int {
	if r.err != nil {
		return 0
	}
	return len(r.buf) - r.pos
}

// take advances by n, reporting whether the read was in bounds. A negative n
// is possible when a length field is read as a signed int, and is a truncation
// rather than a rewind
func (r *reader) take(n int) []byte {
	if r.err != nil {
		return nil
	}
	if n < 0 || n > len(r.buf)-r.pos {
		r.err = fmt.Errorf("truncated at byte %d: wanted %d bytes, %d remain", r.pos, n, len(r.buf)-r.pos)
		return nil
	}
	out := r.buf[r.pos : r.pos+n]
	r.pos += n
	return out
}

func (r *reader) skip(n int)         { r.take(n) }
func (r *reader) bytes(n int) []byte { return r.take(n) }

func (r *reader) uint8() uint8 {
	b := r.take(1)
	if b == nil {
		return 0
	}
	return b[0]
}

func (r *reader) uint16() uint16 {
	b := r.take(2)
	if b == nil {
		return 0
	}
	return binary.BigEndian.Uint16(b)
}

func (r *reader) uint32() uint32 {
	b := r.take(4)
	if b == nil {
		return 0
	}
	return binary.BigEndian.Uint32(b)
}
