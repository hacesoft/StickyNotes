[🇨🇿 Česky](../cz/UPDATE_CZ.md) | [🇬🇧 **English**](../en/UPDATE.md)

# Updating Sticky Notes

[English](UPDATE.md) · [Česky](../cz/UPDATE_CZ.md) · [Documentation](../en/README.md)

Back up the Nextcloud database and code together, update and enable Shared App Core 0.18.8+, then run `sudo sh install.sh` from the unpacked **full-source** ZIP. The script uses the PHP helpers under `scripts/`, preserves legacy data and runs no import. Follow the [installation instructions](../en/INSTALL.md) and [installation checks](../en/INSTALL.md) for account, job, and browser checks. `build-release.sh` produces a fresh runtime ZIP in `release/` for maintainers; it is not needed when installing a downloaded source package.
