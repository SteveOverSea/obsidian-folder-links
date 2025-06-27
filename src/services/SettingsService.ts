import FolderLinksPlugin from 'src/main';
import { PluginSettings } from 'src/settings/ISettings';

export class SettingsService {
    constructor(private plugin: FolderLinksPlugin, private settings: PluginSettings) {}

    getSetting(key: keyof PluginSettings) {
        return this.settings[key];
    }

    async setSetting<K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) {
        this.settings[key] = value;
        this.saveSettings();
    }

    async saveSettings() {
        this.plugin.saveSettings();
    }
}
