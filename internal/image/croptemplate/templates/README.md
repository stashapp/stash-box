# Built-in crop templates

One `.psd` per Crop type, named for its image type key and embedded in the binary. A
template's geometry is its ruler guides; layers are not read. Every guide must be named in
the file's XMP packet (axis, position, role, label), or the server refuses to start.

| File                          | Canvas    |
| ----------------------------- | --------- |
| `CROP_FACE.psd`               | 1000x1500 |
| `CROP_BUST.psd`               | 1000x1500 |
| `CROP_HEADSHOT.psd`           | 800x1200  |
| `CROP_TORSO.psd`              | 800x1200  |
| `CROP_THREE_QUARTER.psd`      | 800x1200  |
| `CROP_THREE_QUARTER_PLUS.psd` | 800x1200  |
| `CROP_FULL_BODY.psd`          | 800x1200  |
| `CROP_WIDE.psd`               | 1920x1080 |

To change one, drop the replacement in under the same name and rebuild.
