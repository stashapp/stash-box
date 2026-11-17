package croptemplate

import (
	"fmt"
)

// Walks the PSD container down to the two resources a template needs; PSB (64-bit lengths) is refused

// psdFile is the part of a parsed container the rest of the package reads.
type psdFile struct {
	width  int
	height int
	// res maps an image resource ID to its raw payload
	res map[int][]byte
}

// "File header section": signature, then version 1 for PSD or 2 for PSB
const (
	psdSignature = "8BPS"
	psdVersion   = 1
)

// decode walks a container as far as the image resources; nothing after them is read
func decode(data []byte) (psdFile, error) {
	r := &reader{buf: data}

	if sig := string(r.bytes(4)); r.err != nil || sig != psdSignature {
		return psdFile{}, fmt.Errorf("not a PSD file: signature %q", sig)
	}
	if version := r.uint16(); r.err != nil || version != psdVersion {
		return psdFile{}, fmt.Errorf("unsupported PSD version %d", version)
	}

	r.skip(6) // reserved
	r.skip(2) // channel count
	height := int(r.uint32())
	width := int(r.uint32())
	r.skip(2) // bit depth
	r.skip(2) // colour mode

	// "Color Mode Data Section": a length and a payload only indexed-colour and duotone files fill in
	r.skip(int(r.uint32()))

	resources, err := parseResources(r.bytes(int(r.uint32())))
	if err == nil {
		err = r.err
	}
	if err != nil {
		return psdFile{}, err
	}

	return psdFile{width: width, height: height, res: resources}, nil
}

// parseResources walks the "Image Resources Section": signature, ID, Pascal-string name and padded payload
// per block
func parseResources(block []byte) (map[int][]byte, error) {
	r := &reader{buf: block}
	resources := map[int][]byte{}

	for r.remaining() > 0 {
		if sig := string(r.bytes(4)); r.err != nil || sig != "8BIM" {
			return nil, fmt.Errorf("image resource block has signature %q, want 8BIM", sig)
		}
		id := int(r.uint16())

		nameLen := int(r.uint8())
		r.skip(nameLen)
		if (1+nameLen)%2 != 0 {
			r.skip(1)
		}

		size := int(r.uint32())
		data := r.bytes(size)
		if size%2 != 0 {
			r.skip(1)
		}
		if r.err != nil {
			return nil, r.err
		}

		resources[id] = data
	}

	return resources, nil
}
