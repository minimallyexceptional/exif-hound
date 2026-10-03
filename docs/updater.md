# EXIF HOUND Automatic Update System

This document describes the privacy-first automatic update system for EXIF
HOUND Community and EXIF HOUND Pro: architecture, privacy model, signing
keys, CI secrets, release publishing, and testing runbooks.

---

## 1. Architecture

The updater is built on the official Tauri updater (`@tauri-apps/plugin-updater`
+ `tauri-plugin-updater`) and the process plugin (`@tauri-apps/plugin-process`
+ `tauri-plugin-process`) for relaunching.

```
EXIF HOUND client                updates.exifhound.com          GitHub Releases
────────────────────             ─────────────────────          ───────────────
GET latest.json  ────────────►   /community/stable/latest.json
                                 /pro/stable/latest.json
                                 (static manifest)
                                 ◄──── version compared locally
if newer:  download artifact ◄──────────────────────────────────  release asset
           signature verified by Rust updater (minisign)
           user confirms restart (never forced)
           install + relaunch
```

Key property: **pull-based and anonymous**. The client fetches a small static
manifest over HTTPS, compares versions locally, and downloads signed artifacts
only when the user asks for them. There is no update server, no database, no
analytics backend — the manifests can be plain static files on any HTTPS host.

### Frontend service layout (`apps/exif-hound-desktop/src/services/updater/`)

| File                   | Responsibility |
|------------------------|----------------|
| `UpdateConfiguration`  | Editions, channels, feed URL namespace (declarative) |
| `UpdateState`          | State machine (`idle → checking → available → downloading → ready-to-install → installing → restarting`, plus `current` and `error`) with enforced transitions |
| `UpdateError`          | Typed errors: `CHECK_FAILED`, `DOWNLOAD_FAILED`, `VERIFY_FAILED`, `INSTALL_FAILED`, `UNAVAILABLE` |
| `UpdateBackend`        | `UpdaterBackend` interface + `TauriUpdaterBackend` (the only place plugin APIs are touched) |
| `UpdateScheduler`      | Startup check (~10 s) + 12-hour re-checks, injectable timers |
| `UpdateService`        | Central service: silent vs manual check semantics, download with progress, install/relaunch, single-flight guards |

UI components live in `src/components/updater/` (`UpdateNotification`,
`UpdateAvailableDialog`, `UpdateProgressDialog`, `UpdateReadyDialog`,
`UpdateErrorDialog`). UI never calls Tauri updater APIs directly.

### Manual check surfaces

- **Help menu → Check for Updates** (header, desktop + mobile menus)
- **Settings → About → Check for Updates** (also shows version + update status)

Behavior difference: automatic check failures are completely silent; manual
check failures show "Unable to check for updates. Please verify your internet
connection and try again."

---

## 2. Privacy model

**EXIF HOUND does not collect telemetry or analytics when checking for
updates. Update checks retrieve a static release manifest over HTTPS and do
not transmit investigation data, image metadata, filenames, usage information,
or persistent device identifiers.**

Concretely, an update check is exactly:

```
GET https://updates.exifhound.com/<edition>/<channel>/latest.json
```

The client does not transmit or store:

- current app version, OS version, or architecture
- installation IDs, device IDs, hardware IDs
- license data, Gumroad identity, email, or any account information
- filenames, EXIF data, GPS coordinates, or anything about an investigation
- usage information, tracking pixels, or fingerprints

No persistent identifier is ever generated for update checks. Nothing is
logged locally by the updater. Ordinary HTTPS hosting infrastructure
necessarily sees network-level information such as the client's IP address —
EXIF HOUND cannot avoid that and does not generate, store, correlate, or
transmit any identifying information beyond what the HTTPS request itself
requires.

Pro updates are deliberately **public**: the Pro manifest and Pro binaries are
publicly downloadable, signed artifacts. Pro *functionality* remains gated by
the existing license system, but update checks require no license or identity.
If private Pro binaries are ever required, the abstraction allows an
authentication provider to inject a short-lived pseudonymous entitlement token
containing no personal data — do not implement this until necessary.

There is no "ignore signature" option anywhere. A bad signature always
prevents installation.

---

## 3. Community vs Pro feeds

Each edition knows its own feed, compiled into its Tauri config:

