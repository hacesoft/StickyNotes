[🇨🇿 **Česky**](UPDATE_CZ.md) | [🇬🇧 English](../en/UPDATE.md)

# Aktualizace Žlutých lístečků 2.0.14

**Doporučeno (App Store):** Zálohujte databázi Nextcloudu i data aplikace. Ověřte, že Hacesoft Shared App Core 0.18.8+ je zapnuté, a aktualizujte oficiálně podepsané vydání pomocí **Nextcloud → Aplikace → Aktualizace**. Nesnažte se nahradit instalaci spravovanou App Store soubory ze zdrojového ZIPu GitHubu.

**Pouze pro vývojáře (vlastní Docker nasazení):** Pokud záměrně spravujete Dockerové prostředí podle [vývojářského instalačního návodu](INSTALL_CZ.md), vytvořte obnovitelnou zálohu databáze a runtime souborů a mimo `custom_apps/` z rozbaleného zdrojového balíčku spusťte `sudo sh install.sh`. Skript zachovává staré databázové záznamy, ale nemigruje je. Při přerušení viz [obnova](OPRAVA_INSTALACE.md). Nejde o univerzální aktualizační postup pro Nextcloud.
