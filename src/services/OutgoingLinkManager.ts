import { setIcon } from 'obsidian';
import FolderService from './FolderService';
import { PluginSettings } from 'src/settings/ISettings';
import { getPathFromFolder } from 'src/util';
import { TranslationService } from './TranslationService';
import { IOutgoingLink } from 'src/types';

export class OutgoingLinkmanager {
    private mutationObserver: MutationObserver | undefined;
    private debouncedUpdateFolderLinks: () => void;
    private isUpdating = false;

    constructor(
        private translationService: TranslationService,
        private folderService: FolderService,
        private outgoingLink: IOutgoingLink,
        private settings: PluginSettings
    ) {
        this.debouncedUpdateFolderLinks = this.debounce(() => this.updateFolderLinks(), 100);
        this.setupMutationObserver();
    }

    private debounce(func: () => void, wait: number) {
        let timeout: number | undefined;
        return () => {
            if (timeout) clearTimeout(timeout);
            timeout = window.setTimeout(func, wait);
        };
    }

    private setupMutationObserver() {
        const container = this.outgoingLink.view.containerEl;
        if (!container) return;
        this.mutationObserver = new MutationObserver(this.update.bind(this));
        this.mutationObserver.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
    }

    update(args: MutationRecord[]) {
        // Only react if a relevant mutation occurred
        const relevant = args.some(
            (mutation) =>
                mutation.type === 'childList' ||
                (mutation.type === 'attributes' && mutation.attributeName === 'data-folder-link') ||
                mutation.type === 'characterData'
        );
        if (!relevant) return;

        if (this.isUpdating) return; // Prevent re-entrancy
        this.isUpdating = true;
        try {
            if (this.settings.showInBackLinks) {
                this.debouncedUpdateFolderLinks();
            } else {
                this.removeFolderLinks();
            }
        } finally {
            this.isUpdating = false;
        }
    }

    removeFolderLinks() {
        const itemEls = this.outgoingLink.view.containerEl.querySelectorAll('.outgoing-link-item');
        itemEls.forEach((itemEl) => {
            if (itemEl.textContent?.endsWith('/')) {
                itemEl.remove();
            }
        });
    }

    updateFolderLinks() {
        this.mutationObserver?.disconnect();
        const itemEls = this.outgoingLink.view.containerEl.querySelectorAll('.outgoing-link-item');
        // Early return checks intentionally removed for idempotent update logic
        itemEls.forEach((itemEl) => {
            const linkName = itemEl.textContent;
            if (linkName?.endsWith('/') && this.folderService.currentValue) {
                const folder = this.folderService.currentValue.raw.find(
                    (f) => f.path === getPathFromFolder(linkName)
                );
                // Only set dataset if changed
                if ((itemEl as HTMLElement).dataset.folderLink !== linkName) {
                    (itemEl as HTMLElement).dataset.folderLink = linkName;
                }
                const iconEl = itemEl.querySelector('.tree-item-icon') as HTMLElement;
                if (folder) {
                    const newLabel = this.translationService.getTranslation(
                        'plugins.file-explorer.action-reveal-file'
                    );
                    if ((itemEl as HTMLElement).ariaLabel !== newLabel) {
                        (itemEl as HTMLElement).ariaLabel = newLabel;
                    }
                    if (iconEl && iconEl.getAttribute('data-icon') !== 'link') {
                        setIcon(iconEl, 'link');
                    }
                } else {
                    const newLabel = this.translationService.getTranslation(
                        'plugins.outgoing-links.tooltip-not-created'
                    );
                    if ((itemEl as HTMLElement).ariaLabel !== newLabel) {
                        (itemEl as HTMLElement).ariaLabel = newLabel;
                    }
                    if (iconEl && iconEl.getAttribute('data-icon') !== 'folder-plus') {
                        setIcon(iconEl, 'folder-plus');
                    }
                }
            }
        });
        this.setupMutationObserver();
    }

    disconnect() {
        this.mutationObserver?.disconnect();
    }
}
