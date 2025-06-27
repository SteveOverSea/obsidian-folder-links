import { Notice } from "obsidian"

export class UserHandableError extends Error { }

export function showErrorNotice(message: string) {
    new Notice(`FolderLinks: Error: ${message}`);
}