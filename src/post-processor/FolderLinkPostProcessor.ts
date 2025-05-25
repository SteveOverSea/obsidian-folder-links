import {MarkdownPostProcessor, MarkdownPostProcessorContext} from "obsidian";
import {FolderLinkView} from "./FolderLinkView";
import {IFileExplorerPlugin, IFolderWrapper} from "src/types";
import {Observable} from "zen-observable-ts";

class FolderLinkPostProcessor {
	folderLinkViews: FolderLinkView[] = [];

	constructor(
		private folderObs: Observable<IFolderWrapper>,
		private filesCorePlugin: IFileExplorerPlugin
	) {
		this.folderObs.subscribe((folders) => {
			FolderLinkView.folders = folders;

			this.folderLinkViews.forEach((folderLinkView) => {
				folderLinkView.render();
			});
		});
	}

	create(): MarkdownPostProcessor {
		return (
			element: HTMLElement,
			context: MarkdownPostProcessorContext
		) => {
			const folderLinks = element
				.findAll(".internal-link")
				.filter(
					(el) => el.dataset.href && el.dataset.href.endsWith("/")
				);

			if (folderLinks && folderLinks.length) {
				const child = new FolderLinkView(
					element,
					folderLinks,
					this.filesCorePlugin
				);
				context.addChild(child);
				this.folderLinkViews.push(child);
			}
		};
	}
}

export const folderLinkPostProcessor = (
	folderObs: Observable<IFolderWrapper>,
	filesCorePlugin: IFileExplorerPlugin
) => new FolderLinkPostProcessor(folderObs, filesCorePlugin).create();
