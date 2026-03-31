import { TFile, TFolder, View, WorkspaceLeaf } from 'obsidian';

interface IGraphNode {
    id: string;
    type: string;
    _folderLink?: TFolder | null;
    getFillColor: () => { a: number; rgb: number };
    __proto__: IGraphNode;
}

export interface IGraphView extends WorkspaceLeaf {
    view: WorkspaceLeaf['view'] & {
        dataEngine: {
            renderer: {
                onNodeClick: (event: MouseEvent, path: string) => void;
                getHighlightNode: () => IGraphNode | null;
                nodes: IGraphNode[];
                nodeLookup: { [key: string]: IGraphNode };
            };
        };
        renderer: any;
    };
}

export interface IOutgoingLink extends WorkspaceLeaf {
    view: WorkspaceLeaf['view'] & {
        file: TFile;
    };
}

export interface IFileExplorerItem {
	setCollapsed: (collapsed: boolean) => void;
}

export interface IFileExplorerPlugin extends WorkspaceLeaf {
    view: WorkspaceLeaf['view'] & {
		fileItems: Record<string, IFileExplorerItem>;
        revealInFolder?: (folder: TFolder) => void;
    };
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

export interface ISettingsPlugin {
    saveSettings(): Promise<void>;
}

export interface Service {}
