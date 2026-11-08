package croptemplate

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAnnotationsReadInEitherEncoding(t *testing.T) {
	for name, entry := range map[string]entryFunc{"shorthand attributes": shorthandEntry, "expanded elements": expandedEntry} {
		t.Run(name, func(t *testing.T) {
			template, err := Parse(facePSDWithPacket(xmpPacket(entries(800, 1200, faceGuides, entry))))
			require.NoError(t, err)
			assert.Equal(t, faceTemplate, template)
		})
	}
}

func TestAnnotationsToleratePixelRoundingAndCasing(t *testing.T) {
	template, err := Parse(buildPSD(800, 1200,
		resourceBlock(guidesResourceID, guidesBlock([]rawGuide{{px(399), rawHorizontal, "", ""}})), // a third of 1200, on a whole pixel
		resourceBlock(xmpResourceID, xmpPacket(shorthandEntry("y", 1.0/3.0, "Reference", "Collarbone")))))
	require.NoError(t, err)
	assert.Equal(t, []Guide{{AxisY, 399.0 / 1200, RoleReference, "Collarbone"}}, template.Guides)
}

func TestAnnotationsCannotInventGuides(t *testing.T) {
	packet := xmpPacket(entries(800, 1200, faceGuides, shorthandEntry) + "\n" +
		shorthandEntry("Y", 0.611, "anchor", "A line the template does not have"))
	template, err := Parse(facePSDWithPacket(packet))
	require.NoError(t, err)
	assert.Equal(t, faceTemplate, template)
}
