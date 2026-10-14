# List View GPS Place Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the full Nominatim place name as the first GPS column in List view, and enable the GPS Data group by default.

**Architecture:** Display-only. `ImageList` reads `image.exif.location.formatted` already written by upload/Evidence. No Nominatim calls from List. GPS group `defaultEnabled` flips to true; Place is inserted as the first GPS column and marked `selectable-value` via `cellClassName`.

**Tech Stack:** React 19, TypeScript, Jest + Testing Library, existing `VirtualDataGrid`.

## Global Constraints

- Place is the full Nominatim `formatted` string (same source as Evidence Place).
- Place shows `—` when `formatted` is missing, empty, or whitespace-only (including loading and error).
- GPS Data column order: Place, Latitude, Longitude, Altitude.
- GPS Data is on by default with File Information and Temporal Data; Reset Columns restores those three.
- List view does not call Nominatim or persist place names.
- Place is not sortable.
- Place cells use `selectable-value`; do not change other list columns.
- Do not add dependencies.
- OpenSpec change `list-view-gps-place-column` exists before application code.

**Spec:** `docs/superpowers/specs/2026-10-13-list-view-gps-place-column-design.md`

---

## File map

- Create: `openspec/changes/list-view-gps-place-column/` (proposal, spec, design, tasks)
- Create: `apps/exif-hound-desktop/src/components/__tests__/ImageList.test.tsx`
- Modify: `apps/exif-hound-desktop/src/components/ImageList.tsx` (`ColumnDef`, `COLUMN_GROUPS` gps group, `gridColumns` mapping)
- Modify: `apps/exif-hound-desktop/CHANGELOG.md` (Unreleased)

---

### Task 1: OpenSpec change

**Files:**
- Create: `openspec/changes/list-view-gps-place-column/.openspec.yaml`
- Create: `openspec/changes/list-view-gps-place-column/README.md`
- Create: `openspec/changes/list-view-gps-place-column/proposal.md`
- Create: `openspec/changes/list-view-gps-place-column/design.md`
- Create: `openspec/changes/list-view-gps-place-column/tasks.md`
- Create: `openspec/changes/list-view-gps-place-column/specs/image-list/spec.md`

**Interfaces:**
- Consumes: approved design spec
- Produces: OpenSpec change `list-view-gps-place-column` that later tasks implement

- [ ] **Step 1: Scaffold the change**

From the repository root:

```bash
openspec new change list-view-gps-place-column --description "Show GPS Place in List view and enable GPS columns by default"
```

If the CLI writes stubs, replace them with the contents in the following steps. If it already created the folder, do not create a second change.

- [ ] **Step 2: Write OpenSpec artifacts**

`.openspec.yaml`:

```yaml
schema: spec-driven
created: 2026-10-13
```

`README.md`:

```markdown
# list-view-gps-place-column

Show Nominatim place names in List view GPS columns, enabled by default.
```

`proposal.md`:

```markdown
# Proposal: List view GPS Place column

## Why
Evidence already shows a Place label from reverse geocoding. List view has Latitude, Longitude, and Altitude, but they are off by default and there is no Place column, so investigators cannot scan place names in the spreadsheet.

## What Changes
- Enable the GPS Data column group by default in List view.
- Add a Place column as the first GPS column, showing `exif.location.formatted` (or "—").

## Impact
- `apps/exif-hound-desktop`: `ImageList` column groups and tests.

## Out of Scope
- Nominatim lookups from List view.
- Persisting place names or column visibility.
- Changing Evidence Place formatting.
```

`design.md`:

```markdown
# Design: List view GPS Place column

## Display
`ImageList` GPS group is `defaultEnabled: true`. Columns: Place (~220px), Latitude, Longitude, Altitude.

Place value is `image.exif.location.formatted` when it is a non-empty (trimmed) string; otherwise "—". Full string is on the grid cell `title`. Not sortable.

## Selectable
Pass `cellClassName: () => 'selectable-value'` for Place through `gridColumns`. Do not special-case `VirtualDataGrid` by column id.

## Lookups
None. Upload and Evidence already write `exif.location`.
```

`specs/image-list/spec.md`:

