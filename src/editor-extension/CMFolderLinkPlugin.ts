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

	constructor(content: string, private filesCorePlugin: IFilesCorePlugin) {
		super();
		this.content = content;
	}

	toDOM(view: EditorView): HTMLElement {
		const folders = view.state.field(folderField);
		const folderLinkEl = document.createElement("a");

		if (folders) {
			const folderPath = getPathFromFolder(this.content);

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

			folderLinkEl.innerText = this.content;
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
		if (
			update.state.field(folderField).raw !=
			update.startState.field(folderField).raw
		) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const filesCorePlugin = this.filesCorePlugin;

		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					if (node.type.name.includes("hmd-internal-link")) {
						const nodeText = view.state.doc.sliceString(
							node.from,
							node.to
						);

						if (nodeText.endsWith("/")) {
							builder.add(
								node.from,
								node.to,
								Decoration.widget({
									widget: new CMFolderLinkWidget(
										nodeText,
										filesCorePlugin
									),
								})
							);
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
