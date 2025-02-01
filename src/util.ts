import { App } from "obsidian";
import { IFolderWrapper } from "./types";
import { Observable } from "zen-observable-ts";

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
	return folder.substring(0, folder.length - 1);
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

export function retryWithTimeout(
	callback: Function,
	maxRetries = 5,
	initialDelay = 50
) {
	let attempt = 0;

	function tryExecute() {
		return new Promise<void>((resolve, reject) => {
			try {
				callback();
				resolve();
			} catch (error) {
				attempt++;
				if (attempt < maxRetries) {
					// Exponential backoff
					const delay = initialDelay * Math.pow(2, attempt);

					setTimeout(() => {
						try {
							tryExecute();
							resolve();
						} catch (error) {
							reject();
						}
					}, delay);
				} else {
					reject(
						new Error(
							"Max retries reached. Could not complete the operation."
						)
					);
				}
			}
		});
	}

	return tryExecute();
}
