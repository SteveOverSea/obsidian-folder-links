import { EditorView } from '@codemirror/view';
import { IFolderWrapper } from 'src/types';
import { Observable } from 'zen-observable-ts';
import { updateEffect, setGlobalFolderState } from './FolderStateField';

export const folderUpdater = (folderObservable: Observable<IFolderWrapper>) => {
    // Keep global state in sync with observable
    folderObservable.subscribe((folders) => {
        setGlobalFolderState(folders);
    });

    return EditorView.updateListener.of((update) => {
        if (!update.view.dom.dataset.folderRegistered) {
            update.view.dom.dataset.folderRegistered = 'true';

            // Subscribe to future folder changes (only once per view)
            folderObservable.subscribe((folders) => {
                if (update.view.dom.isConnected) {
                    update.view.dispatch({
                        effects: [updateEffect.of(folders)]
                    });
                }
            });
        }
    });
};
