import {App, PluginSettingTab, Setting} from "obsidian";
import FolderLinksPlugin from "../main";

export class SettingsTab extends PluginSettingTab {
	plugin: FolderLinksPlugin;

	constructor(app: App, plugin: FolderLinksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Show Folder Links in Outgoing Links Tab')
			.addToggle((component) => component
				.setValue(this.plugin.settings.showInBackLinks)
				.onChange(async (value) => {
					this.plugin.settings.showInBackLinks = value;
					await this.plugin.saveSettings();
				}));
	}
}
