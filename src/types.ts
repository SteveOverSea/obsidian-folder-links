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

export interface IFileExplorerPlugin extends WorkspaceLeaf {
    view: WorkspaceLeaf['view'] & {
        revealInFolder: (folder: TFolder) => void;
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
