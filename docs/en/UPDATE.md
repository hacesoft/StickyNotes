[🇨🇿 Česky](../cz/UPDATE_CZ.md) | [🇬🇧 **English**](UPDATE.md)

# Updating Sticky Notes 2.0.14

**Recommended (App Store):** Back up the Nextcloud database and application data. Confirm that Hacesoft Shared App Core 0.18.8+ is enabled; then use **Nextcloud → Apps → Updates** for the officially signed release. Do not replace a managed App Store installation with files from a GitHub source ZIP.

**Developers only (custom Docker deployment):** If you intentionally maintain the Docker deployment described in the [developer installation guide](INSTALL.md), take a consistent database/runtime backup and run `sudo sh install.sh` from the extracted developer source folder outside `custom_apps/`. The script preserves legacy table rows but does not migrate them. See [recovery](INSTALLER_RECOVERY.md) in case of interruption. This path is not a generic Nextcloud update mechanism.
