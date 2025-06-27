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

export function hexToDecimalRGB(hex: string) {
	// Remove # if present
	hex = hex.replace('#', '');

	// Parse hex components
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);

	// Combine into single decimal number
	// Formula: (R << 16) + (G << 8) + B
	const decimal = (r << 16) + (g << 8) + b;

	return {
		decimal: decimal,
		r: r,
		g: g,
		b: b,
		hex: hex
	};
}

export function getMarkdownLeaves(app: App) {
	return app.workspace.getLeavesOfType("markdown");
}

// removes last "/"
export function getPathFromFolder(folder: string): string {
	const trimmedFolder = folder.trim();
	return trimmedFolder.substring(0, trimmedFolder.length - 1);
}

// adds "/"
export function getFolderFromPath(path: string): string {
	const trimmedPath = path.trim();
	return trimmedPath + '/';
}

export function isFolderLink(string: any) {
	return string.endsWith("/");
}

export function isMarkdownFile(string: any) {
	return string.endsWith(".md");
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

// some core plugin may are only temporary (like graph only when graph view is there)
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

export function escapeRegex(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
