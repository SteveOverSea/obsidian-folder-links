import { MarkdownRenderChild } from "obsidian";
import { RESOLVED_LINK_CLASS, UNRESOLVED_LINK_CLASS } from "../constants";
import { IFilesCorePlugin, IFolderWrapper } from "../types";
import { getPathFromFolder } from "src/util";

export class FolderLinkView extends MarkdownRenderChild {
	static filesCorePlugin: IFilesCorePlugin;
	static folders: IFolderWrapper;

	constructor(
		container: HTMLElement,
		private targets: HTMLElement[],
		filesCorePlugin: IFilesCorePlugin
	) {
		super(container);
		if (!FolderLinkView.filesCorePlugin && filesCorePlugin) {
			FolderLinkView.filesCorePlugin = filesCorePlugin;
		}
	}

	onload(): void {
		this.render();
	}

	render(): void {
		this.targets.forEach((target) => {
			if (!target.dataset.href || !FolderLinkView.folders) {
				return;
			}

			const folderPath = getPathFromFolder(target.dataset.href);

			target.removeAttribute("href");
			target.removeAttribute("data-href");
			target.removeAttribute("target");

			if (FolderLinkView.folders.asPathes.includes(folderPath)) {
				target.addClass(RESOLVED_LINK_CLASS);
				target.removeClass(UNRESOLVED_LINK_CLASS);

				this.registerDomEvent(target, "click", () => {
					FolderLinkView.filesCorePlugin.view.revealInFolder(
						FolderLinkView.folders.raw.filter(
							(f) => f.path === folderPath
						)[0]
					);
				});
			} else {
				target.addClass(UNRESOLVED_LINK_CLASS);
				target.removeClass(RESOLVED_LINK_CLASS);
			}
		});
	}
}
