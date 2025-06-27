import { App, Modal } from "obsidian";

export class ModalService {
    constructor(private app: App) { }

    createModal(title: string, content: string | DocumentFragment): Modal {
        const modal = new Modal(this.app);
        modal.setTitle(title).setContent(content);

        return modal;
    }
}