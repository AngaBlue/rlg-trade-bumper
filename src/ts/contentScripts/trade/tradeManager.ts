import { browser } from "webextension-polyfill-ts";
import { Trade, TradeState } from "./trade";

export class TradeManager {
	trades: Trade[] = [];
	csfr?: string;
	timeout: number | undefined;
	settings = { enabled: false };
	constructor() {
		this.bump();
		this.syncSettings();
	}
	add = (trade: Trade) => {
		// Find existing trade else add
		const index = this.trades.findIndex(t => t.id === trade.id);
		if (index === -1) this.trades.push(trade);
	}
	remove = (id: Trade["id"]) => {
		const index = this.trades.findIndex(t => t.id === id);
		this.trades = this.trades.splice(index, 1);
	}
	clear = () => {
		this.trades = [];
	}
	bump = async () => {
		if (this.timeout) clearTimeout(this.timeout);
		if (this.settings.enabled) {
			// Find Oldest, Ready Trade
			const trade = this.trades
				.filter(t => t.state === TradeState.READY && t.lastUpdated < Date.now() - (15 * 60 * 1000))
				.sort((a, b) => a.lastUpdated - b.lastUpdated)[0];
			if (trade && this.csfr) {
				await trade.bump();
			}
		}
		// Recheck 5 - 10 seconds later
		this.timeout = setTimeout(this.bump, Math.floor(Math.random() * 5000) + 5000);
	}
	syncSettings = async () => {
		const settings = (await browser.storage.sync.get("settings")).settings;
		if (settings) this.settings = settings;
		browser.storage.onChanged.addListener((
			changes,
			_areaName
		) => {
			for (const key of Object.keys(changes)) {
				switch (key) {
					case "settings":
						this.settings = changes.settings.newValue;
						break;
				}
			}
		});
	}
}