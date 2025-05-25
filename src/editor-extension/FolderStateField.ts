import {EditorState, StateEffect, StateField, Transaction,} from "@codemirror/state";
import {IFolderWrapper} from "src/types";

export const updateEffect = StateEffect.define<IFolderWrapper>();
const resetEffect = StateEffect.define<IFolderWrapper>();

export const folderField = StateField.define<IFolderWrapper>({
	create(_state: EditorState): IFolderWrapper {
		return {raw: [], asPathes: []};
	},
	update(oldState: IFolderWrapper, transaction: Transaction): IFolderWrapper {
		let newState = oldState;

		for (let effect of transaction.effects) {
			if (effect.is(updateEffect)) {
				newState = effect.value;
			} else if (effect.is(resetEffect)) {
				newState = {raw: [], asPathes: []};
			}
		}

		return newState;
	},
});
