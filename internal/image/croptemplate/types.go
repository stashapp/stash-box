package croptemplate

// Axis is a guide's orientation, which also decides what its position is a fraction of
type Axis string

const (
	AxisX Axis = "X"
	AxisY Axis = "Y"
)

// Role is how closely a guide is meant to be followed
type Role string

const (
	RoleAnchor    Role = "ANCHOR"
	RoleReference Role = "REFERENCE"
	RoleMargin    Role = "MARGIN"
)

// Guide is one line of a template
type Guide struct {
	Axis Axis
	// Position is a fraction of the canvas along Axis, so a template drawn at one size renders at every other
	Position float64
	Role     Role
	Label    string
}

// Template is the geometry of one crop
type Template struct {
	Width  int
	Height int
	Guides []Guide
}

// AspectRatio is width over height
func (t Template) AspectRatio() float64 {
	return float64(t.Width) / float64(t.Height)
}
