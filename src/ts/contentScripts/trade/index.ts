import { Trade } from './trade';
import TradeManager from './tradeManager';
import parseTimeString from './util';

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

            const premium = !!document.querySelector('[href="/functions/bumpAllTrades.php"]');

            if (username && [`/trades/${username}`, `/player/${username}`].includes(location.pathname)) {
                // Check if Existing Tab Open
                const manager = new TradeManager(premium);

                // Set CSFR
                const CSFRElement = document.getElementById('window-csrf');
                manager.csfr = CSFRElement ? CSFRElement.innerText.split('"')[1] : '';
                const trades = document.getElementsByClassName('rlg-trade');

                // eslint-disable-next-line no-restricted-syntax
                for (const trade of trades) {
                    // Parse Trades
                    const time = parseTimeString(trade.querySelector('.rlg-trade__time > span:nth-child(2)')?.textContent || '') || 0;
                    const id = trade.querySelector('.rlg-trade__bump')?.getAttribute('data-alias');
                    if (id) manager.add(new Trade(manager, { id, lastUpdated: time }));
                }

                // Reload every 5 minutes to update CSRF + update trade list
                setTimeout(() => {
                    location.reload();
                }, 5 * 60 * 1000);
            }
        }
    }
});
