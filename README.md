[🇨🇿 Česky](README_CZ.md) | [🇬🇧 **English**](README.md)


# Sticky Notes 2.0.12

A Nextcloud application developed by Hacesoft for personal and shared notes, tasks with due dates, categories, a Dashboard widget and optional notifications. Share notes with users or groups using view/edit permissions.

<img width="1134" height="617" alt="image" src="https://github.com/user-attachments/assets/c9e34307-17b8-4a27-97c3-cbb349a57cfe" />

## Requirements

- Nextcloud 35 and PHP 8.3 or newer.
- **[Hacesoft Core](https://github.com/hacesoft/core), version 0.18.8 or newer, installed and enabled.** Sticky Notes requires Core to function.

Core is a separate application; it is not bundled with Sticky Notes. Install it first using the instructions in the [Core repository](https://github.com/hacesoft/core).

## Installation and updates

Download and extract the complete source package. From the extracted project root, run:

```sh
sudo sh install.sh
```

The installer supports the documented Synology/Docker deployment. Read the [installation guide](docs/en/INSTALL.md) for prerequisites and upgrade instructions. Existing notes remain in the database during upgrades. Before updating, back up the database and application files.

To uninstall, read the removal section in the installation guide and use `sudo sh uninstall.sh` from the project root. Review the script's options before removing stored data.

## Documentation

- [Documentation index](docs/en/README.md)
- [User guide](docs/en/USER_GUIDE.md)
- [Sharing and permissions](docs/en/SHARING.md)
- [Editor](docs/en/EDITOR.md)
- [Dashboard widget](docs/en/DASHBOARD.md)
- [Settings](docs/en/SETTINGS.md)
- [Notifications](docs/en/NOTIFICATIONS.md)
- [Mobile layout](docs/en/MOBILE_LAYOUT.md)

## Source layout

`src/` contains the application runtime, `scripts/` installation helpers and `docs/cz/` and `docs/en/` Czech and English documentation. `install.sh` and `uninstall.sh` are included in the full source package. `build-release.sh` builds runtime ZIP/tarball artifacts from `src/`; generated output belongs in `release/`.

Maintainer information: [development](docs/en/DEVELOPMENT.md), [installation checks](docs/en/INSTALL.md) and [changelog](CHANGELOG.md).

License: [AGPL-3.0-or-later](LICENSE).

## Languages

The application UI supports all 11 languages: Czech (`cs`), English (`en`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Dutch (`nl`), Polish (`pl`), Portuguese (`pt`), Slovak (`sk`) and Ukrainian (`uk`). Unsupported languages and individual missing translations fall back to English (EN). Every catalog has the same complete key set and preserves message placeholders. Text returned directly by the server or Core components follows those services’ localization. Guides and development documentation are available only in Czech and English.



```sh
python3 scripts/check-languages.py
```

## About and updates

About appears at the beginning of Application settings. It shows installed and published versions of the app and Core. “Check for updates” fetches GitHub again without waiting for the six-hour cache. Core 0.18.8 reads `src/appinfo/info.xml` from each application’s own repository and validates its ID. A newer NAS installation is shown as newer than published. Details: [Core version checks](https://github.com/hacesoft/core/blob/main/docs/en/CORE_REFERENCE.md).
