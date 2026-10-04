# PRODUCT.md — Exif Hound

## What this is

Exif Hound is a cross-platform desktop application (Tauri + React) for inspecting,
visualizing, and managing EXIF metadata in photos. Users import images, see what
metadata they carry (GPS location, camera, lens, timestamps, software), view photo
locations on an interactive map, run investigative analyses, and export findings
as JSON or CSV. A signed auto-updater keeps installs current.

## Audience

Privacy-conscious photographers, journalists, and OSINT/investigation users who
need to know what their images reveal — and where they were taken — without a
command line or a cloud upload. All processing happens locally.

## Product truth

- **Local-first.** Images and metadata never leave the machine; native file
  dialogs and filesystem come from Tauri plugins, not browser APIs.
- **Investigation-grade.** The Investigation view (timelines, device dendrogram,
  software-processing analysis, geographic analysis) is a first-class surface,
  not a gimmick. Precision and accuracy of metadata matter more than flourish.
- **Monorepo layout.** `apps/exif-hound-desktop` is the product; `apps/exif-hound-website`
  is marketing/site; `packages/exif-middleware` holds EXIF processing. The desktop
  app is the design center of gravity.

## Surface modes

| Surface | Mode | Success looks like |
| --- | --- | --- |
| Desktop app (uploader, map, list, gallery, EXIF views) | **Operate** | Fast scanability, consistent states, native-app expectations |
| Investigation views | **Operate (dense)** | Information density without disorientation |
| Website (`apps/exif-hound-website`) | **Persuade** | Earn download action |

## Non-goals

- No cloud sync, accounts, or upload of user imagery.
- No mobile app; the desktop layout targets desktop-first, with responsive
  fallbacks for narrow windows, not phones.
