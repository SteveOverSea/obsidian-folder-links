import { MetadataCache, TFile, TFolder, Vault } from 'obsidian';
import { IFolderWrapper } from 'src/types';
import { debounce, getFolderFromPath } from 'src/util';
import { Observable } from 'zen-observable-ts';
import EventService, { EventType } from './EventService';

export default class FolderService {
    observable: Observable<IFolderWrapper>;
    currentValue: IFolderWrapper;

    constructor(
        private vault: Vault,
        private metadataCache: MetadataCache,
        private eventService: EventService
    ) {
        this.currentValue = this.loadAll();
        this.setupObservable();
        this.observable.subscribe((value) => {
            this.currentValue = value;
        });
    }

    createFolder(path: string) {
        this.vault.createFolder(path);
    }

    findExistingFolderRaw(folder: TFolder): TFolder | undefined {
        return this.currentValue.raw.find((f) => f === folder);
    }

    private loadAll(): IFolderWrapper {
        const allFolders = this.vault.getAllFolders();
        return {
            raw: allFolders,
            asPathes: allFolders.map((f) => f.path)
        };
    }

    private setupObservable() {
        this.observable = debounce(
            new Observable((observer) => {
                observer.next(this.loadAll());

                this.eventService.onVaultEvent(EventType.Create, () => {
                    observer.next(this.loadAll());
                });

                this.eventService.onVaultEvent(EventType.Rename, () => {
                    observer.next(this.loadAll());
                });

                this.eventService.onVaultEvent(EventType.Delete, () => {
                    observer.next(this.loadAll());
                });
            }),
            50
        );
    }

    getLinkedFiles(folderPath: string): TFile[] {
        const fileNames = new Set();
        Object.entries(this.metadataCache.unresolvedLinks).forEach(([path, filesObj]) => {
            if (Object.keys(filesObj).includes(getFolderFromPath(folderPath))) {
                fileNames.add(path);
            }
        });

        return Array.from(fileNames)
            .map((path: string) => this.vault.getFileByPath(path))
            .filter((file): file is TFile => file !== null);
    }

    getFolderLinkCountInFile(file: TFile, folderPath: string): number {
        return this.metadataCache.unresolvedLinks[file.path][getFolderFromPath(folderPath)] || 0;
    }

    getFolderLinkCountInFiles(files: TFile[], folderPath: string): number {
        return files.reduce((total, file) => {
            return total + this.getFolderLinkCountInFile(file, folderPath);
        }, 0);
    }
}
