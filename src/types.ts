import {TFolder, View, WorkspaceLeaf} from "obsidian";

interface IFilesCorePluginView extends View {
	revealInFolder: (folder: TFolder) => void;
}

export interface IFileExplorerPlugin extends WorkspaceLeaf {
	view: IFilesCorePluginView;
}

export type IFolderWrapper = {
	raw: TFolder[];
	asPathes: string[];
};

declare global {
	interface Window {
		[key: string]: any;
	}
}

