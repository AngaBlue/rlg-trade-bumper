import { browser } from 'webextension-polyfill-ts';
import { parseTimeString } from "./util";

export enum TradeState {
	BUMPING = "bumping",
	READY = "ready",
	UNAVAILABLE = "unavailable"
}

export class Trade {
	id: string;
	state: TradeState = TradeState.READY;
	lastUpdated: number;
	tradeManager: TradeManager;
	constructor(tradeManager: TradeManager, details: { id: string, lastUpdated?: number }) {
		this.tradeManager = tradeManager;
		this.id = details.id;
		this.lastUpdated = details.lastUpdated || Date.now();
	}
	bump = async () => {
		console.log(`Bumping Trade: ${this.id}`)
		this.state = TradeState.BUMPING;
		let response: Response | null = null;
		try {
			response = await fetch(`${location.origin}/ajaxfunctions/bumpTrade.php?alias=${this.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: `csrf_token=${this.tradeManager.csfr}`
			})
		} catch (error) {
			console.error(error)
		}
		if (response) {
			let body = await response.text()
			this.state = TradeState.READY
			if (body === "success") {
				this.lastUpdated = Date.now()
				//Update Activity
				let activity: Activity[] = (await browser.storage.sync.get("activity")).activity || []
				activity.unshift({ id: this.id, timestamp: Date.now() - 1000 })
				if (activity.length > 100) activity = activity.slice(0, 100)
				browser.storage.sync.set({ activity })
				console.log(`Bumped Trade: ${this.id}`)
			} else {
				if (body.startsWith("This trade is on a 15 minute bump cooldown.")) {
					//Bumped too early, update lastUpdated
					this.lastUpdated = parseTimeString(body.replace("This trade is on a 15 minute bump cooldown. Your last bump was ", "").replace(".", "")) + 30 * 1000
				} else {
					location.reload();
				}
			}
		}
	}
}

export class TradeManager {
	trades: Trade[] = [];
	csfr?: string;
	timeout: number | undefined;
	settings = { enabled: false }
	constructor() {
		this.bump();
		this.syncSettings();
	}
	add = (trade: Trade) => {
		//Find existing trade else add
		let index = this.trades.findIndex(t => t.id === trade.id)
		if (index === -1) this.trades.push(trade)
	}
	remove = (id: Trade["id"]) => {
		let index = this.trades.findIndex(t => t.id === id)
		this.trades = this.trades.splice(index, 1)
	}
	clear = () => {
		this.trades = []
	}
	bump = async () => {
		if (this.timeout) clearTimeout(this.timeout)
		if (this.settings.enabled) {
			//Find Oldest, Ready Trade
			let trade = this.trades.filter(t => t.state === TradeState.READY && t.lastUpdated < Date.now() - (15 * 60 * 1000)).sort((a, b) => a.lastUpdated - b.lastUpdated)[0]
			if (trade && this.csfr) {
				await trade.bump()
			}
		}
		//Recheck 5 - 10 seconds later
		this.timeout = setTimeout(this.bump, Math.floor(Math.random() * 5000) + 5000)
	}
	syncSettings = async () => {
		let settings = (await browser.storage.sync.get("settings")).settings;
		if (settings) this.settings = settings;
		browser.storage.onChanged.addListener((
			changes,
			_areaName
		) => {
			for (let key in changes) {
				switch (key) {
					case "settings":
						this.settings = changes.settings.newValue;
						break;
				}
			}
		})
	}
}

export interface Activity {
	id: string,
	timestamp: number
}