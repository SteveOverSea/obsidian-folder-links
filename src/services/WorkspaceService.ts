import { MetadataCache, Workspace } from 'obsidian';

export class WorkspaceService {
    constructor(private workspace: Workspace, private metadataCache: MetadataCache) {}

    getActiveEditor() {
        return this.workspace.activeEditor;
    }

    folderLinksinActiveEditor(): number | undefined {
        const editor = this.getActiveEditor();
        if (!editor || !editor.file) {
            return undefined;
        }
        const unresolvedLinks = this.metadataCache.unresolvedLinks[editor.file.path];
        return Object.keys(unresolvedLinks).filter((key) => key.trim().endsWith('/')).length;
    }
}
