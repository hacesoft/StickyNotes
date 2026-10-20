[🇨🇿 Česky](../cz/EDITOR_CZ.md) | [🇬🇧 **English**](../en/EDITOR.md)

# Note editor

[English](EDITOR.md) | [Česky](../cz/EDITOR_CZ.md) | [← Documentation](../en/README.md)

The editor is used both to create and modify sticky notes.

## Rich-text editor

Content is not limited to plain text. Version 2.0.9 retains a rich-text editor with:

- headings,
- basic text formatting,
- lists,
- links,
- tables,
- a categorized emoji library with recently used emoji.

The editor behaves like a conventional text editor and lets the user see the formatted result on the note.

## Title and body

The title and body are visually separated, but the final result is a single sticky note rather than two separate input boxes.

## Text contrast

The application automatically adjusts text contrast according to the note background so content remains readable on light and darker note colors.

## Other note properties

The editor also provides category, type, priority, due date, and user/group assignment controls.

Category appearance is described in [Categories and appearance](../en/CATEGORIES.md).


## Emoji

The **☺** button opens a local Unicode emoji library. Emoji are grouped into categories (smileys, people, animals, food, activities, travel, objects, symbols and flags). Recently used emoji are stored only in the browser local storage. The picker uses no external service and sends no data outside Nextcloud. Emoji are inserted at the current cursor position in the note title or body.


**Core integration:** Existing rich-text content is stored as HTML and remains editable in the app. Core 0.18.1 uses Markdown; its editor cannot replace this editor without a content migration.
