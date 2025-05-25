import {App} from "obsidian";
import {IFolderWrapper} from "./types";
import {Observable} from "zen-observable-ts";

export function loadFolders(app: App): IFolderWrapper {
	const allFolders = app.vault.getAllFolders();
	return {
		raw: allFolders,
		asPathes: allFolders.map((f) => f.path),
	};
}

export function getMarkdownLeaves(app: App) {
	return app.workspace.getLeavesOfType("markdown");
}

// removes last "/"
export function getPathFromFolder(folder: string) {
	const trimmedFolder = folder.trim();
	return trimmedFolder.substring(0, trimmedFolder.length - 1);
}

export function isFolderLink(string: any) {
	return string.endsWith("/");
}

export function debounce<T>(
	source: Observable<T>,
	delay: number
): Observable<T> {
	return new Observable<T>((observer) => {
		let timeoutId: NodeJS.Timeout | null = null;

		const subscription = source.subscribe({
			next(value) {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(() => {
					observer.next(value);
				}, delay);
			},
			error(err) {
				observer.error(err);
			},
			complete() {
				observer.complete();
			},
		});

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			subscription.unsubscribe();
		};
	});
}

export function getCorePlugin<T>(type: string): T {
	const plugins =
		this.app.workspace.getLeavesOfType(type);

	if (plugins.length !== 1) {
		throw new Error(`Could not load core plugin of type ${type}.`);
	}

	return this.app.workspace.getLeavesOfType(
		type
	)[0];
}
