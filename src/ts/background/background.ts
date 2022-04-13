import { browser } from 'webextension-polyfill-ts';
import { defaultSettings, Settings } from './settings';

(async () => {
    // Init Settings
    const { settings } = await browser.storage.sync.get('settings');
    const newSettings: Settings = Object.assign(defaultSettings, settings || {});
    console.log('Updating Settings');
    console.log(await browser.storage.local.get('logs'));

    // Save Updated Settings
    browser.storage.sync.set({ settings: newSettings });
})();
