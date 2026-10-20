[🇨🇿 Česky](../cz/CHANGELOG_CZ.md) | [🇬🇧 **English**](CHANGELOG.md)

# Changelog

## 2.0.11 — NC35 candidate

- Fix `share_type` being omitted when an additional user is assigned to a note or a note is shared with a user. No database migration or stored-data change is needed.

## 2.0.9 — NC35 candidate

- Phone filters open in a drawer so the board remains visible. A note can be assigned to multiple users and groups. Existing data and the database schema remain intact; extra recipients use the existing shares table.

## 2.0.7 — NC35 candidate

- Target Nextcloud 35, PHP 8.3+, and Shared App Core 0.18.1+.
- Check group access and `view`/`edit` permissions on the server and in card actions.
- Sanitize stored HTML during save and read; preserve existing note data.
- Remove the exact orphaned legacy reminder job through migration, and remove the current job before uninstalling code.
- Retain the legacy HTML editor until its content can be migrated compatibly to the Core Markdown editor.
- Keep the installation source archive free of proprietary historical archives, developer tests, and obsolete audit reports.

## 2.0.6 — legacy identity recovery

- The historical `hc_stickynotes` data transfer has completed; the current installer does not import records.
- Retain legacy database data for recovery; the normal installer never purges it.
- Integrate the shared Core layout and startup guard.

Earlier release details remain available in the original historical source archives maintained by the project owner.
