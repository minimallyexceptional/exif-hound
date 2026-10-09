# Bug Analysis: "New investigation project" flow fails after creating an empty folder

## Follow-up fix (2026-10-08)

The worktree now resolves every picked folder through the native
`resolve_project_folder` command. It canonicalizes the selected path and grants
recursive filesystem scope to that exact directory. On Unix, it tries a
backslash-to-slash repair only if the literal selected path does not exist. The
shared `joinPath` function now emits native Windows separators for drive and
UNC roots, and POSIX separators for Linux/macOS roots. Recent projects are
resolved again before reopening.

The recursive dialog option, visible IPC errors, and partial-folder rollback
described below remain in place. The temporary debug command and logging have
been removed. Rust path repair, package path/layout tests, desktop unit tests,
project Playwright tests, typechecks, lint, and desktop production build pass.
Playwright mocks the Tauri bridge; a real GUI creation on each supported OS is
still the remaining end-to-end check. Sections below preserve the original
investigation history and should be read with this update in mind.

**Status of this document:** Written 2026-10-08, worktree `main-2`, branch `RC`.
Covers everything confirmed, ruled out, suspected, and still unresolved about the
new-project flow failure. Read this before touching the flow again.

---

## 1. Symptom history

| Era | Symptom |
|---|---|
| Original | Pick parent folder + name → an **empty project folder appears on disk**, UI says *"Failed to create the project folder."* (generic) |
| After fix attempts `a9d8113` (add `fs:allow-exists`) and `9a7995a` (create `data/` before `data.db`) | **Exactly the same behavior.** No change. |
| After current fix set (see §7) | The **real error is now visible** in the modal: `failed to open file at path: /home/bloodmachine\Documents\Investigations/ASdasd/data/data.db with error: No such file or directory (os error 2)` — note the **backslashes in the parent path** (see §5). |

Each "fix" changed code *inside* a permission boundary that was never actually
open — which is why nothing changed until the boundary itself was examined.

---

## 2. Architecture of the flow (who does what)

```
ProjectCreateModal.tsx        UI; calls onCreate(parent, name)
  └─ App.tsx: handleCreateProject
       └─ newStoreDeps() → { dbProvider (sql.js wasm), fs: TauriFsPort }
       └─ ProjectStore.create(deps, parent, name, version)      [packages/investigation-archive]
            ├─ fs.exists(rootPath)          → plugin-fs "exists"
            ├─ fs.mkdir(rootPath)           → plugin-fs "mkdir" (recursive)
            ├─ fs.mkdir(rootPath/data)      → plugin-fs "mkdir"
            ├─ dbProvider.open() + migrations (sql.js, in-webview, no IPC)
            ├─ fs.writeFile(rootPath/data/data.db)  → plugin-fs "write_file"
            ├─ fs.mkdir(rootPath/images)    → plugin-fs "mkdir"
            └─ insert investigation_meta row, flush
  └─ bindProject(store) — app enters the project

Parent folder comes from:
  projectDialogs.ts: pickParentFolder() → @tauri-apps/plugin-dialog open({directory: true})
```

- **JS → Rust**: `@tauri-apps/plugin-fs` 2.6.0; Rust `tauri-plugin-fs` 2.6.0,
  `tauri` 2.12.1, `tauri-plugin-dialog` 2.8.1, `rfd` 0.16.0 (GTK3 backend).
- Two different IPC encodings inside plugin-fs (verified in `dist-js/index.js`):
  - `mkdir` / `exists`: path as **plain JSON invoke argument**
  - `write_file`: path in a **percent-encoded IPC header** (`encodeURIComponent`)
  Both end in `SafeFilePath::from_str` / `PathBuf::from` in Rust, so encoding is
  *not* itself a bug — but it means the two commands take different decode code
  paths (relevant to §5).

---

## 3. CONFIRMED root cause #1 — the fs scope grant is non-recursive

