# Design

## Context

The Investigation dashboard is a lazily loaded view in the desktop app. Its only analysis dependency is the `exif-insights` package. The app's `investigation-archive` package also stores project images, OCR and forensic results, saved workflows, imports, and view state; Workbench depends on that package.

## Goals / Non-Goals

**Goals:**
- Remove the Investigation dashboard UI, its analysis-only package, and the feature-flag code that has no remaining consumer.
- Preserve projects and Workbench behavior, and map legacy Investigation view state to Workbench.

**Non-Goals:**
- Renaming projects, `.investigation` data, project database tables, archive APIs, or the Workbench's database package.
- Removing metadata inspection from Map, List, or the details panel.
- Removing OCR, image-forensics, image-processing, or workflow middleware.

## Decisions

- Remove the Investigation view type and its desktop/mobile navigation entry points. Keep the splash and project-management flows, which create and reopen projects used by Workbench.
- Delete `exif-insights` and the dashboard and analysis components that have no consumers outside that view. Keep shared metadata parsing and image-forensics packages.
- Remove the now-unused `EXIFHOUND_FEATURES`/`__FEATURE_FLAGS__` plumbing and its documentation, tests, Vite definitions, and Turbo environment declarations; retain `__DEV__` and update-channel behavior.
- Remove the Investigation-only selected-tool field from app session mapping. Preserve the existing database/archive schema for backwards compatibility, but stop writing or reading that field. Normalize old `viewMode: investigation` values to `workbench` when binding a project.
- Keep the persisted view mode contract limited to `map`, `list`, and `workbench`; test the legacy normalization with existing project-session fixtures.

## Risks / Trade-offs

- [Projects saved while Investigation was active may reopen to a different surface] → Normalize those sessions to Workbench and discard the unavailable selected-tool value.
- [Deleting the dashboard also removes cross-image coverage, timeline, and anomaly summaries] → This is the requested product removal; individual image metadata and Workbench-supported tools remain available.
- [Removing the feature-flag build variable may affect external build scripts] → Search repository workflows and release configuration, remove all in-repo references, and document that the variable is no longer supported.
- [Over-broad deletion could remove code used by Workbench] → Confirm dependency references before deleting, especially preserve `investigation-archive`, `workbench-workflow`, OCR/forensic middleware, and Workbench node components.

## Migration Plan

1. Remove Investigation navigation, view rendering, dashboard/analysis components, `exif-insights`, and feature-flag infrastructure.
2. Adapt project session serialization and legacy view restoration without changing archive/database format.
3. Update tests and contributor docs, then build packages and app, run desktop unit and Playwright suites, and validate OpenSpec.

