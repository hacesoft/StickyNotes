[🇨🇿 **Česky**](INSTALL_CZ.md) | [🇬🇧 English](../en/INSTALL.md)

# Instalace Žlutých lístečků 2.0.14

## Doporučeno: podepsané vydání z Nextcloud App Store

Žluté lístečky se pro běžný provoz **instalují a aktualizují přes Nextcloud → Aplikace**. Po zveřejnění `hc_stickynotes` v [Nextcloud App Store](https://apps.nextcloud.com/) postupujte takto:

1. Ověřte **Nextcloud 35** a **PHP 8.3+**. Zálohujte databázi a soubory Nextcloudu.
2. Nejprve nainstalujte a zapněte [Hacesoft Shared App Core](https://github.com/hacesoft/core) (`hc_shared_app_core`) **0.18.8+**. Core je samostatná povinná aplikace.
3. Ve správě **Aplikace** vyhledejte **Sticky Notes / Žluté lístečky** (`hc_stickynotes`), nainstalujte je a zapněte.
4. Ověřte existující lístečky, kategorie, sdílení, připomínky a widget Dashboardu u odpovídajících uživatelů.
5. Další aktualizace instalujte opět přes **Aplikace**, vždy po zálohování.

Než se aplikace v obchodě objeví, musí správce projektu dokončit její zveřejnění. Veřejný *zdrojový ZIP* z GitHubu ani lokálně vytvořený runtime archiv nejsou podepsaným balíčkem z App Store. Tyto balíčky nezaměňujte.

## Pouze pro vývojáře: vlastní Docker nasazení

Následující postup **není určen běžným správcům Nextcloudu**, funguje jen v odpovídajícím **Dockerovém prostředí**. `sudo sh install.sh` vyžaduje oprávnění root na hostiteli a přístup k Dockeru; není to univerzální instalátor pro běžný Nextcloud nebo sdílený hosting.

1. Vytvořte společnou obnovitelnou zálohu databáze a runtime souborů. Nemažte existující tabulky `stickynotes_*` ani `hc_stickynotes_*`.
2. Prostudujte `install.sh`, pomocné skripty, očekávané kontejnery a instalaci Core. Ověřte, že nasazení odpovídá konkrétnímu instalátoru.
3. Rozbalte vývojářský archiv `-full-source.zip` **mimo** `custom_apps/` a z kořene projektu spusťte:

```sh
sudo sh install.sh
```

Instalátor ověřuje Core a syntaxi PHP, zálohuje předchozí kód, nasazuje aplikaci do webového a případně cron kontejneru a kontroluje stav databázového schématu. Nemigruje řádky ze starých tabulek `stickynotes_*` do `hc_stickynotes_*`. Při chybějící cílové tabulce a možných starých datech instalaci zastaví. [Obnova po přerušené instalaci](OPRAVA_INSTALACE.md).

Samostatné runtime ZIP/TAR.GZ obsahují kořenový adresář `hc_stickynotes/`. Jsou to **nepodepsané sestavovací výstupy**, nikoli instalační balíčky pro koncové uživatele. Před oficiálním vydáním musí projít kontrolami Publisheru a podpisem. `sh build-release.sh` vytváří jediný **vstupní** zdrojový ZIP pro Publisher a interní nepodepsané runtime ZIP/TAR.GZ; Publisher runtime zkontroluje a podepíše.

Také `sudo sh uninstall.sh` je **vývojářský skript pro Docker**. Před použitím prostudujte volby; výchozí cesta odstraňuje kód a registrovanou úlohu aplikace, ale ponechává databázové záznamy. U běžné instalace z App Store používejte správu **Aplikace** a respektujte její upozornění při odinstalaci.