**This was the original bug.** Verified in `tauri-plugin-dialog` 2.8.1
`src/commands.rs` (~line 160): when a folder is picked,

```rust
s.allow_directory(&path, options.recursive)?;   // options.recursive defaults to FALSE
```

`pickParentFolder()` called `open({ directory: true, multiple: false, title })`
— never setting `recursive`. A **non-recursive** grant adds exactly two glob
patterns:

- `/parent` (the folder itself)
- `/parent/*` (immediate children only)

The scope matches with `require_literal_separator: true`
(`tauri-2.12.1/src/scope/fs.rs`), so `*` **never crosses `/`**.

### Why exactly "empty folder + generic failure"

Every plugin-fs command funnels through `resolve_path` (`commands.rs` ~1560),
which checks `fs_scope.is_allowed(resolved_path)`:

| Step | Path | Matches? | Result |
|---|---|---|---|
| `exists(/parent/<name>)` | `/parent/*` | ✅ | ok → false |
| `mkdir(/parent/<name>)` | `/parent/*` | ✅ | **succeeds → empty folder on disk** |
| `mkdir(/parent/<name>/data)` | 2 levels deep | ❌ | rejected: *"forbidden path …"* |
| `writeFile(/parent/<name>/data/data.db)` | 3 levels deep | ❌ | rejected |

