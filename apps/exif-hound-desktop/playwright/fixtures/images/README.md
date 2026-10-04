# E2E image fixtures

Binary fixtures used by the Cypress suite. **Do not hand-edit** — regenerate
with the script from the workspace root:

```bash
node scripts/generate-e2e-fixtures.mjs
```

Requires ImageMagick (`magick`) on PATH. The script is deterministic and
self-verifies its output with exifreader before exiting.

## `images/full-exif.jpg`

Gradient JPEG with full EXIF (IFD0 + Exif sub-IFD + GPS IFD). Every value is a
constant asserted by the specs:

| Field (app display)   | Embedded EXIF                              |
| --------------------- | ------------------------------------------ |
| Make                  | `TestCam`                                  |
| Model                 | `Hound-1`                                  |
| Date Taken            | `Sat, Jun 15, 2024, 10:30 AM` (embedded as EXIF `2024:06:15 10:30:00`) |
| Exposure Time         | `1/250`                                    |
| F-Number              | `8` (embedded as f/8.0)                    |
| ISO                   | `200`                                      |
| Focal Length          | `35mm` (embedded as 35 mm)                 |
| Coordinates           | `51.500000, -0.127778` (51°30'0"N 0°7'40"W) |

## `images/no-gps.jpg`

Gradient JPEG with Make `TestCam` / Model `Hound-2` and **no GPS IFD** — used
for the "image without location" edge cases (no map marker, "N/A" metadata).

## `images/corrupt.jpg`

512 bytes of deterministic pseudo-random garbage with a `.jpg` name — used for
the upload error path (EXIF parse fails, app must not crash).

## `import/points.kml`

Valid KML 2.2 document with two placemarks: `Site Alpha` (-0.1278, 51.5074)
and `Site Beta` (-0.0754, 51.5089).

## `import/invalid.txt`

Plain text that is neither KML nor CSV location data — used for the
invalid-import error path.

## How the EXIF is written

This machine's ImageMagick build can only *read* EXIF, so the script injects a
hand-built APP1 `Exif\0\0` segment (little-endian TIFF with IFD0, Exif sub-IFD
and GPS sub-IFD) after the JPEG SOI marker — see `injectExif` in
`scripts/generate-e2e-fixtures.mjs`.