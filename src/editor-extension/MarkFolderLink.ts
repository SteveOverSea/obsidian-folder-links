import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { getPathFromFolder } from '../util';
import { folderField } from './FolderStateField';

export const folderMarkPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (
                update.docChanged ||
                update.viewportChanged ||
                update.state.field(folderField) !== update.startState.field(folderField)
            ) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();
            const folders = view.state.field(folderField);

            let currentStart: number | null = null;
            let currentEnd: number | null = null;
            let hasAlias = false;

            for (const { from, to } of view.visibleRanges) {
                syntaxTree(view.state).iterate({
                    from,
                    to,
                    enter(node) {
                        const isInternalLink = node.type.name.includes('hmd-internal-link');

                        if (!currentStart && !currentEnd && isInternalLink) {
                            // start of a link
                            currentStart = node.from;
                            currentEnd = node.to;
                            hasAlias = node.type.name.includes('link-has-alias');
                        } else if (currentStart && isInternalLink) {
                            // continue of a link
                            currentEnd = node.to;
                        } else if (currentStart && currentEnd && !isInternalLink) {
                            // end of a link
                            let currentText = view.state.doc.sliceString(currentStart, currentEnd);
                            let currentHref = currentText;

                            if (hasAlias) {
                                const parts = currentText.split('|');
                                currentHref = parts[0];
                                currentText = parts[1];
                            }

                            if (currentHref.trim().endsWith('/')) {
                                const folderPath = getPathFromFolder(currentHref.trim());
                                const resolvedClass = folders.asPathes.includes(folderPath)
                                    ? 'is-resolved'
                                    : 'is-unresolved';

                                builder.add(
                                    currentStart!,
                                    currentEnd!,
                                    Decoration.mark({
                                        class: resolvedClass + ' folder-link',
                                        attributes: { 'data-folder-link': currentHref }
                                    })
                                );
                            }
                            currentStart = null;
                            currentEnd = null;
                            hasAlias = false;
                        }
                    }
                });
            }

            return builder.finish();
        }
    },
    {
        decorations: (v) => v.decorations
    }
);
