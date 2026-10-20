[🇨🇿 **Česky**](README_CZ.md) | [🇬🇧 English](README.md)

# Žluté lístečky 2.0.11

Aplikace pro Nextcloud z dílny Hacesoft pro osobní a sdílené poznámky, úkoly s termíny, kategorie, widget Dashboardu a volitelná oznámení. Poznámky lze sdílet s uživateli nebo skupinami s právem prohlížení či úprav.

<img width="1134" height="617" alt="image" src="https://github.com/user-attachments/assets/c9e34307-17b8-4a27-97c3-cbb349a57cfe" />

## Požadavky

- Nextcloud 35 a PHP 8.3 nebo novější.
- **Nainstalované a zapnuté [Hacesoft Core](https://github.com/hacesoft/core), verze 0.18.1 nebo novější.** Bez Core aplikace nefunguje.

Core je samostatná aplikace a není přibalené k Lístečkům. Nejprve jej nainstalujte podle návodu v [repozitáři Core](https://github.com/hacesoft/core).

## Instalace a aktualizace

Stáhněte a rozbalte kompletní zdrojový balíček. V kořeni rozbaleného projektu spusťte:

```sh
sudo sh install.sh
```

Instalační skript podporuje zdokumentované nasazení Synology/Docker. Požadavky a postup aktualizace najdete v [instalačním návodu](docs/cz/INSTALL_CZ.md). Existující poznámky se při aktualizaci zachovávají v databázi. Před aktualizací zálohujte databázi a soubory aplikace.

Před odinstalací si přečtěte část o odstranění v instalačním návodu. Z kořene projektu použijte `sudo sh uninstall.sh`; před odstraněním uložených dat zkontrolujte volby skriptu.

## Dokumentace

- [Přehled dokumentace](docs/cz/README_CZ.md)
- [Uživatelská příručka](docs/cz/USER_GUIDE_CZ.md)
- [Sdílení a oprávnění](docs/cz/SHARING_CZ.md)
- [Editor](docs/cz/EDITOR_CZ.md)
- [Widget Dashboardu](docs/cz/DASHBOARD_CZ.md)
- [Nastavení](docs/cz/SETTINGS_CZ.md)
- [Oznámení](docs/cz/NOTIFICATIONS_CZ.md)
- [Mobilní rozložení](docs/cz/MOBILNI_LAYOUT.md)

## Struktura zdrojů

`src/` obsahuje aplikaci, `scripts/` instalační pomocníky a `docs/cz/` a `docs/en/` českou a anglickou dokumentaci. Kompletní zdrojový balíček obsahuje `install.sh` i `uninstall.sh`. `build-release.sh` sestavuje runtime ZIP/tarball z `src/`; generované výstupy patří do `release/`.

Podklady pro vývojáře: [vývoj](docs/cz/DEVELOPMENT_CZ.md), [kontrola Nextcloud 35](docs/cz/NC35_REVIEW_CZ.md) a [přehled změn](docs/cz/CHANGELOG_CZ.md).

Licence: [AGPL-3.0-or-later](LICENSE).

## Jazykové mutace

Rozhraní aplikace podporuje všech 11 jazyků: čeština (`cs`), angličtina (`en`), němčina (`de`), španělština (`es`), francouzština (`fr`), italština (`it`), nizozemština (`nl`), polština (`pl`), portugalština (`pt`), slovenština (`sk`) a ukrajinština (`uk`). Nepodporovaný jazyk i jednotlivý chybějící překlad používají angličtinu (EN). Katalogy obsahují shodnou úplnou sadu klíčů a zachovávají proměnné ve zprávách. Texty pocházející přímo ze serveru či komponent Core se řídí lokalizací těchto služeb. Návody a vývojová dokumentace jsou pouze CZ a EN.

Při každé další úpravě aplikace se ověří jazyky proti společné sadě `cs`, `en`, `de`, `es`, `fr`, `it`, `nl`, `pl`, `pt`, `sk`, `uk`. Doplní se chybějící jazyky i překladové klíče, prověří se výběr jazyka podle Nextcloudu a aktualizuje seznam skutečně podporovaných jazyků. Přítomnost souboru není důkaz úplného překladu. Návody a vývojová dokumentace se vydávají pouze česky a anglicky.

Kontrola překladů pro další vydání (Python 3 a Node.js):

```sh
python3 scripts/check-languages.py
```

## O aplikaci a aktualizace

Blok O aplikaci je na začátku Nastavení aplikace. Zobrazuje nainstalovanou a zveřejněnou verzi aplikace i Core. Tlačítko „Zkontrolovat aktualizace“ načte GitHub znovu bez čekání na šestihodinovou cache. Core 0.18.1 čte `src/appinfo/info.xml` z vlastního repozitáře každé aplikace a ověřuje její ID. Vyšší verze na NASu se označí jako novější než zveřejněná. Podrobnosti: [kontrola verzí Core](https://github.com/hacesoft/core/blob/main/docs/UPDATE_CHECK_CZ.md).
