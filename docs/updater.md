# Exif Hound automatic updates

Exif Hound uses Tauri's signed updater to check for, download, verify, and
install releases. There is one application, one update-signing identity, and
one feed per release channel.

## Architecture

The installed app fetches a small static manifest from:

| Channel | Manifest URL |
| --- | --- |
| Stable | `https://updates.exifhound.com/stable/latest.json` |
| Beta | `https://updates.exifhound.com/beta/latest.json` |
| Internal | `https://updates.exifhound.com/internal/latest.json` |

The manifest points to signed artifacts hosted on GitHub Releases. The public
key compiled into `src-tauri/tauri.conf.json` verifies those artifacts before
installation. The former Community signing key is the canonical key for the
consolidated app; the former Pro key is not used.

Update checks are pull-based and anonymous. They do not transmit license data,
image metadata, filenames, investigations, analytics, or persistent device
identifiers. As with any HTTPS request, the feed host can observe ordinary
network metadata such as an IP address.

## Signing key

Generate the keypair locally if it does not already exist:

```bash
mkdir -p "$HOME/.keys/exif-hound"
chmod 700 "$HOME/.keys/exif-hound"

npm run tauri --workspace=exif-hound-desktop -- signer generate \
  --write-keys "$HOME/.keys/exif-hound/community.key"
```

The files have different security requirements:

- `community.key.pub` is public and its complete contents belong in
  `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`.
- `community.key` is private. Never commit or share it. Back it up securely;
  losing it prevents installed clients from trusting future releases.
- The key password must also be stored securely.

The old Pro keypair can be retained as an archival backup, but no workflow or
application configuration references it.

## GitHub Actions secrets

The release workflow uses only these updater secrets:

| Secret | Value |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY_COMMUNITY` | Complete contents of `community.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD_COMMUNITY` | Password chosen when the key was generated |

Optional Apple signing and notarization secrets are:

- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

Without `APPLE_SIGNING_IDENTITY`, macOS artifacts build unsigned. When it is
set, the named certificate must already exist in the runner keychain; importing
a Developer ID certificate is a separate CI setup step. The three notarization
secrets are optional but must be configured together.

## Application configuration

Stable builds use `src-tauri/tauri.conf.json`. Non-stable builds merge one
small channel overlay after the base config:

- `src-tauri/tauri.beta.conf.json`
- `src-tauri/tauri.internal.conf.json`

The overlays change only the manifest endpoint. They inherit the product name,
identifier, updater public key, and all other settings from the base config.

The Vite build receives `EXIFHOUND_UPDATE_CHANNEL` for diagnostics and display.
The actual endpoint used by the native updater always comes from the Tauri
configuration.

## Release workflow

The workflow in `.github/workflows/release.yml` performs these steps:

1. Validate that the release version matches `tauri.conf.json`.
2. Build macOS Apple Silicon, Windows x64, and Linux x64 artifacts.
3. Sign updater artifacts with the Community private key.
4. Stage installers and signatures from all platforms.
5. Generate and validate `latest.json` from the staged files.
6. Create a draft GitHub release, upload every file, then publish it only after
   all uploads succeed.

### Stable release

Update the version consistently, commit it, then push an exact `v<version>` tag:

```bash
VERSION=$(node -p "require('./apps/exif-hound-desktop/src-tauri/tauri.conf.json').version")
git tag "v${VERSION}"
git push origin "v${VERSION}"
```

The workflow rejects a tag that does not exactly match the configured version.
After the workflow completes, publish its generated `latest.json` at:

```text
https://updates.exifhound.com/stable/latest.json
```

### Internal release

Run the Release workflow manually and choose `internal`. Internal runs merge
`tauri.internal.conf.json`, publish a prerelease under an
`internal-v<version>` tag, and produce a manifest for:

```text
https://updates.exifhound.com/internal/latest.json
```

On Windows, internal prereleases build the NSIS installer only. WiX/MSI does
not accept textual SemVer prerelease identifiers such as `test.1`; NSIS is the
Windows artifact used by the updater and supports the internal version scheme.

For an actual update-chain test, use increasing SemVer prerelease versions
(for example `2.6.0-test.1` then `2.6.0-test.2`). A client will not offer an
update whose manifest version is equal to or older than its installed version.

## Manifest tooling

The generator reads real staged artifacts and their adjacent `.sig` files:

```bash
node scripts/updater/generate-update-manifest.mjs \
  --channel stable \
  --version 2.6.0 \
  --tag v2.6.0 \
  --repo minimallyexceptional/exif-hound \
  --staging-dir staging \
  --out latest.json
```

Validate the result offline before publishing:

```bash
node scripts/updater/validate-update-manifest.mjs latest.json \
  --channel stable \
  --version 2.6.0 \
  --tag v2.6.0 \
  --repo minimallyexceptional/exif-hound \
  --staging-dir staging
```

Validation covers SemVer and channel policy, RFC 3339 publication dates,
required targets, HTTPS release URLs, non-empty signatures, safe filenames,
the consolidated Exif Hound artifact name, duplicate platform keys, and local
staging-file existence.

## Local checks

```bash
npm run test:scripts
npm run typecheck --workspace=exif-hound-desktop
npm test --workspace=exif-hound-desktop -- --runInBand
npm run build --workspace=exif-hound-desktop

cd apps/exif-hound-desktop/src-tauri
cargo fmt --check
cargo check
cargo test
```

Do not use the production private key for routine development builds. Generate
a separate local key and use a gitignored local Tauri overlay when exercising
the full signed-update flow outside CI.
