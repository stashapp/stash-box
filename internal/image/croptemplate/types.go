// Package croptemplate serves the crop guide geometry behind the image
// editor's overlay
//
// The .psd files under templates/ are the authoring artifact: the bytes a
// contributor downloads are the bytes the checked-in geometry was generated
// from (see gen), so the two cannot drift -- a test re-parses every served
// file and compares. The server itself carries no PSD parser; that lives in
// psdparse, imported only by the generator and the tests
package croptemplate

// Axis is a guide's orientation, which also decides what its position is a
// fraction of
type Axis string

const (
	AxisX Axis = "X"
	AxisY Axis = "Y"
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
