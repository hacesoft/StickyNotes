[🇨🇿 **Česky**](../cz/INSTALL_CZ.md) | [🇬🇧 English](../en/INSTALL.md)

# Instalace Lístečků 2.0.12

[Česky](INSTALL_CZ.md) · [English](../en/INSTALL.md) · [Dokumentace](../cz/README_CZ.md)

Cíl: Nextcloud 35, PHP 8.3+, zapnutý Shared App Core 0.18.8+. Následující skript počítá s projektovým Docker nasazením, webovým kontejnerem Nextcloudu (obvykle `nextcloud-app`) a případně samostatným cron kontejnerem.

1. Vytvoř společnou obnovitelnou zálohu databáze Nextcloudu a kódu aplikace. Zachovej existující tabulky `stickynotes_*` a `hc_stickynotes_*` i uživatelskou konfiguraci. Zkontroluj `occ status` a verzi Core.
2. Rozbal na NASu celý zdrojový ZIP včetně `src/`, `scripts/`, `install.sh` a `uninstall.sh`. V rozbalené složce spusť:

```sh
sudo sh install.sh
```

3. Instalátor kontroluje Core a PHP, zálohuje dosavadní kód, povolí aplikaci, případně doplní chybějící strukturu tabulek a žádné záznamy ze starého ID `stickynotes` nepřevádí. Pokud cílová `hc_` tabulka chybí, zastaví se před výměnou kódu; staré databázové záznamy zůstávají zachovány. Podle [kontroly NC35](../cz/INSTALL_CZ.md) ověř poznámky s více účty, `occ background-job:list` a logy Nextcloudu.

Pro ruční instalaci slouží samostatný runtime ZIP, který obsahuje pouze adresář `hc_stickynotes/` pro `custom_apps`; instalační skript pro Synology v něm není. Běžný `sudo sh uninstall.sh` odstraní kód a vlastní registraci úlohy, ale zachová poznámky.

Volitelný `scripts/nas-migration-check.sh` jen čte původní databázové ID na původním nasazení MariaDB. Staré záznamy v databázi se zachovávají; zdrojový balík neobsahuje nástroj k jejich mazání.

Povinná závislost: nainstalujte a zapněte [Core](https://github.com/hacesoft/core) verze 0.18.8 nebo novější. [Hlavní český README](../../README_CZ.md).
