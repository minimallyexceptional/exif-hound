# Design: List view GPS Place column

## Display
`ImageList` GPS group is `defaultEnabled: true`. Columns: Place (~220px), Latitude, Longitude, Altitude.

Place value is `image.exif.location.formatted` when it is a non-empty (trimmed) string; otherwise "—". Full string is on the grid cell `title`. Not sortable.

## Selectable
Pass `cellClassName: () => 'selectable-value'` for Place through `gridColumns`. Do not special-case `VirtualDataGrid` by column id.

## Lookups
None. Upload and Evidence already write `exif.location`.