```markdown
# Spec delta: image-list

## ADDED Requirements

### Requirement: GPS columns visible by default
The List view spreadsheet SHALL show the GPS Data group (Place, Latitude, Longitude, Altitude) on a default mount and after Reset Columns.

#### Scenario: Default list columns include GPS
- **WHEN** the user opens List view without changing column visibility
- **THEN** the spreadsheet headers include Place, Latitude, Longitude, and Altitude

#### Scenario: Reset restores GPS columns
- **WHEN** the user turns GPS Data off and then chooses Reset Columns
- **THEN** Place, Latitude, Longitude, and Altitude headers are visible again

### Requirement: Place column shows reverse-geocoded name
The Place column SHALL show `exif.location.formatted` when that string is non-empty after trim, and "—" otherwise.

#### Scenario: Formatted place name present
- **WHEN** an image has `exif.location.formatted` set to a non-empty string
- **THEN** the Place cell shows that string

#### Scenario: Missing or empty place name
- **WHEN** an image has no location, empty or whitespace-only `formatted`, a loading location, or a location error
- **THEN** the Place cell shows "—"
```

`tasks.md`:

```markdown
# Tasks: list-view-gps-place-column

- [ ] ImageList tests for default GPS headers, Place values, Reset Columns
- [ ] GPS group default on; Place first; selectable-value; changelog
```

- [ ] **Step 3: Validate OpenSpec**

Run: `openspec validate --all`

Expected: PASS (no errors for `list-view-gps-place-column`)

- [ ] **Step 4: Commit**

```bash
git add openspec/changes/list-view-gps-place-column
git commit -m "docs: spec list-view GPS Place column in OpenSpec"
```

---

### Task 2: ImageList Place column and default GPS group

**Files:**
- Create: `apps/exif-hound-desktop/src/components/__tests__/ImageList.test.tsx`
- Modify: `apps/exif-hound-desktop/src/components/ImageList.tsx`
- Modify: `apps/exif-hound-desktop/CHANGELOG.md`

**Interfaces:**
- Consumes: `ImageData.exif.location?.formatted`; `VirtualDataGrid` `cellClassName?: (row: T) => string`
- Produces: GPS group on by default; Place column first in GPS Data

- [ ] **Step 1: Write the failing tests**

Create `apps/exif-hound-desktop/src/components/__tests__/ImageList.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ImageList from '../ImageList';
import type { ImageData } from '../../types';

function image(partial: Partial<ImageData> & { name: string; exif?: ImageData['exif'] }): ImageData {
  return {
    id: partial.id ?? partial.name,
    url: 'blob:x',
    file: { name: partial.name, type: 'image/jpeg', size: 1, lastModified: 0 },
    exif: partial.exif ?? {},
  };
}

function renderList(images: ImageData[]) {
  return render(
    <div style={{ height: 400 }}>
      <ImageList images={images} selectedImage={null} onSelect={jest.fn()} />
    </div>,
  );
}

function cellFor(fileName: string, headerName: string) {
  const headers = screen.getAllByRole('columnheader');
  const index = headers.findIndex((header) => header.textContent === headerName);
  const row = screen.getByText(fileName).closest('[role="row"]');
  if (!row || index < 0) {
    throw new Error(`missing row or header ${headerName}`);
  }
  return within(row).getAllByRole('gridcell')[index];
}

describe('ImageList GPS columns', () => {
  it('shows GPS headers including Place on a default mount', () => {
    renderList([image({ name: 'a.jpg' })]);
    expect(screen.getByRole('columnheader', { name: 'Place' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Latitude' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Longitude' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Altitude' })).toBeInTheDocument();
  });

  it('shows the formatted place name in Place', () => {
    renderList([image({
      name: 'geo.jpg',
      exif: {
        latitude: 51.5,
        longitude: -0.12,
        location: { formatted: 'Tower Bridge, London', loading: false },
      },
    })]);
    const place = cellFor('geo.jpg', 'Place');
    expect(place).toHaveTextContent('Tower Bridge, London');
    expect(place).toHaveClass('selectable-value');
  });

  it('shows an em dash when place name is missing or empty', () => {
    renderList([
      image({ name: 'none.jpg', exif: { latitude: 1, longitude: 2 } }),
      image({ name: 'empty.jpg', exif: { location: { formatted: '   ', loading: false } } }),
      image({ name: 'loading.jpg', exif: { location: { loading: true } } }),
      image({ name: 'err.jpg', exif: { location: { loading: false, error: 'Failed' } } }),
    ]);
    expect(cellFor('none.jpg', 'Place')).toHaveTextContent('—');
    expect(cellFor('empty.jpg', 'Place')).toHaveTextContent('—');
    expect(cellFor('loading.jpg', 'Place')).toHaveTextContent('—');
    expect(cellFor('err.jpg', 'Place')).toHaveTextContent('—');
  });

  it('restores GPS headers when Reset Columns is used', () => {
    renderList([image({ name: 'a.jpg' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Customize visible columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /GPS Data/i }));
    expect(screen.queryByRole('columnheader', { name: 'Place' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset columns to defaults' }));
    expect(screen.getByRole('columnheader', { name: 'Place' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test --workspace=exif-hound-desktop -- src/components/__tests__/ImageList.test.tsx --runInBand
```

