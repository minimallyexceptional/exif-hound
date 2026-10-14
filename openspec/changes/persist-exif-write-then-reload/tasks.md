# Tasks: persist-exif-write-then-reload

- [x] `addImage` returns `JSON.parse(exif_json)` from the inserted row (not the input object); package tests
- [x] `applyPersistedExif` copies DB `exif` + `projectImageId` and preserves session identity; desktop tests
- [x] `persistImage` hydrates from the saved `ImageRecord`
- [x] Changelog; `openspec validate --all`
