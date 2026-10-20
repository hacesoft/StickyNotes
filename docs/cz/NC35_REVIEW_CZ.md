[🇨🇿 **Česky**](../cz/NC35_REVIEW_CZ.md) | [🇬🇧 English](../en/NC35_REVIEW_EN.md)

# Lístečky 2.0.9 — NC35, oprávnění a cron

Vyžadují NC35, PHP 8.3+ a zapnutý Shared App Core 0.18.1+. Technické ID `hc_stickynotes`, tabulky a uložený obsah zůstávají. Převod ID `stickynotes` proběhl v dřívější verzi; tento balík už žádný import neobsahuje. Původní databázová data nemažte.

## Opravy po kontrole

- Zobrazení sdílené poznámky funguje i pro členy skupin; zápis poznámky, její formátování a změna dokončení vyžadují vlastníka, přiřazení nebo sdílení `edit`. Sdílení `view` nepovoluje zápis. Akce na kartě odpovídají serverovému právu. Vlastník jediný maže a spravuje sdílení.
- Formátované HTML se při uložení i čtení skládá z bezpečně povolených prvků a atributů; neznámé atributy, skripty a nebezpečné URL se nevracejí do klienta. Původní HTML uložené v uživatelském nastavení zůstává zachováno; při čtení se filtruje.
- Migrace `Version2002Date20260923000000` cílí pouze na osiřelou třídu `OCA\StickyNotes\BackgroundJob\DueReminderJob` z původního ID. `uninstall.sh` před odstraněním kódu odstraní pouze úlohu aktuální třídy. Poznámky, sdílení a tabulka ostatních cron úloh se nemění.
- Webový Guard porovnává i číslo vývojového buildu Core; verzi dev.1 nepovažuje za dev.2.

## Instalace a kontrola

1. Zálohujte databázi včetně `hc_stickynotes_*`, uživatelského nastavení a původních `stickynotes_*`, pokud existují. Ověřte `occ status`, instalovaný a zapnutý Core. Spusťte `sudo sh install.sh` z úplného zdrojového ZIPu. Skript uchovává zálohu runtime mimo `custom_apps`, stará data nepřevádí a původní databázová data nemaže.
2. Pro vlastníka, čtenáře `view`, editora `edit`, uživatele přiřazeného k úloze a člena skupiny zkontrolujte čtení, změnu poznámky, formátování, dokončení a sdílení. Sledujte nejen tlačítka v UI, ale i odpovědi API 403 při nepovoleném zápisu. Ověřte, že staré poznámky a formátování zůstaly.
3. Příkaz `sudo docker exec -u www-data nextcloud-app php occ background-job:list` použijte pro potvrzení jedné aktuální úlohy a nulové staré třídy; prověřte Nextcloud log po několika cyklech cron. Při odinstalaci `sudo sh uninstall.sh` zachová data a smaže registraci vlastní úlohy. Neodstraňujte celou tabulku jobs.

## Editor a hranice současné integrace

Lístečky stále používají vlastní HTML editor (`contenteditable`, formátování a obrázky podle dosavadního chování). Core 0.18.1 nabízí editor s formátem Markdown; přímé nahrazení by změnilo uložené HTML a mohlo poškodit formátování starých poznámek. Převod formátu a plné sjednocení editoru **nejsou hotové**. Pozadí papíru a barevné styly kategorie jsou vlastností poznámky a zůstávají v aplikaci. Tento balík proto není potvrzením dokončené migrace Lístečků na společný editor; vydání této funkce vyžaduje samostatný převod se zpětnou kompatibilitou a test na datech NASu.

Automaticky ověřeno: JS syntaxe, integrační statický test, sestavení runtime ZIPu a shell syntaxe. Bez přístupu k NASu nejsou ověřeny PHP runtime, DB migrace, práva různých účtů ani chování cron po upgradu.
