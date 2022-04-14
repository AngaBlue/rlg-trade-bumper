import { browser } from 'webextension-polyfill-ts';
import TradeManager from './TradeManager';
import parseTimeString from './util';

export enum TradeState {
    BUMPING = 'bumping',
    READY = 'ready',
    UNAVAILABLE = 'unavailable'
}

export class Trade {
    id: string;

    state: TradeState = TradeState.READY;

    private _lastUpdated = 0;

    get lastUpdated() {
        return this._lastUpdated;
    }

    set lastUpdated(lastUpdated: number) {
        this._lastUpdated = lastUpdated;
        this.tradeManager.recalculateTradeBumpTimeout();
    }

    bumpTimestamp = 0;

    tradeManager: TradeManager;

    constructor(tradeManager: TradeManager, details: { id: string; lastUpdated?: number }) {
        this.tradeManager = tradeManager;
        this.id = details.id;
        this.lastUpdated = details.lastUpdated || Date.now();
    }

    calculateBumpTimeout() {
        const { min, max } = this.tradeManager.settings;
        const timeout = Math.floor((Math.random() * (max - min) + min) * 60 * 1000);
        this.bumpTimestamp = this.lastUpdated + timeout;
    }

    bump = async () => {
        console.log(`Bumping Trade: ${this.id}`);

        this.state = TradeState.BUMPING;
        let response: Response | null = null;
        try {
            response = await fetch(`${location.origin}/ajaxfunctions/bumpTrade.php?alias=${this.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `csrf_token=${this.tradeManager.csfr}`
            });
        } catch (error) {
            console.error(error);
        }

        if (response) {
            const body = await response.text();
            this.state = TradeState.READY;

            if (body === 'success') {
                this.lastUpdated = Date.now();

                // Update Activity
                let activity: Activity[] = (await browser.storage.sync.get('activity')).activity || [];
                activity.unshift({ id: this.id, timestamp: Date.now() - 1000 });
                if (activity.length > 100) activity = activity.slice(0, 100);
                browser.storage.sync.set({ activity });

                console.log(`Bumped Trade: ${this.id}`);
            } else if (
                body.startsWith('This trade is on a 15 minute bump cooldown.') ||
                body.startsWith('Your ability to bump trades has been temporarily disabled.') ||
                body.startsWith("You're making an excessive amount of failed bump attempts, slow down!")
            ) {
                // Bumped too early, update lastUpdated
                this.lastUpdated =
                    parseTimeString(body.replace('This trade is on a 15 minute bump cooldown. Your last bump was ', '').replace('.', '')) +
                    60 * 1000;
                this.calculateBumpTimeout();
            } else {
                let { logs } = await browser.storage.local.get('logs');
                logs += `\n${JSON.stringify(response)}\n${JSON.stringify(body)}`;
                browser.storage.local.set({ logs });

                console.log(response, body);
                location.reload();
            }
        }
    };
}
export interface Activity {
    id: string;
    timestamp: number;
}
