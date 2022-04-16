import { browser } from 'webextension-polyfill-ts';
import { defaultSettings, Settings } from './settings';

browser.runtime.onInstalled.addListener(async () => {
    console.log('Updating settings...');

    // Init Settings
    const { settings } = await browser.storage.sync.get('settings');
    const newSettings: Settings = Object.assign(defaultSettings, settings || {});

    // Save Updated Settings
    browser.storage.sync.set({ settings: newSettings });
    console.log('Updated settings');
});