Expected: FAIL — `Unable to find a ... columnheader ... Place` (GPS group is still `defaultEnabled: false`). Do not continue if the suite errors on import/compile instead of a missing Place header.

- [ ] **Step 3: Write minimal implementation**

In `apps/exif-hound-desktop/src/components/ImageList.tsx`:

1. Add optional `cellClassName` to `ColumnDef`:

```ts
interface ColumnDef {
  id: string;
  label: string;
  width: number | 'flex';
  align?: 'right';
  sortField?: SortField;
  value: (image: ImageData) => string;
  cellClassName?: (image: ImageData) => string;
}
```

2. Add a Place helper next to `na`:

```ts
const placeLabel = (image: ImageData): string => {
  const formatted = image.exif.location?.formatted;
  return typeof formatted === 'string' && formatted.trim().length > 0 ? formatted : '—';
};
```

3. Change the `gps` group: `defaultEnabled: true`, Place first:

```ts
{
  id: 'gps',
  label: 'GPS Data',
  icon: <MapPin className="w-4 h-4" />,
  defaultEnabled: true,
  columns: [
    {
      id: 'place',
      label: 'Place',
      width: 220,
      value: placeLabel,
      cellClassName: () => 'selectable-value',
    },
    { id: 'latitude', label: 'Latitude', width: 120, value: (img) => (img.exif.latitude != null ? `${img.exif.latitude.toFixed(6)}°` : '—') },
    { id: 'longitude', label: 'Longitude', width: 120, value: (img) => (img.exif.longitude != null ? `${img.exif.longitude.toFixed(6)}°` : '—') },
    { id: 'altitude', label: 'Altitude', width: 90, align: 'right', value: (img) => (img.exif.gpsAltitude ? `${img.exif.gpsAltitude}m` : '—') },
  ],
},
```

4. Pass `cellClassName` through `gridColumns`:

```ts
const gridColumns = useMemo(
  () => activeColumns.map((column) => ({
    id: column.id,
    label: column.label,
    width: column.width,
    align: column.align,
    sortField: column.sortField,
    value: column.value,
    cellClassName: column.cellClassName,
  })),
  [activeColumns],
);
```

Do not edit `VirtualDataGrid`. Do not call geocoding from `ImageList`.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test --workspace=exif-hound-desktop -- src/components/__tests__/ImageList.test.tsx --runInBand
```

Expected: PASS (4 tests).

Also run the virtualization suite so extra default columns did not break it:

```bash
npm test --workspace=exif-hound-desktop -- src/__tests__/performance/virtualization.test.tsx --runInBand
```

Expected: PASS.

- [ ] **Step 5: Changelog**

In `apps/exif-hound-desktop/CHANGELOG.md`, under `## Unreleased` → `### Added`, add (keep the existing Evidence GPS bullet):

```markdown
- **List view GPS:** Place is the first GPS column (full Nominatim name, or "—") and the GPS Data group is visible by default.
```

- [ ] **Step 6: Mark OpenSpec tasks done and validate**

In `openspec/changes/list-view-gps-place-column/tasks.md`, check both boxes `[x]`.

Run: `openspec validate --all`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/exif-hound-desktop/src/components/__tests__/ImageList.test.tsx \
  apps/exif-hound-desktop/src/components/ImageList.tsx \
  apps/exif-hound-desktop/CHANGELOG.md \
  openspec/changes/list-view-gps-place-column/tasks.md
git commit -m "feat(desktop): show Place and GPS columns in list view by default"
```
