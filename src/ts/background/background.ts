import { browser } from 'webextension-polyfill-ts';
import { defualtSettings, Settings } from './settings';

(async () => {
    // Init Settings
    const { settings } = await browser.storage.sync.get('settings');
    const newSettings: Settings = Object.assign(defualtSettings, settings || {});
    console.log('Updating Settings');
    console.log(await browser.storage.local.get('logs'));

    // Save Updated Settings
    browser.storage.sync.set({ settings: newSettings });
})();
