[🇨🇿 Česky](../cz/INSTALL_CZ.md) | [🇬🇧 **English**](INSTALL.md)

# Installing Sticky Notes 2.0.14

## Recommended: install the signed App Store release

Sticky Notes is intended to be installed and updated from **Nextcloud → Apps** by the Nextcloud administrator. When `hc_stickynotes` is published in the [Nextcloud App Store](https://apps.nextcloud.com/):

1. Confirm **Nextcloud 35** and **PHP 8.3+**. Back up the database and Nextcloud application data.
2. Install and enable [Hacesoft Shared App Core](https://github.com/hacesoft/core) (`hc_shared_app_core`) **0.18.8+** first. Core is a separate required app.
3. Search for **Sticky Notes** (`hc_stickynotes`) in **Apps**, install and enable it.
4. Verify that existing notes, categories, sharing, reminders and the Dashboard widget work for relevant users.
5. Apply future updates through **Apps** after taking a backup.

The release must be published by its maintainer before it appears in the store. The public GitHub *source ZIP* and locally built runtime archives are not signed App Store downloads. Do not confuse them with the published release.

## Developers only: custom Docker deployment

The following procedure is **not intended for ordinary Nextcloud administrators** and is **specific to a Docker deployment**. `sudo sh install.sh` needs host root privileges and Docker access; it is not portable to shared hosting, a generic Nextcloud instance or the normal Apps workflow.

1. Back up database and runtime files as a recoverable set. Do not delete existing `stickynotes_*` or `hc_stickynotes_*` tables.
2. Review `install.sh` and its helper scripts, container assumptions and the existing Core installation. Confirm that this particular Nextcloud environment matches the script.
3. Extract the `-full-source.zip` developer source package outside `custom_apps/`, then from the project root run:

```sh
sudo sh install.sh
```

The script checks Core, validates staged PHP, retains previous application code backups, deploys to Nextcloud web and possibly cron containers and checks schema state. It does not migrate legacy `stickynotes_*` rows into `hc_stickynotes_*` tables. If older data may exist and a required target table is missing, it stops to avoid hiding lost data. [Recovery procedure](INSTALLER_RECOVERY.md).

For runtime ZIP/TAR.GZ archives, the top-level directory is `hc_stickynotes/`. These are **unsigned build inputs**, not end-user packages. They must pass the maintainer's release checks and signing before official distribution. `sh build-release.sh` creates one source ZIP for Publisher and the internal unsigned runtime ZIP/TAR.GZ; Publisher verifies and signs the final release.

`sudo sh uninstall.sh` is likewise a **developer-only Docker script**. Read its options carefully; the default path removes application code and the application's registered background job while retaining database rows. For normal App Store installations use Nextcloud's Apps management interface instead, following its uninstall warnings.
