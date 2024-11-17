import { FolderLinkView } from "src/FolderLinkView";
import { Plugin, TFolder, View, WorkspaceLeaf } from "obsidian";

interface IFilesCorePluginView extends View {
	revealInFolder: (folder: TFolder) => void;
}

export interface IFilesCorePlugin extends WorkspaceLeaf {
	view: IFilesCorePluginView;
}

export default class FolderLinksPlugin extends Plugin {
	filesCorePlugin: IFilesCorePlugin;

	init() {
		// this only handles reading mode
		this.registerMarkdownPostProcessor((element, context) => {
			if (!this.filesCorePlugin) {
				return;
			}
			const folderLinks = element
				.findAll(".internal-link")
				.filter((el) => el.textContent && el.textContent.endsWith("/"));
			if (folderLinks) {
				const child = new FolderLinkView(
					element,
					folderLinks,
					this.app,
					this.filesCorePlugin
				);
				context.addChild(child);
			}
		});
	}

	async onload() {
		this.app.workspace.onLayoutReady(() => {
			const fileExplorerPlugins =
				this.app.workspace.getLeavesOfType("file-explorer");

			if (fileExplorerPlugins.length === 0) {
				// TODO add error message
				return;
			} else if (fileExplorerPlugins.length > 1) {
				// TODO add error message;
				return;
			}
			this.filesCorePlugin = this.app.workspace.getLeavesOfType(
				"file-explorer"
			)[0] as IFilesCorePlugin;

			this.init();
		});
	}
}
