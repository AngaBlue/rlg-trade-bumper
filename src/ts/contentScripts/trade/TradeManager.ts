import { browser } from 'webextension-polyfill-ts';
import { defaultSettings } from '../../background/settings';
import { Trade, TradeState } from './Trade';

export default class TradeManager {
    trades: Trade[] = [];

    csfr?: string;

    timeout?: number;

    settings = defaultSettings;

    add = (trade: Trade) => {
        // Find existing trade else add
        const index = this.trades.findIndex(t => t.id === trade.id);
        if (index === -1) this.trades.push(trade);
    };

    remove = (id: Trade['id']) => {
        const index = this.trades.findIndex(t => t.id === id);
        this.trades = this.trades.splice(index, 1);
    };

    recalculateTradeBumpTimeout = () => {
        this.trades.forEach(trade => trade.calculateBumpTimeout());
    };

    clear = () => {
        this.trades = [];
    };

    bump = async () => {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }

        if (this.settings.enabled) {
            // Find Oldest, Ready Trade
            const trade = this.trades
                .filter(t => t.state === TradeState.READY && t.bumpTimestamp < Date.now())
                .sort((a, b) => a.lastUpdated - b.lastUpdated)[0];
            if (trade && this.csfr) {
                await trade.bump();
            }
        }
        // Recheck 3 - 5 seconds later
        this.timeout = setTimeout(this.bump, Math.floor(Math.random() * 2_000) + 3_000);
    };

    syncSettings = async () => {
        const { settings } = await browser.storage.sync.get('settings');
        if (settings) this.settings = settings;
        browser.storage.onChanged.addListener(changes => {
            // eslint-disable-next-line no-restricted-syntax
            for (const key of Object.keys(changes)) {
                switch (key) {
                    case 'settings':
                        this.settings = changes.settings.newValue;
                        this.recalculateTradeBumpTimeout();
                        break;
                }
            }
        });
    };
}
