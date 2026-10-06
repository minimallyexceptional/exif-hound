# Security policy

## Reporting a vulnerability

Exif Hound processes images locally and is designed to never transmit user
data. If you believe you have found a security vulnerability, **please do not
open a public GitHub issue**.

Report it privately via GitHub
[private vulnerability reporting](https://github.com/minimallyexceptional/exif-hound/security/advisories/new)
or by email to <minimallyexceptionalapps@gmail.com>.

Please include:

- A description of the issue and its impact
- Steps to reproduce or a proof of concept
- Affected versions

You can expect an initial response within a few days. We will credit reporters
in release notes unless they prefer to remain anonymous.

## Supported versions

| Version | Supported |
| --- | --- |
| Latest stable release | Yes |
| Older releases | No — please update via the in-app updater or the [releases page](https://github.com/minimallyexceptional/exif-hound/releases/latest) |

## Security design notes

- **Local-first processing.** Image metadata is parsed on-device (web worker +
  bundled middleware). Update checks are anonymous HTTPS requests to a static
  manifest; they transmit no image data, filenames, investigation data, or
  persistent identifiers.
- **Signed updates.** Release artifacts are signed (Minisign via the Tauri
  updater); clients verify signatures against the public key compiled into the
  app before installing anything. Update manifests are served over HTTPS from
  GitHub Pages.
- **Network access.** The only outbound traffic is the update feed, reverse
  geocoding of coordinates the user chooses to look up (OpenStreetMap
  Nominatim), and map tile requests.

## Signing key compromise

The update signing private key is held by the maintainer and never leaves CI
secrets. If you have reason to believe the signing identity is compromised,
please report it immediately using the channels above — affected users will be
notified with manual-installation instructions.