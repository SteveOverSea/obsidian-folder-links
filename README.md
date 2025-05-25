# Folder Link Plugin for Obsidian

Have you ever wanted to link to a folder? This plugin adds a frequently requested feature to Obsidian.

**Features:**

-   Click on link to an existing folder reveals folder in navigation
-   Click on link to a non-existing folder creates new folder
-   resolved/unresolved styling
-   works with outgoing links tab too (can be disabled in options)
-   supports usage of display text (e.g. `[[MyFolder/ | MyCustomText]]`)

## How to use

Add a `/` at the end of a regular internal link. If the folder exists it will be revealed.

**Warning:** Renaming or moving a folder you already linked won't update those folder links (for now).

```markdown
[[MyFolder/]]
[[MyFolder/MySubfolder/]]

[[MyFolder/ | MyCustomText]]
```

## Extension Ideas

-   Fuzzy Folder Suggestion Box (like the Obsidian internal link suggestion)
-   Updating existing folder links on rename/move and show warning on delete (similar to regular internal links)
-   Option to instead of revealing folder in navigation open a index view in a tab/view that shows context of that folder
    -   in combination with [Folder Notes](https://github.com/LostPaul/obsidian-folder-notes)?

...feel free to share your ideas/wishes/needs!
