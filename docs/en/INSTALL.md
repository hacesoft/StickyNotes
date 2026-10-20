[🇨🇿 Česky](../cz/INSTALL_CZ.md) | [🇬🇧 **English**](../en/INSTALL.md)

# Install Sticky Notes 2.0.11

[English](INSTALL.md) · [Česky](../cz/INSTALL_CZ.md) · [Documentation](../en/README.md)

Target: Nextcloud 35, PHP 8.3+, enabled Shared App Core 0.18.1+. The following script expects the project's Docker setup with a Nextcloud web container (usually `nextcloud-app`) and optionally a cron container.

1. Back up the Nextcloud database and application runtime as one recoverable set. Retain existing `stickynotes_*` and `hc_stickynotes_*` tables and user configuration. Check `occ status` and the Core version.
2. Extract the full source ZIP to a directory on the NAS, including `src/`, `scripts/`, `install.sh`, and `uninstall.sh`. From that directory run:

```sh
sudo sh install.sh
```

3. The installer checks Core and staged PHP, backs up existing runtime code, enables the new app, adds missing database structure where needed, and does not transfer records from the old `stickynotes` tables. It refuses to replace a missing `hc_` target table when older data may exist; old database content remains available for recovery. Review [NC35 qualification](../en/NC35_REVIEW_EN.md), verify notes with more than one user, and inspect `occ background-job:list` and Nextcloud logs.

For a manual Nextcloud installation use the separate runtime ZIP whose top-level directory is `hc_stickynotes/`; it has no Synology deployment script. Default `sudo sh uninstall.sh` removes app code and its own registered background job, while retaining note data.

The optional `scripts/nas-migration-check.sh` is a read-only legacy-ID check for the original MariaDB deployment. Legacy database data is retained; the source package includes no deletion utility.

Required dependency: install and enable [Core](https://github.com/hacesoft/core) version 0.18.1 or newer. [Main English README](../../README.md).
