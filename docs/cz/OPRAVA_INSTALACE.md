[🇨🇿 **Česky**](OPRAVA_INSTALACE.md) | [🇬🇧 English](../en/INSTALLER_RECOVERY.md)

# Lístečky: opakovatelná instalace na NC35

> **Pouze pro vývojářské Docker nasazení:** nejde o instalaci ani opravu přes App Store. Pro běžnou instalaci použijte Nextcloud → Aplikace.


Po rozbalení úplného zdrojového balíčku do příslušného adresáře NAS spusťte pouze:

```sh
sudo sh install.sh
```

Instalátor při každém spuštění ověří strukturu databáze. Může vytvořit chybějící tabulku, sloupec nebo index; nepřevádí řádky mezi tabulkami, nevolá `migrations:migrate` ani globální `occ upgrade` a nemaže uživatelské záznamy. Lístečky používají tabulky `hc_stickynotes_*`. Instalátor u starých tabulek `stickynotes_*` kontroluje nanejvýš jejich existenci; jejich řádky nečte ani nekopíruje. Pokud cílová tabulka chybí u již instalované aplikace nebo existuje její starý protějšek, instalace se zastaví před změnou kódu; cílovou tabulku obnovte ze zálohy databáze. Nextcloud přidává k aplikačnímu názvu `hc_` svůj systémový prefix (na tomto NASu `oc_`).

**Přerušená instalace:** Při chybě skript obnoví předchozí běhový kód, stav zapnutí a uloženou verzi aplikace; u samostatného svazku také kód cronu. Záloha kódu zůstane v `<datadirectory>/hc-core-deployment-backups/`. Doplněné schéma databáze se nevrací, uložené řádky zůstávají zachované. Chyba vypíše celý protokol a instalace skončí neúspěchem. Po odstranění příčiny spusťte `sudo sh install.sh` znovu.

Před nasazením nad živá data ponechte existující zálohu databáze. Výsledek chování v prohlížeči, přístupová práva a funkčnost úloh ověřte na NASu; místní testy nenahrazují provozní ověření.

## Závazné umístění pracovních souborů

`custom_apps` je výhradně produkční adresář: obsahuje pouze živou složku přesně pojmenovanou podle App ID. Instalátor před prvním `occ` pomocí `scripts/custom-apps-safety.sh` přesune dřívější chybné kopie našich aplikací s duplicitním `appinfo/info.xml` do `<datadirectory>/hc-core-deployment-backups/custom-apps-quarantine/`; nemaže je. Nový kód kontroluje v `/tmp` a při chybě uklidí své pracovní adresáře. Zálohy zůstávají mimo `custom_apps`. Stejné pravidlo platí i pro samostatný cron svazek.
