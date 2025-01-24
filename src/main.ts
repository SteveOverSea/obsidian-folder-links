import { MarkdownView, Plugin } from "obsidian";
import { folderLinksPlugin } from "./editor-extension/CMFolderLinkPlugin";
import { IFilesCorePlugin, IFolderWrapper } from "./types";
import { folderLinkPostProcessor } from "./post-processor/FolderLinkPostProcessor";
import { debounce, getMarkdownLeaves, loadFolders } from "./util";
import { EditorView } from "@codemirror/view";
import { folderField, updateEffect } from "./editor-extension/FolderStateField";
import { Observable } from "zen-observable-ts";

export default class FolderLinksPlugin extends Plugin {
	filesCorePlugin: IFilesCorePlugin;
	folderObservable: Observable<IFolderWrapper>;

	async onload() {
		this.app.workspace.onLayoutReady(() => {
			this.filesCorePlugin = this.getInternalFileExlorerPlugin();

			this.folderObservable = debounce(
				new Observable((observer) => {
					observer.next(loadFolders(this.app));

					this.registerEvent(
						this.app.vault.on("create", () => {
							observer.next(loadFolders(this.app));
						})
					);

					this.registerEvent(
						this.app.vault.on("rename", () => {
							observer.next(loadFolders(this.app));
						})
					);

					this.registerEvent(
						this.app.vault.on("delete", () => {
							observer.next(loadFolders(this.app));
						})
					);
				}),
				50
			);

			this.init();
		});
	}

	updateEditorState(folders: IFolderWrapper) {
		const markdownViews = getMarkdownLeaves(this.app);
		for (const markdownView of markdownViews) {
			const editorView = (
				(markdownView.view as MarkdownView).editor as any
			).cm as EditorView;
			editorView.dispatch({
				effects: [updateEffect.of(folders)],
			});
		}
	}

	getInternalFileExlorerPlugin() {
		const fileExplorerPlugins =
			this.app.workspace.getLeavesOfType("file-explorer");

		if (fileExplorerPlugins.length !== 1) {
			throw new Error("Could not load file explorer plugin.");
		}

		return this.app.workspace.getLeavesOfType(
			"file-explorer"
		)[0] as IFilesCorePlugin;
	}

	init() {
		this.folderObservable.subscribe((folders) => {
			this.updateEditorState(folders);
		});

		// reading mode
		this.registerMarkdownPostProcessor(
			folderLinkPostProcessor(this.folderObservable, this.filesCorePlugin)
		);

		// live preview
		this.registerEditorExtension([
			folderLinksPlugin(this.filesCorePlugin),
			folderField,
		]);
	}
}
