import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";
import { FolderLinkView } from "./FolderLinkView";
import { IFilesCorePlugin, IFolderWrapper } from "src/types";
import { Observable } from "zen-observable-ts";

class FolderLinkPostProcessor {
	folderLinkViews: FolderLinkView[] = [];

	constructor(
		private folderObs: Observable<IFolderWrapper>,
		private filesCorePlugin: IFilesCorePlugin
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
				.filter((el) => el.textContent && el.textContent.endsWith("/"));

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
	filesCorePlugin: IFilesCorePlugin
) => new FolderLinkPostProcessor(folderObs, filesCorePlugin).create();
