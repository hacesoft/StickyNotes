# Přehled změn

## 2.0.14 — 2026-11-12

- Rozšířena a přehledně naformátována metadata `info.xml`: názvy, souhrny a plné popisy ve všech 11 podporovaných jazycích; z nabídky Prostředky odstraněny tři nadbytečné odkazy na dokumentaci, domovská stránka zůstává.
- Tři existující screenshoty pro App Store přesunuty beze změny obrazových dat do `screenshot/01.png`, `02.png` a `03.png` v kořeni GitHub repozitáře.
- Odkazy v `appinfo/info.xml` vedou přímo na jejich veřejné HTTPS adresy; samostatné náhledy nejsou vyžadovány a v metadatech již nejsou.
- Odstraněny kopie prezentačních screenshotů z instalačního runtime balíčku; zůstávají pouze ve veřejných zdrojích.
- Upraveny README v CZ/EN a sestavení jednoho zdrojového ZIPu pro Publisher. Beze změny dat a databázového schématu.

## 2.0.13

- Kompaktnější správa kategorií, úprava kategorií dvojklikem nebo klávesou Enter při odpovídajícím oprávnění.
- Historie a nabídka dříve uložených názvů kategorií nezávislá na automatickém doplňování prohlížeče; nabídka se otevírá až při práci uživatele a využívá plnou šířku.
- Opravené načítání lístečků po odpovědi API a lepší informace o dočasné nedostupnosti dat.
- Zachován existující obsah lístečků, sdílení, ikony i formát uložených dat; bez migrace obsahu.
- Opravená česká a anglická dokumentace: pro uživatele je primární instalace podepsaného balíčku z App Store; `install.sh` je jen pro vývojáře.
- Nextcloud 35, PHP 8.3+, Hacesoft Shared App Core 0.18.8+.

## 2.0.12 — 2026-10-20

- Nextcloud 35 a PHP 8.3+.
- Minimálně Hacesoft Shared App Core 0.18.8.
- Beze změny formátu uložených poznámek.
