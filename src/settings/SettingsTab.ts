import { App, PluginSettingTab, Setting } from 'obsidian';
import FolderLinksPlugin from 'src/main';
import { PluginSettings } from './ISettings';

export class SettingsTab extends PluginSettingTab {
    constructor(
        public app: App,
        private plugin: FolderLinksPlugin,
        private settings: PluginSettings
    ) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Show Folder Links in Outgoing Links Tab')
            .addToggle((component) =>
                component.setValue(this.settings.showInBackLinks).onChange(async (value) => {
                    this.settings.showInBackLinks = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Automatically update folder links')
            .setDesc('Turn off to be prompted to update links after renaming a folder.')
            .addToggle((component) =>
                component.setValue(this.settings.alwaysUpdate).onChange(async (value) => {
                    this.settings.alwaysUpdate = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}
