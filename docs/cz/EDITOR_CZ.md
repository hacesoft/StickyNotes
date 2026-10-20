[🇨🇿 **Česky**](../cz/EDITOR_CZ.md) | [🇬🇧 English](../en/EDITOR.md)

# Editor lístečků

[Česky](EDITOR_CZ.md) | [English](../en/EDITOR.md) | [← Dokumentace](../cz/README_CZ.md)

Editor slouží k vytvoření i následné úpravě lístečku.

## Rich-text editor

Obsah není omezen na prostý text. Verze 2.0.9 podporuje rich-text editor s:

- nadpisy,
- základním formátováním textu,
- seznamy,
- odkazy,
- tabulkami,
- knihovnou emoji rozdělenou do kategorií včetně naposledy použitých emoji.

Editor umožňuje upravovat obsah podobně jako běžný textový editor a průběžně vidět jeho výslednou podobu na lístečku.

## Nadpis a tělo

Nadpis a vlastní obsah jsou vizuálně oddělené, ale výsledkem je jeden lísteček, nikoli dvě samostatná textová pole ve finálním zobrazení.

## Kontrast textu

Aplikace používá automatický kontrast textu podle barvy pozadí lístečku, aby text zůstal čitelný i při použití světlých nebo tmavších barev.

## Další vlastnosti lístečku

Při editaci lze kromě obsahu nastavit kategorii, typ, prioritu, termín a přiřazení uživateli nebo skupině.

Vzhled kategorie je popsán v [Kategorie a vzhled](../cz/CATEGORIES_CZ.md).


## Emoji

Tlačítko **☺** otevírá lokální knihovnu Unicode emoji. Emoji jsou rozdělená do kategorií (smajlíci, lidé, zvířata, jídlo, aktivity, cestování, předměty, symboly a vlajky). Naposledy použité emoji se ukládají pouze v místním úložišti prohlížeče. Výběr emoji nevyužívá žádnou externí službu a neposílá data mimo Nextcloud. Emoji se vloží na aktuální pozici kurzoru v nadpisu nebo těle lístečku.


**Integrace Core:** Dosavadní formátovaný obsah se ukládá jako HTML a zůstává upravitelný v aplikaci. Core 0.18.1 používá Markdown; bez migrace obsahu jeho editor nelze bezpečně dosadit.