| Edition   | Feed |
|-----------|------|
| Community | `https://updates.exifhound.com/community/stable/latest.json` |
| Pro       | `https://updates.exifhound.com/pro/stable/latest.json` |

Edition separation is enforced in three independent layers:

1. **Separate signing keys** compiled into each edition's config (see §4).
2. **Separate feed URLs** — a client only ever asks about its own feed.
3. **Manifest validation cross-checks artifact names** — a Community manifest
   referencing an artifact named `Exif Hound Pro…` (or vice versa) fails
   validation and can never be published.

## 4. Channels

| Channel    | Path                          | Purpose |
|------------|-------------------------------|---------|
| `stable`   | `/<edition>/stable/latest.json`   | Production releases |
| `beta`     | `/<edition>/beta/latest.json`     | Reserved for future use; the frontend + configs already support it |
| `internal` | `/<edition>/internal/latest.json` | Testing update chains (e.g. `2.7.0-test.1` → `2.7.0-test.2`) |

Production builds **never** point at the internal channel: the endpoint is
baked in at build time from `src-tauri/tauri.<edition>.conf.json`, and the
beta/internal overlays (`tauri.<edition>.<channel>.conf.json`) are only applied
when `EXIFHOUND_UPDATE_CHANNEL=beta|internal` is set by the build driver
(`scripts/build.mjs`). Prerelease versions are rejected in stable manifests by
`scripts/updater/manifest.mjs`.

## 5. Updater signing keys

Tauri updater signing (minisign) is **separate** from OS code signing
(§12, §13). Each edition has its own keypair:

- `EXIF HOUND Community` — community private key + community public key
- `EXIF HOUND Pro` — pro private key + pro public key

The public keys are compiled into `tauri.community.conf.json` /
`tauri.pro.conf.json` (`plugins.updater.pubkey`). The private keys live **only**
in CI secrets (§6) and in secure offline storage. They are **never** committed.

Generate a keypair (run for each edition):

```bash
npm run tauri -- signer generate -w ~/.keys/exifhound-community.key
# prompts for an optional password; prints the public key
npm run tauri -- signer generate -w ~/.keys/exifhound-pro.key
```

Paste each public key into the matching `tauri.<edition>.conf.json`.

**Treat a lost updater private key as a major release-management incident.**
Every installed client trusts artifacts signed with the key baked into its
build. If a private key is lost, previously installed clients can no longer
trust future updates and must manually install a new release signed with a new
key (a second, forced bridge release). Back both private keys up offline in at
least two secure locations.

Key rotation: generate a new keypair, ship one more release signed with the
**old** key that embeds the new public key in its own config, then sign all
subsequent releases with the new key.

## 6. Required CI secrets

