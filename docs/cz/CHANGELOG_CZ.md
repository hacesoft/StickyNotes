[🇨🇿 **Česky**](CHANGELOG_CZ.md) | [🇬🇧 English](../en/CHANGELOG.md)

# Přehled změn

## 2.0.11 — kandidát pro NC35

- Oprava chybějícího `share_type` při přiřazení dalšího uživatele k lístečku nebo při sdílení s uživatelem. Databázová migrace ani úprava uložených dat nejsou potřeba.

## 2.0.9 — kandidát pro NC35

- Na telefonu se filtry otevírají v nabídce a nástěnka zůstává viditelná. Jednomu lístečku lze přiřadit více uživatelů i skupin. Existující data i schéma databáze zůstávají zachována; další příjemci používají dosavadní tabulku sdílení.

## 2.0.7 — kandidát pro NC35

- Podpora Nextcloudu 35, PHP 8.3+ a Shared App Core 0.18.1+.
- Kontroly skupinového přístupu a práv `view`/`edit` na serveru i v kartách.
- Bezpečné zpracování uloženého HTML při ukládání a načítání; zachování poznámek.
- Odstranění konkrétní osiřelé úlohy upomínek a úklid vlastní úlohy před odinstalací.
- Zachování původního HTML editoru do provedení kompatibilního převodu na Markdown editor Core.
- Archivní binární balíčky, vývojové testy ani zastaralé audity nejsou součástí instalačního balíčku.

## 2.0.6 — obnova původního ID

- Historický převod na `hc_stickynotes` již proběhl; aktuální instalátor neimportuje záznamy.
- Původní data zůstávají v databázi jako záloha; běžný instalátor je nemaže.
- Integrace společného layoutu Core a kontroly při spuštění.

Starší popisy vydání zůstávají v původních archivních zdrojích majitele projektu.
