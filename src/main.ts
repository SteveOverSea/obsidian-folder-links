import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CorePluginId } from './constants';
import { folderField } from './editor-extension/FolderStateField';
import { folderUpdater } from './editor-extension/FolderUpdater';
import { folderMarkPlugin } from './editor-extension/MarkFolderLink';
import { showErrorNotice, UserHandableError } from './error';
import { folderLinkPostProcessor } from './post-processor/FolderLinkPostProcessor';
import CorePluginService from './services/CorePluginService';
import EventService from './services/EventService';
import FolderService from './services/FolderService';
import { GraphViewManager } from './services/GraphViewManager';
import { OutgoingLinkmanager } from './services/OutgoingLinkManager';
import { DEFAULT_SETTINGS } from './settings/default';
import { PluginSettings } from './settings/ISettings';
import { SettingsTab } from './settings/SettingsTab';
import { IFileExplorerPlugin, IGraphView, IOutgoingLink } from './types';
import { FolderLinkManager } from './services/FolderLinkManager';
import { ModalService } from './services/ModalService';
import { TranslationService } from './services/TranslationService';
import { SettingsService } from './services/SettingsService';
import { WorkspaceService } from './services/WorkspaceService';

export default class FolderLinksPlugin extends Plugin {
    private settings: PluginSettings;
    private settingsService: SettingsService;
    private workspaceService: WorkspaceService;
    private translationService: TranslationService;
    private eventService: EventService;
    private modalService: ModalService;
    private corePluginService: CorePluginService;
    private folderService: FolderService;
    private folderLinkManager: FolderLinkManager;
    private graphViewManager: GraphViewManager;
    private outgoingLinkManager: OutgoingLinkmanager | undefined;
    private obsidianFileExplorer: IFileExplorerPlugin;
    private obsidianOutgoingLink: IOutgoingLink | undefined;

    onload() {
        try {
            this.setup();
        } catch (error) {
            if (error instanceof UserHandableError) {
                showErrorNotice(error.message);
            } else {
                showErrorNotice('An internal error occured.');
            }
        }
    }

    async setup() {
        await this.setupSettings();
        this.initServices();

        await this.eventService.waitForLayoutReady();
        this.setupFileExplorer();
        this.initServices();
        this.initDependentServices();
        this.setupCorePluginWatchers();

        this.registerMarkdownPostProcessor(folderLinkPostProcessor(this.folderService.observable));

        this.registerEditorExtension([
            folderUpdater(this.folderService.observable),
            folderField,
            folderMarkPlugin
        ]);

        this.folderService.observable.subscribe(() => {
            if (this.graphViewManager) {
                this.graphViewManager.update();
            }
        });
    }

    private async setupSettings() {
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this, this.settings));
    }

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private initServices() {
        this.settingsService = new SettingsService(this, this.settings);
        this.workspaceService = new WorkspaceService(this.app.workspace, this.app.metadataCache);
        this.translationService = new TranslationService(window.i18next);
        this.eventService = new EventService(this);
        this.modalService = new ModalService(this.app);
        this.corePluginService = new CorePluginService(this.app.workspace);
        this.folderService = new FolderService(
            this.app.vault,
            this.app.metadataCache,
            this.eventService
        );
    }

    private setupFileExplorer() {
        const instances = this.corePluginService.getInstancesImmediate<IFileExplorerPlugin>(
            CorePluginId.FileExplorer
        );
        if (instances.length === 0) {
            throw new UserHandableError(
                'No file explorer plugin found. Is the core plugin enabled?'
            );
        } else if (instances.length > 1) {
            throw new Error('More than one file explorer plugin found. Undefined state.');
        }
        this.obsidianFileExplorer = instances[0];
    }

    private initDependentServices() {
        this.folderLinkManager = new FolderLinkManager(
            this.app.vault,
            this.settingsService,
            this.translationService,
            this.eventService,
            this.modalService,
            this.folderService,
            this.obsidianFileExplorer
        );
        this.graphViewManager = new GraphViewManager(this.folderService, this.obsidianFileExplorer);
    }

    private setupCorePluginWatchers() {
        this.corePluginService.registerWatcher<IOutgoingLink>(
            CorePluginId.OutgoingLink,
            (leaf) => {
                this.obsidianOutgoingLink = leaf;
                this.outgoingLinkManager = new OutgoingLinkmanager(
                    this.translationService,
                    this.folderService,
                    this.obsidianOutgoingLink,
                    this.settings
                );
            },
            () => {
                this.obsidianOutgoingLink = undefined;
                this.outgoingLinkManager?.disconnect();
                this.outgoingLinkManager = undefined;
            }
        );
        this.corePluginService.registerWatcher<IGraphView>(
            CorePluginId.GraphView,
            (leaf) => {
                this.graphViewManager.addInstance(leaf);
            },
            (leaf) => {
                this.graphViewManager.removeInstance(leaf);
            },
            (leaf) => {
                this.graphViewManager.updateInstance(leaf);
            },
            true
        );
    }
}
