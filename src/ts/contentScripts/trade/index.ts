import { CustomEventMap } from '../../../@types/dom';
import { Trade } from './Trade';
import TradeManager from './TradeManager';
import parseTimeString from './util';

const manager = new TradeManager();

const event = 'rlgTradeBumper';
const patterns = {
    time: /<span class="rlg-trade__time">\n<span>.+<\/span>\n<span>(.+)<\/span>\n<\/span>/,
    id: /<button class="rlg-trade__action rlg-trade__bump --bump " type="button" data-alias="(.+)" /
};

async function onReady({ detail: { trades, csrf } }: CustomEventMap['rlgTradeBumper']) {
    await manager.syncSettings();

    // Set CSFR
    manager.csfr = csrf;

    // eslint-disable-next-line no-restricted-syntax
    for (const trade of trades) {
        // Parse Trades
        const time = parseTimeString(trade.match(patterns.time)?.[1] ?? '') || Number.MAX_SAFE_INTEGER;
        const id = trade.match(patterns.id)?.[1];
        if (id) manager.add(new Trade(manager, { id, lastUpdated: time }));
    }

    if (trades.length === 0) {
        const tradeElements = document.getElementsByClassName('rlg-trade');

        // eslint-disable-next-line no-restricted-syntax
        for (const trade of tradeElements) {
            // Parse Trades
            const time =
                parseTimeString(trade.querySelector('.rlg-trade__time > span:nth-child(2)')?.textContent ?? '') || Number.MAX_SAFE_INTEGER;
            const id = trade.querySelector('.rlg-trade__bump')?.getAttribute('data-alias');
            if (id) manager.add(new Trade(manager, { id, lastUpdated: time }));
        }
    }

    // Start bumping trades
    manager.bump();
}

// eslint-disable-next-line consistent-return
const checkReady = setInterval(async () => {
    if (document.readyState === 'complete') {
        clearInterval(checkReady);

        // Check RLG Trades Page
        if (
            location.hostname === 'rocket-league.com' &&
            (location.pathname.startsWith('/trades/') || location.pathname.startsWith('/player/'))
        ) {
            // If error page, reload
            const errorElement = document.querySelector('.rlg-error');
            if (errorElement) return location.reload();

            // Get Username if Logged in
            const userElement = document.querySelector('div.rlg-header-main-user > div > a > span');
            const username = userElement ? userElement.textContent : null;

            if (username && [`/trades/${username}`, `/player/${username}`].includes(location.pathname)) {
                document.addEventListener(event, onReady);

                // Inject script to get trades & csrf
                const script = document.createElement('script');
                script.type = 'text/javascript';
                const content = `
					console.log('Dispatching ${event}...');
					document.dispatchEvent(new CustomEvent('${event}', {
						detail: {
							csrf: window.csrf_token,
							trades: window.tradePositionArray.map(t => t.element.innerHTML)
						}
					}));
				`;
                script.appendChild(document.createTextNode(content));

                console.log('Injecting script...');
                document.body.appendChild(script);

                // Reload every 5 minutes to update CSRF + update trade list
                setTimeout(() => {
                    location.reload();
                }, 5 * 60 * 1_000);
            }
        }
    }
});