Steps 3–4 threw, but the error was masked (root cause #3), so the UI showed the
generic message while the folder tree was already half-created.

**Same root cause breaks "Open project":** picking a project root grants
`/root/*` only; reading `/root/data/data.db` is forbidden one level deeper.

---

## 4. CONFIRMED root cause #2 — the capability file's `**` patterns are dead

`src-tauri/capabilities/default.json` contains, for every fs permission:

```json
{ "identifier": "fs:allow-write-file", "allow": [{ "path": "**" }] }
```

**These entries grant nothing.** Verified in `tauri-2.12.1/src/path/mod.rs`
(`PathResolver::parse`): a bare `**` has no `$BASE`/`$HOME`-style prefix, so
`parse("**")` leaves it a **relative** pattern — and a relative glob never
matches the canonicalized **absolute** paths that `resolve_path` checks.

Consequences:

- Adding `fs:allow-exists` (commit `a9d8113`) did nothing — explainable only by this.
- The *real* runtime permission came solely from the dialog's
  `allow_directory(picked, recursive: false)` → root cause #1.
- The `**` entries are currently harmless but misleading. Either remove them or
  replace them with explicit base-dir-scoped paths; do **not** trust them as a
  safety net. (Decision left open — see §9.)

---

## 5. NEW, UNRESOLVED failure mode — backslash-mangled parent path

After fix §7 was applied **and confirmed served** by the running dev app
(verified by fetching the live Vite modules — `recursive: true` and the
rollback code were being served from `http://127.0.0.1:5176`), the next real
attempt failed differently:

### The evidence (screenshot + disk state, 2026-10-08 18:49)

Error shown in the modal:

```
failed to open file at path:
/home/bloodmachine\Documents\Investigations/ASdasd/data/data.db
with error: No such file or directory (os error 2)
```

That error text is emitted by plugin-fs `write_file_inner` (`commands.rs`
~1085–1140) — so this failure happened **at the writeFile step**, with a
resolved path whose parent apparently didn't exist.

Facts about the disk state at the same moment:

- `/home/bloodmachine/Documents/Investigations/ASdasd` **exists** (created
  18:49:16, same minute as the app launch at 18:49:00–02) — **forward slashes**,
  and it is **completely empty** (no `data/`, no `images/`).
- **No directory with a backslash in its name exists anywhere** that was
  searched (`/home`, `/tmp`, `/run`, the whole orca workspace tree; `-xdev`
  searches of `/` skip `/home`'s btrfs subvolume, but the `/home`-rooted search
  covered the relevant depth).
- The modal's "Parent folder" field displayed the mangled string verbatim:
  `parent` in JS state **was** `/home/bloodmachine\Documents\Investigations`.
  So the **dialog returned a backslash-containing string to JS**.
- The suffix `/ASdasd/data/data.db` uses forward slashes — that is our own
  `joinPath` output. Only the parent portion is mangled, and inconsistently:
  `/home/bloodmachine` is intact, then `\Documents\Investigations`.

### What this implies

The same logical path was treated **differently by different commands**: the
`mkdir`s somehow produced the *forward-slash* `ASdasd` on disk, while
`write_file` received the *backslash* parent. Candidate explanations, none yet
proven:

1. **Something between the GTK dialog result and the IPC return mangles the
   path** — rfd 0.16 gtk3 (`gtk_file_chooser_get_filename` → `PathBuf`, native
   paths), plugin-dialog desktop.rs (`FileHandle.path().to_path_buf().into()`,
   `dunce::simplified` — a no-op on Linux) and the serde serialization were all
   read and look clean, so the mangler is not yet identified.
2. **`mkdir` was scope-rejected for the backslash path and never ran; the
   forward-slash `ASdasd` came from an earlier step/attempt** — but `write_file`
   then reaching the OS (os error 2 rather than "forbidden path") implies its
   path *passed* the scope check, which the backslash path should have failed.
   Inconsistent — unresolved.
3. **Input-method / GTK location-entry artifact** — if the path was typed
   (Ctrl+L) rather than navigated, an IME or GTK completion bug could inject
   `\`. Unverified.
4. **The backslash dirs were created and later removed** — our new rollback
   (`removeDir` on the root) does exactly that on failure. If `mkdir` created
   `/home/bloodmachine\Documents\Investigations/…` (a folder literally named
   `bloodmachine\Documents\Investigations`), failed at `write_file`, and the
   rollback deleted it, the disk would now show nothing — **which matches the
   current disk state**. In this scenario the *forward-slash* `ASdasd` is a
   leftover from an *earlier* attempt. This is currently the **most consistent**
   story, but it still doesn't explain where the backslashes came from.

### Ruled out

- Our own code: `grep` over app + package sources finds **no** slash
  replacement/normalization anywhere in the project flow (`format.ts` only
  sanitizes *file names*, not the parent path).
- `rfd` 0.16 gtk3 backend, `tauri-plugin-dialog` 2.8.1 desktop bridge,
  `dunce::simplified` on Linux, `Url::to_file_path` — all read, all clean.
- JS/Rust plugin version mismatch — both are 2.6.0 (fs), 2.8.1 (dialog).
- `encodeURI/URIComponent` round-trip — decodes back to the same string.

### How to catch it (instrumentation plan — do this next)

The fastest path to truth is logging the exact strings at each hop, then one
repro attempt:

1. **JS side:** wrap `invoke` in dev (or add temp `console.log` in
   `TauriFsPort` / `projectDialogs`) to log the exact strings:
   `pickParentFolder` result, each `mkdir`/`writeFile` path.
2. **Rust side:** enable `tauri-plugin-log` at `Debug` (it currently logs at
   Info and its log file `~/.local/share/com.exifhound.app/logs/Exif Hound.log`
   was **empty**), and/or add two temporary `#[tauri::command]`s
   `debug_log_mkdir(path)` / `debug_log_write(path)` that `println!` their
   resolved paths before calling the same operations.
3. **Repro the dialog:** after picking, log the raw string in
   `handlePickParent` **before** anything else — that single line will confirm
   whether the dialog itself returns the mangled path.
4. Try both pick styles: mouse-navigation into the folder vs. Ctrl+L typed path.
5. Check whether an XDG portal is involved: run `ps aux | grep xdg-desktop`,
   and test the `xdg-portal` vs `gtk3` feature if needed
   (`tauri-plugin-dialog` defaults to `gtk3` in this repo).

---

## 6. Why all previous "fixes" and the E2E suite missed it

- **E2E (`project.spec.ts`) mocks the entire Tauri bridge** in
  `playwright/support/app.ts` (`bootApp`): `plugin:dialog|open` returns a canned
  path and plugin-fs is emulated in-page. **Scope enforcement only exists in the
  real Rust process** — so the suite can never catch permission or real-dialog
  bugs. Unit tests use `InMemoryFs`, which likewise can't.
- Fixes `a9d8113` / `9a7995a` rearranged calls inside the same forbidden zone.
- The generic error message (root cause #3) hid the actual reason every time.

---

## 7. Fixes currently in the working tree (uncommitted)

| File | Change |
|---|---|
| `apps/exif-hound-desktop/src/services/investigationArchive/projectDialogs.ts` | **Primary fix:** `recursive: true` in both `open()` calls → grant becomes `/parent/**`, covering the whole project tree |
| `apps/exif-hound-desktop/src/components/ProjectCreateModal.tsx` | Surface plain-string IPC rejections so real Tauri errors are shown instead of the generic fallback (this is what revealed §5) |
| `packages/investigation-archive/src/ports.ts` | `FsPort.removeDir(path)` added |
| `packages/investigation-archive/src/InMemoryFs.ts` | `removeDir` implementation (removes dir + descendants, records operation order) |
| `apps/exif-hound-desktop/src/services/investigationArchive/TauriFsPort.ts` | `removeDir` → plugin-fs `remove(path, { recursive: true })` |
| `packages/investigation-archive/src/ProjectStore.ts` | `create()` now **rolls back the half-created folder** on any mid-creation failure (best-effort `removeDir`, original error re-thrown) — no more retry dead-end where the retry dies with `ProjectExistsError` on a stale empty folder |

New/updated tests:

- `apps/.../__tests__/projectDialogs.test.ts` — asserts `recursive: true` is
  passed for both pickers (the actual regression).
- `apps/.../__tests__/TauriFsPort.test.ts` — `removeDir` maps to recursive remove.
- `packages/investigation-archive/tests/ProjectStore.test.ts` — failed creation
  leaves **no** empty folder behind and a retry succeeds.

---

## 8. Verification status

- `investigation-archive` package rebuilt (`npm run build --workspace=investigation-archive`) — the desktop app aliases its `dist`; **rebuild is required after package edits**.
- Package tests: 17/17 pass. Desktop unit tests: 236/236 pass. Desktop lint: 0 errors. Typecheck: clean.
- E2E `project.spec.ts` + `splash.spec.ts`: 7/7 pass (but see §6 limitations).
- Pre-existing, unrelated: `exif-middleware` lint fails on a clean tree too
  (ESLint migration issue) — blocks the root `npm run lint`; not caused by this work.
- **Not yet verified: a real in-app create attempt succeeding.** The §5 failure
  is the current blocker.

---

## 9. Open items / recommended next steps

1. **Instrument and repro §5** (plan in §5) — highest priority. The backslash
   mangling is unexplained and will bite again.
2. Consider hardening against mangling regardless of cause: in
   `handlePickParent` (or `pickParentFolder`), **validate/reject** a picked
   parent containing `\` on Unix with a clear message, instead of letting it
   propagate into the filesystem. (Debatable — could also normalize; rejecting
   is safer until the mangler is understood.)
3. Decide the fate of the dead `**` capability entries (§4): remove or replace
   with real scoped paths. Do not leave misleading config.
4. Consider a Tauri-level **integration test** that runs the real Rust side
   (e.g. `tauri-driver` or a headless run) for the project flow — the mocked E2E
   cannot cover scope/IPC issues (§6).
5. `exif-middleware` lint is broken repo-wide (pre-existing); fix or track
   separately so the pre-commit gate can run fully.
6. After everything passes for real, follow the OpenSpec workflow
   (`openspec/changes/project-folders`) to update the change artifacts, run
   `openspec validate --all`, and archive.
