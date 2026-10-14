# GPS Evidence Place Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When place names are enabled, look up missing GPS labels during Evidence compilation and write them back onto session images.

**Architecture:** Pure `resolveMissingGpsPlaceNames` + `applyGpsPlaceNamePatches` used by `EvidenceHubService.loadIndex`. EvidenceView reads the privacy setting and reports patches; App merges into `images` without `persistImage`.

**Tech Stack:** TypeScript, Jest, existing Nominatim helper (`getLocationFromCoordinates`).

## Global Constraints

- Reuse `getLocationFromCoordinates`; no new network client.
- Gate on `privacySettings.reverseGeocoding`.
- Do not call `persistImage` / `addImage` for write-back.
- Inject lookup in tests; no live Nominatim.

---

### Task 1: Resolver

**Files:**
- Create: `apps/exif-hound-desktop/src/services/evidence/resolveGpsPlaceNames.ts`
- Test: `apps/exif-hound-desktop/src/services/evidence/__tests__/resolveGpsPlaceNames.test.ts`

**Produces:** `resolveMissingGpsPlaceNames`, `applyGpsPlaceNamePatches`, `GpsPlaceNamePatch`

- [ ] Failing tests for skip-when-disabled, skip-existing-label, patch-on-success, skip-failed-lookup
- [ ] Minimal implementation
- [ ] Tests pass

### Task 2: Hub service

**Files:**
- Modify: `apps/exif-hound-desktop/src/services/evidence/EvidenceHubService.ts`
- Test: `apps/exif-hound-desktop/src/services/evidence/__tests__/EvidenceHubService.test.ts`

- [ ] Failing tests: loadIndex returns `{ index, patches }`; lookup used when enabled
- [ ] Wire resolver into loadIndex
- [ ] Tests pass

### Task 3: View + App write-back

**Files:**
- Modify: `apps/exif-hound-desktop/src/components/evidence/EvidenceView.tsx`
- Modify: `apps/exif-hound-desktop/src/components/evidence/__tests__/EvidenceView.test.tsx`
- Modify: `apps/exif-hound-desktop/src/App.tsx`
- Modify: Settings copy, README, CHANGELOG, `types.ts` comment

- [ ] Failing EvidenceView tests for setting gate + onImagesPatched
- [ ] Wire setting, callback, App merge
- [ ] Tests pass
