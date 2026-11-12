# Changelog

## 2.0.14 — 2026-11-12

- Expanded and reformatted App Store `info.xml` with localized names, summaries and full descriptions in all 11 supported languages; removed redundant user/admin/developer Resources links while retaining the project homepage.
- Moved the three existing App Store screenshots to the repository-root `screenshot/01.png`, `02.png` and `03.png` without changing their image data.
- Updated `appinfo/info.xml` to reference those public GitHub URLs directly. Removed the optional separate thumbnail references; Nextcloud can use the original screenshot as its preview.
- Removed App Store screenshot copies from the installed application runtime; screenshots remain in the public source repository only.
- Updated the EN/CZ README image references and the single-archive Publisher build process. No user data or database migration.

## 2.0.13

- Improved category management with a compact settings layout and double-click/Enter editing for editable categories.
- Added in-app category name history and suggestions, independent of browser autofill; suggestions open on interaction and use the full dropdown width.
- Improved note loading after API responses and user feedback when note data is temporarily unavailable.
- Preserved notes, sharing, icons and the existing stored data format; no content format migration in this release.
- Updated bilingual installation and release documentation: App Store signed installation is the primary path; `install.sh` is developer-only.
- Compatible with Nextcloud 35 and PHP 8.3+; requires Hacesoft Shared App Core 0.18.8+.

## 2.0.12 — 2026-10-20

- Compatible with Nextcloud 35 and PHP 8.3+.
- Requires Hacesoft Shared App Core 0.18.8+.
- No change to the stored note format.
