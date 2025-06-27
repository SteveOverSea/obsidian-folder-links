import { escapeRegex, getFolderFromPath, getPathFromFolder } from 'src/util';
import EventService, { EventType } from './EventService';
import FolderService from './FolderService';
import { IFileExplorerPlugin } from 'src/types';
import { Modal, Notice, TFile, TFolder, Vault } from 'obsidian';
import { ModalService } from './ModalService';
import { TranslationService } from './TranslationService';
import { SettingsService } from './SettingsService';

export class FolderLinkManager {
    constructor(
        private vault: Vault,
        private settingsService: SettingsService,
        private translationService: TranslationService,
        private eventService: EventService,
        private modalService: ModalService,
        private folderService: FolderService,
        private fileExplorer: IFileExplorerPlugin
    ) {
        this.setupClickListener();
        this.eventService.onVaultEvent(EventType.Rename, this.renameAfterUpdateCb.bind(this));
    }

    private setupClickListener() {
        this.eventService.onDOMEvent(
            window,
            'click',
            '[data-folder-link]',
            (el, ev) => {
                ev.stopPropagation();
                const existingFolder = this.folderService.currentValue.raw.filter(
                    (f) => f.path === getPathFromFolder(el.dataset.folderLink!)
                )[0];

                if (existingFolder) {
                    this.fileExplorer.view.revealInFolder(existingFolder);
                } else {
                    this.folderService.createFolder(getPathFromFolder(el.dataset.folderLink!));
                }
            },
            true
        );
    }

    private renameAfterUpdateCb(file: TFile, oldPath: string) {
        if (file instanceof TFolder) {
            const filesThatLink = this.folderService.getLinkedFiles(oldPath);
            const linksCount = this.folderService.getFolderLinkCountInFiles(filesThatLink, oldPath);

            if (filesThatLink.length) {
                if (this.settingsService.getSetting('alwaysUpdate')) {
                    this.renameFolderLinksInFiles(
                        filesThatLink,
                        getFolderFromPath(file.path),
                        getFolderFromPath(oldPath),
                        linksCount,
                        filesThatLink.length
                    );
                } else {
                    let modal: Modal;
                    const modalBody = new DocumentFragment();
                    const firstParagraph = document.createElement('p');
                    const secondParagraph = document.createElement('p');

                    firstParagraph.textContent = this.translationService
                        .getTranslation('dialogue.label-confirm-update-link-to-file')
                        .replace(
                            this.translationService.getTranslation(
                                'plugins.bases.label-file-prop-file'
                            ),
                            this.translationService.getTranslation(
                                'plugins.bases.label-file-prop-folder'
                            )
                        );
                    secondParagraph.textContent = this.translationService.getTranslation(
                        'dialogue.label-link-affected',
                        {
                            links: this.translationService.getTranslation(
                                'nouns.link-with-count_plural',
                                { count: linksCount.toString() }
                            ),
                            files: this.translationService.getTranslation(
                                'nouns.file-with-count_plural',
                                { count: filesThatLink.length.toString() }
                            )
                        }
                    );

                    const buttonContainer = document.createElement('div');
                    buttonContainer.classList.add('modal-button-container');
                    const alwaysUpdateButton = document.createElement('button');
                    alwaysUpdateButton.textContent = 'Always update';
                    alwaysUpdateButton.onclick = async () => {
                        await this.renameFolderLinksInFiles(
                            filesThatLink,
                            getFolderFromPath(file.path),
                            getFolderFromPath(oldPath),
                            linksCount,
                            filesThatLink.length
                        );
                        await this.settingsService.setSetting('alwaysUpdate', true);
                        modal.close();
                    };
                    buttonContainer.appendChild(alwaysUpdateButton);
                    const justOnceButton = document.createElement('button');
                    justOnceButton.textContent = 'Just once';
                    justOnceButton.onclick = async () => {
                        await this.renameFolderLinksInFiles(
                            filesThatLink,
                            getFolderFromPath(file.path),
                            getFolderFromPath(oldPath),
                            linksCount,
                            filesThatLink.length
                        );
                        modal.close();
                    };
                    buttonContainer.appendChild(justOnceButton);
                    const doNotUpdateButton = document.createElement('button');
                    doNotUpdateButton.textContent = 'Do not update';
                    doNotUpdateButton.onclick = async () => {
                        modal.close();
                    };
                    buttonContainer.appendChild(doNotUpdateButton);

                    modalBody.append(firstParagraph, secondParagraph);

                    modal = this.modalService.createModal(
                        this.translationService.getTranslation('dialogue.label-update-links'),
                        modalBody
                    );
                    modal.contentEl.parentElement?.appendChild(buttonContainer);
                    modal.open();
                }
            }
        }
    }

    private async renameFolderLinksInFiles(
        files: TFile[],
        newLink: string,
        oldLink: string,
        linkCount: number,
        filesCount: number
    ) {
        for (const file of files) {
            try {
                const content = await this.vault.read(file);
                const regex = new RegExp(
                    `(\\s*\\[\\[\\s*)${escapeRegex(oldLink)}([^\\]]*\\]\\]\\s*)`,
                    'g'
                );
                const updatedContent = content.replace(regex, `$1${newLink}$2`);

                if (content !== updatedContent) {
                    await this.vault.modify(file, updatedContent);
                }
            } catch (error) {
                throw new Error(`Failed to update links in ${file.path}:`);
            }
        }
        new Notice(
            this.translationService.getTranslation('dialogue.msg-updated-links', {
                links: this.translationService.getTranslation('nouns.link-with-count_plural', {
                    count: linkCount.toString()
                }),
                files: this.translationService.getTranslation('nouns.file-with-count_plural', {
                    count: filesCount.toString()
                })
            })
        );
    }
}