| Secret | Purpose |
|--------|---------|
| `TAURI_SIGNING_PRIVATE_KEY_COMMUNITY`     | Community updater signing key (file contents or password+key) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD_COMMUNITY` | Community key password (empty if none) |
| `TAURI_SIGNING_PRIVATE_KEY_PRO`           | Pro updater signing key |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD_PRO`  | Pro key password (empty if none) |
| `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | Optional: macOS Developer ID signing + notarization (release builds succeed unsigned without them) |

Windows Authenticode signing is not currently configured; if a certificate is
acquired, wire the Tauri `bundle.windows.certificateThumbprint` /
`digestAlgorithm` / `timestampUrl` settings and keep the updater signature
step unchanged (both signatures coexist).

Example (placeholder values only — never commit real keys):

```bash
# .env.example style, local dev only
TAURI_SIGNING_PRIVATE_KEY_COMMUNITY="UNSIGN3DPRIVATEKEYCOMMENT...-----END TAURI PRIVATE KEY-----"
TAURI_SIGNING_PRIVATE_KEY_PASSWORD_COMMUNITY="example-only"
TAURI_SIGNING_PRIVATE_KEY_PRO="UNSIGN3DPRIVATEKEYCOMMENT...-----END TAURI PRIVATE KEY-----"
TAURI_SIGNING_PRIVATE_KEY_PASSWORD_PRO="example-only"
```

## 7. Canonical update artifacts

One predictable updater artifact per platform:

| Platform | Updater artifact | Initial distribution |
|----------|------------------|----------------------|
| macOS (Apple Silicon) | `Exif Hound <Edition>.app.tar.gz` + `.sig` | `.dmg` |
| Windows x64 | `Exif Hound <Edition>_<ver>_x64-setup.exe` (NSIS) + `.sig` | same NSIS installer (MSI also built) |
| Linux x64 | `Exif Hound <Edition>_<ver>_amd64.AppImage` + `.sig` | `.AppImage` (`.deb`/`.rpm` also built) |

Windows updates use NSIS only — do not alternate between MSI and NSIS between
releases. Native Linux package managers (`.deb`/`.rpm`/AUR) are **not** managed
by the updater; treat them as a separate future concern.

Not built today (architecture is ready for them): `darwin-x86_64` (no Intel
runner/build) and `linux-aarch64`. Do not add these targets to
`RELEASED_TARGETS` in `scripts/updater/manifest.mjs` until the pipeline
actually builds them.

## 8. Publishing a release

1. Bump the version **once** in `apps/exif-hound-desktop/src-tauri/tauri.conf.json`
   (the edition overlays inherit it), plus the Cargo.toml / package.json
   versions if applicable.
2. Commit to `main`, wait for CI to pass.
3. Tag and push: `git tag community-v2.7.0 && git push origin community-v2.7.0`
   (or `pro-v2.7.0`). The tag version must equal the app version or the
   release is rejected.
4. CI: `prepare` validates → `build` compiles macOS/Linux/Windows, signs
   updater artifacts, stages them → `publish` generates and validates
   `latest.json`, creates a hidden draft release, uploads every artifact, then
   makes the release public only after every upload succeeds.
5. Sync the manifest to the update domain (§9).
6. Never publish `latest.json` before all artifacts exist — the workflow
   enforces this; keep it that way.

Rollback policy: versions are monotonic. There are no downgrades. If a release
is broken, ship `x.y.z+1` with the fix. Keep several historical releases
available for manual recovery; do not delete old release assets.

## 9. Hosting

`updates.exifhound.com` must serve the static manifests:

```
updates.exifhound.com/community/stable/latest.json
updates.exifhound.com/pro/stable/latest.json
(+ community|pro × beta|internal later)
```

The binaries live on GitHub Releases; the manifest URLs point there. Because
clients permanently know only `updates.exifhound.com`, the storage backend can
change later without shipping a new client. Any HTTPS static host works
(S3+CloudFront, Cloudflare R2, Netlify, a tiny reverse proxy to the GitHub
release asset URLs, …). After each release, upload the new `latest.json` to
the matching path — that upload is the real "release is live" moment.

## 10. How manifests are generated

`scripts/updater/generate-update-manifest.mjs` scans the staged artifacts
(`staging/<target>/`), reads each `<artifact>.sig` file, and emits:

```json
{
  "version": "2.7.0",
  "notes": "…",
  "pub_date": "2026-10-12T18:00:00Z",
  "platforms": {
    "darwin-aarch64":  { "signature": "<minisign signature text>", "url": "https://github.com/<owner>/<repo>/releases/download/<tag>/<artifact>" },
    "windows-x86_64":  { … },
    "linux-x86_64":    { … }
  }
}
```

The `signature` field contains the **contents** of the `.sig` file (this is
what Tauri's static-manifest schema requires), not a URL to it.

`scripts/updater/validate-update-manifest.mjs` then re-checks everything: SemVer, RFC
3339 date, edition/channel policy (no prereleases in stable, no test builds
outside internal), target names, HTTPS-only URLs, non-empty signatures,
artifact ↔ edition naming cross-checks, duplicate platform keys, and (with
`--staging-dir`) that every referenced artifact + signature exists on disk.
`--check-urls` adds optional live HEAD requests; keep it out of default CI to
avoid flakiness.

## 11. Testing an update locally

Local dev builds (`npm run tauri:dev`) have no updater config — the frontend
service detects this and stays dormant. To test the updater end-to-end on your
machine:

1. Generate a **personal dev signing keypair** and put its public key into a
   local, **git-ignored** config, e.g. `src-tauri/tauri.dev.local.conf.json`
   (copy of the edition overlay with your dev pubkey + endpoints pointing at
   your test server, e.g. `http://localhost:8080/latest.json`).
2. Serve a signed artifact + manifest from that endpoint.
3. Run: `node scripts/build.mjs pro` (adjust `--config` args to include your
   local overlay, or set `TAURI_TARGET` for your platform).
