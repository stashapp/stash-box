# Built-in crop templates

One `.psd` per Crop type, named for its image type key, embedded in the binary
so the feature needs no setup.

A template's geometry is its ruler guides; layers are not read, so an
outline drawn on a shape layer -- an oval for a face to sit inside -- is
invisible to the overlay. A line a template wants shown has to be a guide.

| File                          | Notes                                              |
| ----------------------------- | -------------------------------------------------- |
| `CROP_FACE.psd`               | 1000x1500                                          |
| `CROP_HEADSHOT.psd`           | split out of the old CROP_FACE/CROP_BUST range     |
| `CROP_BUST.psd`               |                                                    |
| `CROP_TORSO.psd`              |                                                    |
| `CROP_THREE_QUARTER.psd`      |                                                    |
| `CROP_THREE_QUARTER_PLUS.psd` |                                                    |
| `CROP_FULL_BODY.psd`          | margins and thirds on both axes                    |
| `CROP_WIDE.psd`               | the only 16:9 template                             |

## Labels

Each file carries an XMP packet naming its guides -- "bisects the eyes",
"where the thighs meet" -- so one file is the whole template and a downloaded
copy cannot arrive separated from its annotations.

stash-box only **reads** that packet; authoring it is out of scope for this
application. Labels are optional -- a template with guides and no XMP is a
working overlay, just an unlabelled one.

## Changing one

Drop the replacement in under the same name. Nothing in the code knows where a
line is meant to sit, so there is nothing else to update -- the tests check
that whatever ships parses and is usable, not that it matches a table someone
typed.

If the replacement brings its own XMP, it is already annotated. If not, it
still works, just without the label text.
