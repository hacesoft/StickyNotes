[🇨🇿 Česky](../cz/OPRAVA_INSTALACE.md) | [🇬🇧 **English**](INSTALLER_RECOVERY.md)

# Sticky Notes: repeatable NC35 installation

> **Developer-only Docker deployment:** this is not an App Store install/repair procedure. For ordinary installations use Nextcloud → Apps.


Extract the complete source package into the corresponding NAS directory, then run:

```sh
sudo sh install.sh
```

The installer checks the required database structure on every run. It may create missing tables, columns or indexes; it does not transfer rows between tables, call `migrations:migrate` or global `occ upgrade`, or delete user records. Sticky Notes uses `hc_stickynotes_*` tables. The installer may check whether old `stickynotes_*` tables exist; it never reads or copies their rows. If a target table is missing for an existing installation or its old counterpart exists, installation stops before code replacement; restore the target table from a database backup. Nextcloud adds its configured system prefix (`oc_` on this NAS) to the app's `hc_` names.

**Interrupted installation:** On failure the script restores the previous runtime code, enabled state and stored app version, plus the cron copy when its app mount is separate. The code backup remains under `<datadirectory>/hc-core-deployment-backups/`. Additive schema changes are not reversed and existing rows remain intact. The full log is printed and the command fails. Fix the cause, then run `sudo sh install.sh` again.

Retain your database backup when deploying to live data. Browser behavior, permissions and background jobs still require qualification on the NAS.

## Required placement of working files

`custom_apps` is exclusively for live application directories named exactly after their App IDs. Before its first `occ` call, the installer uses `scripts/custom-apps-safety.sh` to move leftover copies of our applications with a duplicate `appinfo/info.xml` to `<datadirectory>/hc-core-deployment-backups/custom-apps-quarantine/`; it does not delete them. Incoming code is checked in `/tmp`, and the installer's private working directories are cleaned up on failure. Backups remain outside `custom_apps`. The same rule applies to a separate cron application mount.
