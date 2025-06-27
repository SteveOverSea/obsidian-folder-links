import { MarkdownRenderChild } from "obsidian";
import { RESOLVED_LINK_CLASS, UNRESOLVED_LINK_CLASS } from "../constants";
import { IFileExplorerPlugin, IFolderWrapper } from "../types";
import { getPathFromFolder } from "src/util";

export class FolderLinkView extends MarkdownRenderChild {
	static filesCorePlugin: IFileExplorerPlugin;
	static folders: IFolderWrapper;

	constructor(
		container: HTMLElement,
		private targets: HTMLElement[],
	) {
		super(container);
	}

	onload(): void {
		this.render();
	}

	render(): void {
		this.targets.forEach((target) => {
			if (!target.dataset.href && !target.dataset.folderLink || !FolderLinkView.folders) {
				return;
			}

			let folderPath;
			if (target.dataset.href) {
				folderPath = getPathFromFolder(target.dataset.href);
				target.dataset.folderLink = target.dataset.href;
			} else if (target.dataset.folderLink) {
				folderPath = getPathFromFolder(target.dataset.folderLink);
			} else {
				return;
			}

			if (FolderLinkView.folders.asPathes.includes(folderPath)) {
				target.addClass(RESOLVED_LINK_CLASS);
				target.removeClass(UNRESOLVED_LINK_CLASS);
				target.removeAttribute("data-href");
				target.removeAttribute("href");
				target.removeAttribute("target");
			} else {
				target.addClass(UNRESOLVED_LINK_CLASS);
				target.removeClass(RESOLVED_LINK_CLASS);
			}

		});
	}
}
