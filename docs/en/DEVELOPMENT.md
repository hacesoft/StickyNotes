[🇨🇿 Česky](../cz/DEVELOPMENT_CZ.md) | [🇬🇧 **English**](DEVELOPMENT.md)

# Developer and release package guide

This repository includes complete application source. It is **not** itself an official signed Nextcloud App Store installation package.

| Path | Purpose |
| --- | --- |
| `src/` | Source tree installed as `custom_apps/hc_stickynotes/` (by a suitable deployment mechanism) |
| `docs/` | Public Czech/English instructions |
| `install.sh`, `uninstall.sh` | Developer-only Docker deployment/recovery and removal |
| `scripts/` | Helpers required by those Docker scripts |
| `build-release.sh` | Creates unsigned archives for later Publisher verification/signing |
| `release/` | Local generated archives, excluded from Git |

**Developer build:** Run `sh build-release.sh` from the project root. The script reads the canonical version and app ID from `src/appinfo/info.xml` and creates one **public input** `release/hc_stickynotes-2.0.14-full-source.zip` for Hacesoft Publisher plus two **internal unsigned** runtime outputs (`.zip` and `.tar.gz`). Publisher verifies and signs the runtime after CP21/HDS tests. GitHub-root `screenshot/01.png` to `03.png` are public presentation assets and are not part of the installed runtime package.

**Important:** ZIP and TAR.GZ produced by this script are **not code-signed**. For an official Nextcloud App Store release, the maintainer must first pass Hacesoft Publisher CP21 and HDS 1.2.1, sign the *exact final runtime package* with the private key and certificate, and register/publish its signed archive using the Nextcloud App Store process. The process has two distinct signing stages: Nextcloud app integrity signing adds `appinfo/signature.json` to the runtime tree; the final `.tar.gz` is then signed with SHA-512 for the App Store release record. Changing files or archive bytes after the relevant signature invalidates it. Keep the **private `.key`** secret. A `.csr` and issued `.crt` are public certificate materials used for registration, but none of these certificate files, private audit reports or deployment logs belong inside the GitHub application-source ZIP.

**Docker developer deployment:** Only if the local layout is compatible and you have backups, run `sudo sh install.sh`. It is a privileged deployment script, not the recommended method for users. See [installation guide](INSTALL.md) and [recovery](INSTALLER_RECOVERY.md). The public source contains no private HDS/CP21 evidence or internal tests: those are retained separately by the release maintainer.

[Official Nextcloud App Store developer guide](https://nextcloudappstore.readthedocs.io/en/latest/developer.html) · [Main README](../../README.md)
