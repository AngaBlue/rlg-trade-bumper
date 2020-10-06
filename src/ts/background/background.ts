import { browser } from 'webextension-polyfill-ts';
import { defualtSettings, Settings } from './settings';

(async () => {
	//Init Settings
	let settings: Partial<Settings> | undefined = (await browser.storage.sync.get("settings")).settings
	let newSettings: Settings = Object.assign(defualtSettings, settings || {})
	console.log("Updating Settings")
	//Save Updated Settings
	browser.storage.sync.set({ settings: newSettings })
})()
