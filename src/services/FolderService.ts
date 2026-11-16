import { MetadataCache, TFile, TFolder, Vault } from 'obsidian';
import { IFolderWrapper } from 'src/types';
import { getFolderFromPath } from 'src/util';
import { Observable } from 'zen-observable-ts';
import EventService, { EventType } from './EventService';

// Time between the last vault event or subscription of a burst and the publication of the
// new folder list.
const REFRESH_DELAY_MS = 50;

type FolderObserver = ZenObservable.SubscriptionObserver<IFolderWrapper>;

// Caches the vault's folder list and shares it with every subscriber. Registers its vault
// listeners in the constructor, so it must only be constructed after Workspace.onLayoutReady:
// on vault load Obsidian fires a "create" event for every existing file, and each one would
// rescan the whole vault.
export default class FolderService {
    observable: Observable<IFolderWrapper>;
    currentValue: IFolderWrapper;

    private observers = new Set<FolderObserver>();
    private refreshTimer: number | null = null;
    // Set by a vault event: the next timer run has to rescan instead of republishing the cache.
    private dirty = false;

    constructor(
        private vault: Vault,
        private metadataCache: MetadataCache,
        private eventService: EventService
    ) {
        this.currentValue = this.loadAll();

        // All subscribers share one scan and one cached list. Subscribing only schedules the
        // delivery of the cached list, so a subscriber never receives a value synchronously.
        this.observable = new Observable<IFolderWrapper>((observer) => {
            this.observers.add(observer);
            this.scheduleRefresh();
            return () => this.observers.delete(observer);
        });

        const onVaultChange = () => {
            this.dirty = true;
            this.scheduleRefresh();
        };
        this.eventService.onVaultEvent(EventType.Create, onVaultChange);
        this.eventService.onVaultEvent(EventType.Rename, onVaultChange);
        this.eventService.onVaultEvent(EventType.Delete, onVaultChange);
    }

    createFolder(path: string) {
        this.vault.createFolder(path);
    }

    findExistingFolderRaw(folder: TFolder): TFolder | undefined {
        return this.currentValue.raw.find((f) => f === folder);
    }

    // Walks every file and folder of the vault (Vault.getAllFolders has no index), so it must
    // run once per burst of vault events, never once per event.
    private loadAll(): IFolderWrapper {
        const allFolders = this.vault.getAllFolders();
        return {
            raw: allFolders,
            asPathes: allFolders.map((f) => f.path)
        };
    }

    // Vault events and new subscribers only restart the timer. When the burst is over the vault
    // is rescanned at most once — only if a vault event set the dirty flag — and every subscriber
    // gets the list.
    private scheduleRefresh() {
        if (this.refreshTimer !== null) {
            window.clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = window.setTimeout(() => {
            this.refreshTimer = null;
            if (this.dirty) {
                this.currentValue = this.loadAll();
                this.dirty = false;
            }
            // iterate over a copy: a subscriber may unsubscribe while it is being notified
            for (const observer of Array.from(this.observers)) {
                observer.next(this.currentValue);
            }
        }, REFRESH_DELAY_MS);
    }

    // Cancels a pending refresh so it cannot scan the vault after the plugin was unloaded.
    dispose() {
        if (this.refreshTimer !== null) {
            window.clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.observers.clear();
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
