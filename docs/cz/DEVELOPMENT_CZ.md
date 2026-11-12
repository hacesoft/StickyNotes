[🇨🇿 **Česky**](DEVELOPMENT_CZ.md) | [🇬🇧 English](../en/DEVELOPMENT.md)

# Vývojáři a sestavení vydání

Repozitář obsahuje úplné zdrojové kódy aplikace, ale **není sám o sobě oficiálním podepsaným instalačním balíčkem Nextcloud App Store**.

| Soubor / adresář | Účel |
| --- | --- |
| `src/` | Zdrojový kód instalovaný do `custom_apps/hc_stickynotes/` vhodným nástrojem |
| `docs/` | Veřejné návody CZ/EN |
| `install.sh`, `uninstall.sh` | Vývojářské skripty pro Docker a obnovení / odstranění aplikace |
| `scripts/` | Pomocné soubory potřebné pro tyto skripty |
| `build-release.sh` | Vytváří jediný vstupní full-source ZIP a interní runtime ZIP/TAR.GZ pro Publisher |
| `release/` | Lokální vygenerované archivy, ignorované Gitem |

**Sestavení pro vývojáře:** Z kořene projektu spusťte `sh build-release.sh`. Skript přečte verzi a App ID z `src/appinfo/info.xml` a vytvoří jeden **veřejný vstupní** `release/hc_stickynotes-2.0.14-full-source.zip` pro Hacesoft Publisher a dva **interní nepodepsané** runtime výstupy `.zip` a `.tar.gz`. Publisher runtime ověří a podepíše až po kontrolách CP21/HDS. Obrázky v kořenovém `screenshot/01.png` až `03.png` jsou pouze pro veřejnou prezentaci na GitHubu a nepatří do instalačního balíčku.

**Důležité:** Skript **nepodepisuje** ZIP ani TAR.GZ. Pro oficiální vydání musí správce nejprve úspěšně dokončit kontroly Hacesoft Publisher CP21 a HDS 1.2.1, podepsat *přesný výsledný runtime balíček* svým soukromým klíčem a certifikátem a zaregistrovat/zveřejnit podepsané vydání v Nextcloud App Store. Podepisování má dvě odlišné části: podpis integrity aplikace Nextcloud vytvoří `appinfo/signature.json` v runtime stromu; výsledný archiv `.tar.gz` se následně podepisuje algoritmem SHA-512 pro záznam vydání v App Store. Změna souborů či archivu po odpovídajícím podpisu jej zneplatní. **Soukromý klíč `.key` se nikdy nezveřejňuje.** CSR a vydaný certifikát `.crt` jsou veřejné registrační podklady, ale ani tyto soubory, interní auditní protokoly či logy nepatří do veřejného GitHub zdrojového ZIPu.

**Vývojářské Docker nasazení:** Jen v kompatibilním prostředí a se zálohou lze spustit `sudo sh install.sh`. Jde o privilegovaný vývojářský instalační skript, nikoli o běžný postup pro uživatele. Viz [instalace](INSTALL_CZ.md) a [obnova](OPRAVA_INSTALACE.md). Interní testy a podklady HDS/CP21 si správce projektu uchovává odděleně od veřejného zdrojového balíčku.

[Oficiální návod Nextcloud App Store pro vývojáře](https://nextcloudappstore.readthedocs.io/en/latest/developer.html) · [Hlavní README](../../README_CZ.md)
