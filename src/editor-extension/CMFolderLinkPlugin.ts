import {
	ViewUpdate,
	PluginValue,
	EditorView,
	ViewPlugin,
	WidgetType,
	PluginSpec,
	Decoration,
	DecorationSet,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { IFilesCorePlugin, IFolderWrapper } from "../types";
import { RESOLVED_LINK_CLASS, UNRESOLVED_LINK_CLASS } from "src/constants";
import { folderField } from "./FolderStateField";
import { getPathFromFolder } from "src/util";

export class CMFolderLinkWidget extends WidgetType {
	content: string;
	href: string;
	lineNr: number;

	constructor(
		content: string,
		href: string,
		lineNr: number,
		private filesCorePlugin: IFilesCorePlugin
	) {
		super();
		this.content = content;
		this.href = href ?? content;
		this.lineNr = lineNr;
	}

	toDOM(view: EditorView): HTMLElement {
		const folders = view.state.field(folderField);
		const folderLinkEl = document.createElement("a");

		if (folders) {
			const folderPath = getPathFromFolder(this.href.trim());

			if (folders.asPathes.includes(folderPath)) {
				folderLinkEl.addClass(RESOLVED_LINK_CLASS);
				folderLinkEl.removeClass(UNRESOLVED_LINK_CLASS);

				folderLinkEl.addEventListener("click", () => {
					this.filesCorePlugin.view.revealInFolder(
						folders.raw.filter((f) => f.path === folderPath)[0]
					);
				});
			} else {
				folderLinkEl.addClass(UNRESOLVED_LINK_CLASS);
				folderLinkEl.removeClass(RESOLVED_LINK_CLASS);
			}

			const activeLine = view.state.doc.lineAt(
				view.state.selection.main.from
			);

			if (
				activeLine.number === this.lineNr &&
				this.content != this.href
			) {
				folderLinkEl.innerText = `${this.href}|${this.content}`;
			} else {
				folderLinkEl.innerText = this.content;
			}
		}

		return folderLinkEl;
	}
}

class CMFolderLinkPlugin implements PluginValue {
	decorations: DecorationSet;
	folders: IFolderWrapper;

	constructor(view: EditorView, private filesCorePlugin: IFilesCorePlugin) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		this.decorations = this.buildDecorations(update.view);
	}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const filesCorePlugin = this.filesCorePlugin;

		let currentStart: number | null = null;
		let currentEnd: number | null = null;
		let hasAlias = false;

		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					const isInternalLink =
						node.type.name.includes("hmd-internal-link");

					if (!currentStart && !currentEnd && isInternalLink) {
						// start of a link
						currentStart = node.from;
						currentEnd = node.to;
						hasAlias = node.type.name.includes("link-has-alias");
					} else if (currentStart && isInternalLink) {
						// continue of a link
						currentEnd = node.to;
					} else if (currentStart && currentEnd && !isInternalLink) {
						// end of a link
						let currentText = view.state.doc.sliceString(
							currentStart,
							currentEnd
						);
						let currentHref = currentText;

						if (hasAlias) {
							const parts = currentText.split("|");
							currentHref = parts[0];
							currentText = parts[1];
						}

						if (currentHref.trim().endsWith("/")) {
							builder.add(
								currentStart!,
								currentEnd!,
								Decoration.widget({
									widget: new CMFolderLinkWidget(
										currentText,
										currentHref,
										view.state.doc.lineAt(
											currentStart
										).number,
										filesCorePlugin
									),
								})
							);

							currentStart = null;
							currentEnd = null;
							hasAlias = false;
						}
					}
				},
			});
		}

		return builder.finish();
	}
}

const pluginSpec: PluginSpec<CMFolderLinkPlugin> = {
	decorations: (value: CMFolderLinkPlugin) => value.decorations,
};

export const folderLinksPlugin = (filesCorePlugin: IFilesCorePlugin) =>
	ViewPlugin.define((view) => {
		return new CMFolderLinkPlugin(view, filesCorePlugin);
	}, pluginSpec);
