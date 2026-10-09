# Design: Workbench View

## Context

The desktop app already owns a selected image in `App.tsx` and uses the shared `ImageGallery` as the Map View's vertical sidebar. The Workbench adds a second composition for that same dataset and selection state. It inherits the desktop app's dark-first evidence-board design, app color tokens, existing typography, and light theme inversion.

## Layout

- The content area is a full-height workspace below the app header.
- Above the gallery, use a two-column layout: a flexible image stage on the left and a fixed-width tools sidebar on the right.
- The image stage uses available space for a large image, contained without cropping. Show a filename and concise selection context without competing with the image.
- The tools sidebar has a clear heading and a short vertical list of disabled/future tool entries, including OCR and reverse image search. Each entry communicates that it is planned and is not actionable yet.
- The horizontal gallery spans the full width along the bottom. Its height is bounded so the image stage retains priority. Gallery thumbnails scroll horizontally and retain selected-image emphasis.
- At narrower window widths, preserve the workspace hierarchy while allowing the tools sidebar to move below or collapse before the gallery becomes unusable.

## Shared gallery behavior

Extend `ImageGallery` with an explicit orientation option. Vertical remains the default and keeps Map View behavior. Horizontal uses a horizontal scroll container and horizontal virtualization, with item sizing appropriate for a bottom strip. Selection, filtering of imported points without images, keyboard activation, and scrolling the selected image into view work in either orientation.

## States

- With no images, show a calm empty state explaining that imported images will appear in the workbench; keep future tools visibly unavailable.
- With images but no current selection, show an instructional prompt in the image stage and let gallery selection populate it.
- With a selected image, display its full image fitted within the stage. If its URL fails, show a token-based unavailable-image fallback while preserving its filename.
- The tool placeholders remain non-interactive and visually subordinate to the selected image and gallery.

## Accessibility and themes

- Gallery items remain labeled buttons with `aria-pressed`; keyboard selection and visible focus work horizontally and vertically.
- Disabled tool entries are not exposed as actionable controls. Their future status is conveyed in readable text.
- Use token-based colors, preserve light-theme support, and honor reduced-motion behavior.

## Implementation notes

- The shared gallery accepts a `vertical` or `horizontal` orientation; vertical remains the default for Map View. Its virtualizer switches axis and thumbnail sizing with the selected orientation.
- Workbench is loaded lazily and uses the app's existing selected-image state. Its view mode is persisted with project session state.
- The tools sidebar lists OCR, reverse image search, and similar image matching as unavailable future tools.

## Out of scope

Implementing OCR, reverse image lookup, image editing, tool activation, image persistence changes, or a new data model.
