import {MarkdownView, Plugin, setIcon, WorkspaceLeaf} from "obsidian";
import {IFileExplorerPlugin, IFolderWrapper} from "./types";
import {folderLinkPostProcessor} from "./post-processor/FolderLinkPostProcessor";
import {debounce, getCorePlugin, getPathFromFolder, loadFolders} from "./util";
import {EditorView} from "@codemirror/view";
import {folderField, updateEffect} from "./editor-extension/FolderStateField";
import {Observable} from "zen-observable-ts";
import {folderMarkPlugin} from "./editor-extension/MarkFolderLink";
import {PluginSettings} from "./settings/ISettings";
import {SettingsTab} from "./settings/SettingsTab";
import {DEFAULT_SETTINGS} from "./settings/default";

export default class FolderLinksPlugin extends Plugin {
	settings: PluginSettings;
	fileExplorerPlugin: IFileExplorerPlugin;
	outgoingLinkPlugin: WorkspaceLeaf;
	folderObservable: Observable<IFolderWrapper>;
	currentFolderObsValue: IFolderWrapper;
	mutationObserver: MutationObserver;

	// bootstrap inspired event handler (source: https://github.com/twbs/bootstrap/blob/main/js/src/dom/event-handler.js)
	on(container: Window, type: keyof WindowEventMap, selector: string, handler: (element: HTMLElement, event: Event) => void, options?: boolean | AddEventListenerOptions): void {
		this.registerDomEvent(container, type, (ev) => {
			const target = (ev.target as HTMLElement).closest(selector);
			if (target) {
				handler(target as HTMLElement, ev);
			}
		}, options);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	removeFolderLinksFromOutgoingLinks() {
		const itemEls = this.outgoingLinkPlugin.view.containerEl.querySelectorAll('.outgoing-link-item');
		itemEls.forEach((itemEl) => {
			if (itemEl.textContent?.endsWith('/')) {
				itemEl.remove();
			}
		});
	}

	updateFolderLinksFromOutgoingLinks() {
		const itemEls = this.outgoingLinkPlugin.view.containerEl.querySelectorAll('.outgoing-link-item');
		itemEls.forEach((itemEl) => {
			const linkName = itemEl.textContent;

			if (linkName?.endsWith('/') && this.currentFolderObsValue) {
				const folder = this.currentFolderObsValue.raw.filter(
					(f) => f.path === getPathFromFolder(linkName)
				)[0];

				(itemEl as HTMLElement).dataset.folderLink = linkName;

				const iconEl = itemEl.querySelector('.tree-item-icon') as HTMLElement;

				if (folder) {
					(itemEl as HTMLElement).ariaLabel = window.OBSIDIAN_DEFAULT_I18N.plugins.fileExplorer.actionRevealFile;
					iconEl && setIcon(iconEl, 'link');
				} else {
					(itemEl as HTMLElement).ariaLabel = window.OBSIDIAN_DEFAULT_I18N.plugins.outgoingLinks.tooltipNotCreated;
					iconEl && setIcon(iconEl, 'folder-plus');
				}

			}
		});
	}

	outgoingLinkMutationHandler = (mutationsList: MutationRecord[], _observer: MutationObserver) => {
		for (const mutation of mutationsList) {
			if (mutation.addedNodes.length > 0) {
				if (this.settings.showInBackLinks) {
					if (Array.from(mutation.addedNodes).every((node) => node instanceof HTMLElement && !node.className.contains('lucide') && !node.dataset.lucide)) {
						this.updateFolderLinksFromOutgoingLinks();
					}
				} else {
					this.removeFolderLinksFromOutgoingLinks();
				}
			}
		}
	};

	updateEditorState(folders: IFolderWrapper) {
		const markdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView);

		if (!markdownView) {
			return;
		}

		const editorView =
			//@ts-ignore
			(markdownView as MarkdownView).editor.cm as EditorView;

		editorView.dispatch({
			effects: [updateEffect.of(folders)],
		});

		if (editorView.state.field(folderField) == null) {
			throw new Error("could not update editor state");
		}
	}

	setupClickListener() {
		this.on(window, 'click', '[data-folder-link]', (el, ev) => {
			ev.stopPropagation();
			const existingFolder = this.currentFolderObsValue.raw.filter(
				(f) => f.path === getPathFromFolder(el.dataset.folderLink!)
			)[0];

			if (existingFolder) {
				this.fileExplorerPlugin.view.revealInFolder(existingFolder)
			} else {
				this.app.vault.createFolder(getPathFromFolder(el.dataset.folderLink!));
			}

		}, true);
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		if (!window.OBSIDIAN_DEFAULT_I18N) {
			throw new Error("could not load obsdidian default i18n");
		}

		this.setupClickListener();

		this.app.workspace.onLayoutReady(() => {
			this.fileExplorerPlugin = getCorePlugin<IFileExplorerPlugin>('file-explorer');
			this.outgoingLinkPlugin = getCorePlugin<WorkspaceLeaf>('outgoing-link');

			this.mutationObserver = new MutationObserver(this.outgoingLinkMutationHandler);
			const outgoingLinksPane = this.app.workspace.containerEl.querySelector('.outgoing-link-pane');
			if (outgoingLinksPane) {
				this.mutationObserver.observe(outgoingLinksPane, {subtree: true, childList: true})
			}

			this.registerEvent(
				this.app.workspace.on("active-leaf-change", () => {
					this.updateEditorState(this.currentFolderObsValue);
				})
			);

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

	init() {
		this.folderObservable.subscribe((folders) => {
			this.currentFolderObsValue = folders;
			this.updateEditorState(folders);
			if (this.settings.showInBackLinks) {
				this.updateFolderLinksFromOutgoingLinks();
			} else {
				this.removeFolderLinksFromOutgoingLinks();
			}
		});

		this.registerMarkdownPostProcessor(
			folderLinkPostProcessor(this.folderObservable, this.fileExplorerPlugin)
		);

		this.registerEditorExtension([
			folderField,
			folderMarkPlugin
		]);
	}

	unload() {
		this.mutationObserver.disconnect();
		super.unload();
	}
}