4. Install the built app, bump the version in the manifest to a higher SemVer,
   launch the app, and verify the update notification appears ~10 s after
   startup.

## 12. Internal-channel update test (end-to-end)

This exercises the full discovery → download → verify → install → relaunch
cycle against the internal feed.

1. Generate a dev keypair (§11) and set the **internal overlay**
   (`tauri.<edition>.internal.conf.json`) pubkey + endpoints to your test
   host — locally only.
2. Build `2.7.0-test.1` (`EXIFHOUND_UPDATE_CHANNEL=internal node scripts/build.mjs pro`),
   install it.
3. Build `2.7.0-test.2`, sign its updater artifact with the same dev key
   (`TAURI_SIGNING_PRIVATE_KEY` env), serve its manifest from the internal
   endpoint.
4. Launch the installed test.1 build → notification for test.2 → Download →
   progress → Restart & Update → app relaunches as test.2 with preferences
   intact (map settings live in `localStorage` and survive updates).

## 13. Verifying bad signatures are rejected (required security test)

1. Build and sign a valid updater artifact (§11 or §12).
2. Serve it, but **modify the artifact bytes** (e.g. append one byte).
3. Serve a manifest whose `signature` still matches the original artifact.
4. Launch the installed client and run Check for Updates → Download.
5. Expected: the Rust updater fails signature verification during download;
   the app shows *"The downloaded update failed its security verification and
   was rejected. Nothing was changed on your system."* The current install is
   untouched. The service maps this to `VERIFY_FAILED` (unit-tested in
   `UpdateError`/`UpdateService`); the runtime behavior must be confirmed
   manually on each platform per the matrix below.

## 14. macOS: Developer ID signing, notarization, and updater signing

Three independent signatures end up on macOS artifacts:

1. **Developer ID code signature** — applied by the Tauri bundler when
   `APPLE_SIGNING_IDENTITY` (and notarization env) are set in CI.
2. **Apple notarization** — stapled by the bundler via `APPLE_ID` /
   `APPLE_PASSWORD` / `APPLE_TEAM_ID`.
3. **Tauri updater signature** — the `.app.tar.gz.sig`, produced from
   `TAURI_SIGNING_PRIVATE_KEY`.

The updater signature is verified *before* the tarball is unpacked; the OS
verifies the code signature when the new app is launched. If macOS signing
secrets are absent, builds succeed unsigned — users must right-click → Open
once, and Gatekeeper will complain; the updater itself still works because it
trusts the minisign signature, but shipping unsigned is discouraged.

## 15. Windows: Authenticode and updater signing

Updater signature: the NSIS `*-setup.exe.sig` (minisign) — verified by the
updater before the installer runs. Authenticode (if/when configured) is
independent and applied to the installer binary. The updater install mode is
`passive` (progress shown, no questions).

## 16. Bridge release migration strategy

The first release containing the updater is the **bridge release**. Users on
old builds (pre-updater) cannot be discovered or updated automatically — they
must install the bridge release manually, once. Release notes carry this
message:

> **Existing EXIF HOUND users:** please manually install this release. Once
> installed, EXIF HOUND can download future updates directly from within the
> app.

Do not attempt to build upgrade paths from builds that have no updater. After
the bridge release is out, the manual-download burden ends for users who
installed it.

## Update test matrix (runtime)

| Test | Win x64 | macOS ARM | Linux x64 |
|------|---------|-----------|-----------|
| Silent check (~10 s after launch) | manual | manual | manual |
| 12-hour re-check (mock clock) | unit-tested | unit-tested | unit-tested |
| Manual check up-to-date / available | manual | manual | manual |
| Download progress UI | manual | manual | manual |
| Signature verification pass/fail (§13) | manual | manual | manual |
| Install + relaunch | manual | manual | manual |
| Preferences preserved after update | manual | manual | manual |
| Offline: silent failure, app unaffected | manual | manual | manual |
| Malformed manifest rejected | manual | manual | manual |
| Community rejects Pro-signed artifact | manual | manual | manual |

Not automatically testable in CI today (no runner fleet): the runtime rows
above. Everything expressible as logic (state machine, scheduling, error
mapping, manifest generation/validation, edition separation) is unit-tested —
`npm run test --workspace=exif-hound-desktop` and `npm run test:scripts`.
