import { App, Plugin, TAbstractFile } from 'obsidian';

export enum EventType {
    Create = 'create',
    Rename = 'rename',
    Delete = 'delete'
}

export default class EventService {
    constructor(private plugin: Plugin) {}

    onVaultEvent(type: EventType, callback: (file: TAbstractFile) => any) {
        this.plugin.registerEvent(this.plugin.app.vault.on(type as any, callback));
    }

    static waitForLayoutReady(app: App): Promise<void> {
        const workspace = app.workspace;
        if (workspace.layoutReady) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            workspace.onLayoutReady(() => resolve());
        });
    }

    // bootstrap inspired event handler (source: https://github.com/twbs/bootstrap/blob/main/js/src/dom/event-handler.js)
    onDOMEvent(
        container: Window,
        type: keyof WindowEventMap,
        selector: string,
        handler: (element: HTMLElement, event: Event) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.plugin.registerDomEvent(
            container,
            type,
            (ev) => {
                const target = (ev.target as HTMLElement).closest(selector);
                if (target) {
                    handler(target as HTMLElement, ev);
                }
            },
            options
        );
    }
}
