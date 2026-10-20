[🇨🇿 Česky](../cz/NC35_REVIEW_CZ.md) | [🇬🇧 **English**](../en/NC35_REVIEW_EN.md)

# Sticky Notes 2.0.9 — NC35, permissions, and cron

Requires NC35, PHP 8.3+, and enabled Core 0.18.1+. The `hc_stickynotes` identity and stored notes remain. The old `stickynotes` import was completed by an earlier release; this package contains no importer. Do not delete old database records.

Group members can now open group-shared notes. Updating notes, rich formatting, and task completion require owner, assignee, or an `edit` share; a `view` share cannot write. The card actions reflect server authorization. Only owners can delete or manage sharing. Stored HTML is rebuilt from an allowlist on save and read; scripts, unknown attributes, and unsafe link protocols are removed from rendered output without deleting original user configuration.

The installer no longer executes a database migration. Its job cleanup handles only the exact old `OCA\StickyNotes\BackgroundJob\DueReminderJob` registration. Uninstall removes only the current reminder class before removing code, leaving note data and unrelated jobs. The startup Guard distinguishes Core dev.1 from required dev.2.

Back up the database, `hc_stickynotes_*` tables, user configuration, and any legacy `stickynotes_*` tables. Verify `occ status` and enabled Core, then run `sudo sh install.sh` from the full source ZIP. Test as owner, view recipient, edit recipient, assignee, and group member, including a direct API attempt to edit a view-only note (expected 403). Compare legacy notes and formatting. Check `occ background-job:list` and Nextcloud logs over several cron cycles; there should be one current reminder and no old class. Default uninstall retains notes; never wipe all background jobs.

**Editor limitation:** Sticky Notes retains its existing HTML contenteditable editor. Core 0.18.1 currently stores Markdown; switching existing HTML documents to it without a format migration risks losing formatting. A compatible shared-editor migration is **not complete**. Paper colors are note-specific data and stay with the app. Do not describe this package as complete shared-editor adoption.

JS syntax, static Core integration, shell syntax, and packaging were checked. PHP execution, database migration, multi-account permissions, HTML sanitization in the deployed PHP runtime, and cron behavior require verification on the NAS before release.
