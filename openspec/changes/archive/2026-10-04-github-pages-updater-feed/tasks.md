# Tasks

## 1. Static update site

- [x] 1.1 Create a dependency-free `update-site` landing page that lists GitHub Releases and the stable, beta, and internal manifest paths; verify all links resolve to the documented project-site paths.
- [x] 1.2 Add a publisher that copies the static site to `gh-pages`, creates that branch if needed, updates only the requested channel manifest, and preserves all other files; verify its output contains the site and keeps untouched channel manifests.
- [x] 1.3 Add a Pages source workflow that publishes site changes to `gh-pages` with `contents: write` and serializes updates with release publication; verify the workflow paths, permissions, and concurrency configuration.

## 2. Updater endpoint migration

- [x] 2.1 Change stable, beta, and internal Tauri endpoints and the frontend feed resolver to the matching GitHub Pages URLs; update configuration tests to assert the three channel URLs.
- [x] 2.2 Update updater documentation with the Pages URL, required Pages branch setting, public-repository requirement, and one-time manual installation for builds using the retired feed; verify documented URLs match Tauri configuration.

## 3. Release workflow integration

- [x] 3.1 Update release workflow permissions and ordering so each validated manifest is uploaded to GitHub Releases and then published to the corresponding `gh-pages` channel; verify stable and internal channel mapping and preserved manifests.
- [x] 3.2 Add beta as a supported manual release channel with its own config overlay and manifest path; verify the workflow selects `tauri.beta.conf.json` and marks beta releases as prereleases.
- [x] 3.3 Run `openspec validate --all` and inspect the final diff for correct repository URLs, signing-key continuity, and no private-key exposure.
