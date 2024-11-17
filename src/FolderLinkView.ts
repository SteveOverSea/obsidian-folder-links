import { IFilesCorePlugin } from "src/main";
import { App, MarkdownRenderChild, TFolder } from "obsidian";

type IFolderWrapper = {
	raw: TFolder[];
	asPathes: string[];
};

export class FolderLinkView extends MarkdownRenderChild {
	static app: App;
	static filesCorePlugin: IFilesCorePlugin;
	static folders: IFolderWrapper;

	constructor(
		container: HTMLElement,
		private targets: HTMLElement[],
		app?: App,
		filesCorePlugin?: IFilesCorePlugin
	) {
		super(container);
		if (!FolderLinkView.filesCorePlugin && filesCorePlugin) {
			FolderLinkView.filesCorePlugin = filesCorePlugin;
		}
		if (!FolderLinkView.app && app) {
			FolderLinkView.app = app;
		}
	}

	loadFolders() {
		const allFolders = FolderLinkView.app.vault.getAllFolders();
		FolderLinkView.folders = {
			raw: allFolders,
			asPathes: allFolders.map((f) => f.path),
		};

		this.render();
	}

	onload(): void {
		this.registerEvent(
			FolderLinkView.app.vault.on("create", () => {
				this.loadFolders();
			})
		);

		// "rename" also handles moving folders
		this.registerEvent(
			FolderLinkView.app.vault.on("rename", () => {
				this.loadFolders();
			})
		);

		this.registerEvent(
			FolderLinkView.app.vault.on("delete", () => {
				this.loadFolders();
			})
		);

		this.loadFolders();
		this.render();
	}

	render(): void {
		this.targets.forEach((target) => {
			// is it even possible to have links with no content?
			if (!target.textContent || !FolderLinkView.folders) {
				return;
			}
			target.removeAttribute("href");
			target.removeAttribute("data-href");
			target.removeAttribute("target");

			const folderPath = target.textContent.substring(
				0,
				target.textContent.length - 1
			);

			if (FolderLinkView.folders.asPathes.includes(folderPath)) {
				target.addClass("is-resolved");
				target.removeClass("is-unresolved");

				this.registerDomEvent(target, "click", () => {
					FolderLinkView.filesCorePlugin.view.revealInFolder(
						FolderLinkView.folders.raw.filter(
							(f) => f.path === folderPath
						)[0]
					);
				});
			} else {
				target.addClass("is-unresolved");
				target.removeClass("is-resolved");
			}
		});
	}
}
