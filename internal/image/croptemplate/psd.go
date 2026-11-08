package croptemplate

import (
	"encoding/binary"
	"errors"
	"fmt"
	"sort"
)

// Guide payload layout, quoted from the Adobe Photoshop File Formats Specification:
//
//	https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
const (
	// "Image Resource IDs": 1032 is grid and guides information, one fixed-size position+axis record per guide
	resourceGuides = 1032

	// Positions are in 1/32 px, which the spec leaves unsaid and this corpus confirms
	guideUnitsPerPixel = 32

	// Per guide: 4 bytes of location and 1 of direction
	guideRecordLen = 5

	// Before the records: 4 bytes of version, 8 of grid cycle and 4 of guide count
	guideHeaderLen = 16

	// Direction 0 is a vertical guide, positioned across the width, which is AxisX here
	axisVertical = 0
)

// Parse reads a template's geometry from PSD bytes, with guides sorted by axis then position
func Parse(data []byte) (Template, error) {
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
		return Template{}, errors.New("psd contains no guides")
	}

	sort.Slice(guides, func(a, b int) bool {
		if guides[a].Axis != guides[b].Axis {
			return guides[a].Axis < guides[b].Axis
		}
		return guides[a].Position < guides[b].Position
	})

	guides = annotate(guides, parseAnnotations(file.res[resourceXMP]))
	for _, guide := range guides {
		if guide.Role == "" || guide.Label == "" {
			return Template{}, fmt.Errorf("guide %s at %.3f has no role and label in the XMP packet", guide.Axis, guide.Position)
		}
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

	// Checked against the block before sizing anything; divided rather than multiplied, since the product
	// overflows
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

		// A guide dragged off the canvas is refused rather than clamped, so the template gets looked at
		position := float64(location) / guideUnitsPerPixel / float64(span)
		if position < 0 || position > 1 {
			return nil, fmt.Errorf("guide at %.3f is outside the canvas", position)
		}

		guides = append(guides, Guide{Axis: axis, Position: position})
	}

	return guides, nil
}

// reader walks a byte slice with a sticky error instead of panicking on a length field past the end
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

// take advances by n, reporting whether the read was in bounds
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
