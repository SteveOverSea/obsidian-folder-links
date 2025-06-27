import { EditorState, StateEffect, StateField, Transaction } from '@codemirror/state';
import { IFolderWrapper } from 'src/types';

export const updateEffect = StateEffect.define<IFolderWrapper>();
const resetEffect = StateEffect.define<IFolderWrapper>();

// Global current folder state - shared across all editor instances
let globalCurrentFolders: IFolderWrapper | null = null;

// Function to update the global state (call this from your folder observable)
export const setGlobalFolderState = (folders: IFolderWrapper) => {
    globalCurrentFolders = folders;
};

export const folderField = StateField.define<IFolderWrapper>({
    create(_state: EditorState): IFolderWrapper {
        // Instead of always returning empty, use the current global state if available
        const initialState = globalCurrentFolders || { raw: [], asPathes: [] };
        return initialState;
    },
    update(oldState: IFolderWrapper, transaction: Transaction): IFolderWrapper {
        let newState = oldState;

        for (let effect of transaction.effects) {
            if (effect.is(updateEffect)) {
                newState = effect.value;
                // Keep global state in sync
                globalCurrentFolders = effect.value;
            } else if (effect.is(resetEffect)) {
                newState = { raw: [], asPathes: [] };
                globalCurrentFolders = { raw: [], asPathes: [] };
            }
        }

        return newState;
    }
});
