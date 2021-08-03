import { browser } from "webextension-polyfill-ts";
import { TradeManager } from "./tradeManager";
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
		console.log(`Bumping Trade: ${this.id}`);
		this.state = TradeState.BUMPING;
		let response: Response | null = null;
		try {
			response = await fetch(`${location.origin}/ajaxfunctions/bumpTrade.php?alias=${this.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: `csrf_token=${this.tradeManager.csfr}`
			});
		} catch (error) {
			console.error(error);
		}
		if (response) {
			const body = await response.text();
			this.state = TradeState.READY;
			if (body === "success") {
				this.lastUpdated = Date.now();
				// Update Activity
				let activity: Activity[] = (await browser.storage.sync.get("activity")).activity || [];
				activity.unshift({ id: this.id, timestamp: Date.now() - 1000 });
				if (activity.length > 100) activity = activity.slice(0, 100);
				browser.storage.sync.set({ activity });
				console.log(`Bumped Trade: ${this.id}`);
			} else {
				if (body.startsWith("This trade is on a 15 minute bump cooldown.")) {
					// Bumped too early, update lastUpdated
					this.lastUpdated = parseTimeString(body.replace("This trade is on a 15 minute bump cooldown. Your last bump was ", "").replace(".", "")) + 30 * 1000;
				} else {
					location.reload();
				}
			}
		}
	}
}
export interface Activity {
	id: string;
	timestamp: number;
}