[🇨🇿 Česky](../cz/DEVELOPMENT_CZ.md) | [🇬🇧 **English**](../en/DEVELOPMENT.md)

# Development and package layout

[Documentation](../en/README.md) · [Česká dokumentace](../cz/README_CZ.md)

| Directory/file | Purpose |
| --- | --- |
| `src/` | Runtime app tree copied into `custom_apps/hc_stickynotes` |
| `scripts/install-transaction.sh` | Restores previous code and app state after an installation failure |
| `scripts/remove-own-job.php` | Used by `uninstall.sh` before removing application code |
| `scripts/nas-migration-check.sh` | Optional read-only legacy database diagnostics |
| `docs/` | User and maintainer documentation, including installation and update procedures |
| `release/` | Generated runtime ZIP/tar; ignored by the source repository |
| `build-release.sh` | Maintainer script that builds an app-rooted runtime archive |


Run `sh build-release.sh` to package the runtime. Development tests and Git metadata are excluded from this installation source archive. The app version lives in `src/appinfo/info.xml`. Existing data is retained during upgrades; database permissions, browser behavior, PHP execution, and cron still require NAS qualification.
