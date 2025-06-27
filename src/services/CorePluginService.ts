import { Workspace, WorkspaceLeaf } from 'obsidian';
import { CorePluginId } from 'src/constants';

type WatcherCallback<T extends WorkspaceLeaf> = (leaf: T) => void;

class LeafWatcher<T extends WorkspaceLeaf> {
    private instances: Set<T> = new Set();

    constructor(
        readonly id: CorePluginId,
        readonly initCb?: WatcherCallback<T>,
        readonly cleanupCb?: WatcherCallback<T>,
        readonly updateCb?: WatcherCallback<T>,
        readonly allowMultiple: boolean = false
    ) {}

    addInstance(instance: T) {
        if (!this.instances.has(instance)) {
            this.instances.add(instance);
            if (this.initCb) {
                this.initCb(instance);
                return;
            }
        } else if (this.updateCb) {
            this.updateCb(instance);
        }
    }

    removeInstance(instance: T) {
        if (this.instances.has(instance)) {
            if (this.cleanupCb) {
                this.cleanupCb(instance);
            }
            this.instances.delete(instance);
        }
    }

    getInstances(): Set<T> {
        return this.instances;
    }

    clearInstances() {
        for (const instance of this.instances) {
            if (this.cleanupCb) {
                this.cleanupCb(instance);
            }
        }
        this.instances.clear();
    }

    setInstance(instance: T) {
        this.addInstance(instance);
    }

    getInstance(): T | undefined {
        return this.instances.size === 1 ? this.instances.entries().next().value : undefined;
    }

    clearInstance() {
        this.clearInstances();
    }
}

export default class CorePluginService {
    private watchers: Map<String, LeafWatcher<WorkspaceLeaf>> = new Map();

    constructor(private workspace: Workspace) {
        this.workspace.on('active-leaf-change', (leaf) => {
            this.watchers.forEach((watcher) => {
                const found = this.workspace.getLeavesOfType(watcher.id);

                if (found && found.length === 1) {
                    watcher.setInstance(found[0]);
                } else if (found.length === 0) {
                    watcher.clearInstance();
                } else if (watcher.allowMultiple) {
                    found.forEach((leaf) => {
                        watcher.addInstance(leaf);
                    });
                } else {
                    throw Error(`More than one instance of ${watcher.id} available!`);
                }
            });
        });
    }

    getInstancesImmediate<T extends WorkspaceLeaf>(id: CorePluginId): T[] {
        return this.workspace.getLeavesOfType(id) as T[];
    }

    getInstanceImmediate<T extends WorkspaceLeaf>(id: CorePluginId): T | undefined {
        const found = this.workspace.getLeavesOfType(id) as T[];

        if (found && found.length === 1) {
            return found[0];
        } else {
            return undefined;
        }
    }

    getInstance<T extends WorkspaceLeaf>(id: CorePluginId): T | undefined {
        return this.watchers.get(id)?.getInstance() as T;
    }

    getInstances<T extends WorkspaceLeaf>(id: CorePluginId): Set<T> {
        return (this.watchers.get(id)?.getInstances() ?? new Set()) as Set<T>;
    }

    registerWatcher<T extends WorkspaceLeaf>(
        id: CorePluginId,
        initCb?: WatcherCallback<T>,
        cleanupCb?: WatcherCallback<T>,
        updateCb?: WatcherCallback<T>,
        allowMultiple?: boolean
    ) {
        const instances = this.getInstancesImmediate<T>(id);
        const leafWatcher = new LeafWatcher<T>(id, initCb, cleanupCb, updateCb, allowMultiple);
        if (instances && instances.length > 0 && initCb) {
            instances.forEach((instance) => leafWatcher.addInstance(instance));
        }
        this.watchers.set(id, leafWatcher);
    }

    unregisterWatcher(id: CorePluginId) {
        this.watchers.delete(id);
    }
}
