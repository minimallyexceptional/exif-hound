# Design: Persist EXIF write-then-reload

## Store
`addImage` already inserts `JSON.stringify(exif ?? null)` and SELECTs the new row by `disk_path`. Return `JSON.parse(rows[0].exifJson)` as `ImageRecord.exif`. Corrupt JSON throws `InvalidProjectError` with the same message as `listImages`. Do not return the input object.

## Session hydrate
`applyPersistedExif(image, record)` copies `projectImageId` and `exif` from the DB record onto the existing `ImageData`. It keeps `id`, `url`, `file`, and `isProcessing`. Do not call `toImageData` on this path (it mints a new session id and blob URL).

## App
`persistImage` already calls `addImage` after EXIF extraction. On success:

```
setImages(current =>
  current.map(image =>
    image.id === imageData.id ? applyPersistedExif(image, savedImage) : image
  )
);
```

Placeholder rows stay in memory until persist completes. `serializeExif` still strips `location.loading` before the write, so the reloaded copy has `loading: false`.

## Identity
Rebuild-from-`listImages` is rejected: new blob URLs, lost selection, and it would wipe in-memory GPS place-name patches.
