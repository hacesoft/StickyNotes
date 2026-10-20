[🇨🇿 **Česky**](../cz/README_CZ.md) | [🇬🇧 English](../en/README.md)

# Dokumentace Lístečků — 2.0.12

[Česky](README_CZ.md) · [English](../en/README.md) · [Hlavní README](../../README.md)

- [Instalace a kontrola dat](../cz/INSTALL_CZ.md)
- [Instalace](../cz/INSTALL_CZ.md) · [Aktualizace](../cz/UPDATE_CZ.md) · [Struktura zdrojů](../en/DEVELOPMENT.md)
- [Uživatelská příručka](../cz/USER_GUIDE_CZ.md) · [Editor](../cz/EDITOR_CZ.md) · [Kategorie](../cz/CATEGORIES_CZ.md)
- [Sdílení a práva](../cz/SHARING_CZ.md) · [Dashboard](../cz/DASHBOARD_CZ.md)
- [Nastavení](../cz/SETTINGS_CZ.md) · [Oznámení](../cz/NOTIFICATIONS_CZ.md)


Povinná závislost: nainstalujte a zapněte [Core](https://github.com/hacesoft/core) verze 0.18.8 nebo novější. [Hlavní český README](../../README_CZ.md).

## Jazykové mutace

Rozhraní aplikace podporuje všech 11 jazyků: čeština (`cs`), angličtina (`en`), němčina (`de`), španělština (`es`), francouzština (`fr`), italština (`it`), nizozemština (`nl`), polština (`pl`), portugalština (`pt`), slovenština (`sk`) a ukrajinština (`uk`). Nepodporovaný jazyk i jednotlivý chybějící překlad používají angličtinu (EN). Katalogy obsahují shodnou úplnou sadu klíčů a zachovávají proměnné ve zprávách. Texty pocházející přímo ze serveru či komponent Core se řídí lokalizací těchto služeb. Návody a vývojová dokumentace jsou pouze CZ a EN.

Při každé další úpravě aplikace se ověří jazyky proti společné sadě `cs`, `en`, `de`, `es`, `fr`, `it`, `nl`, `pl`, `pt`, `sk`, `uk`. Doplní se chybějící jazyky i překladové klíče, prověří se výběr jazyka podle Nextcloudu a aktualizuje seznam skutečně podporovaných jazyků. Přítomnost souboru není důkaz úplného překladu. Návody a vývojová dokumentace se vydávají pouze česky a anglicky.

Kontrola překladů pro další vydání (Python 3 a Node.js):

```sh
python3 scripts/check-languages.py
```
