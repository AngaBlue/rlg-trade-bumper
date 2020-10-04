import { Trade, TradeManager } from "./trade";
import { parseTimeString } from "./util";


let checkReady = setInterval(async () => {
	if (document.readyState === "complete") {
		clearInterval(checkReady)
		//Check RLG Trades Page
		if (location.hostname === "rocket-league.com" && location.pathname.startsWith("/trades/")) {
			//Get Username if Logged in
			let userElement = document.querySelector("div.rlg-header-main-user > div > a > span")
			let username = userElement ? userElement.textContent : null;
			if (username && location.pathname === `/trades/${username}`) {
				//Check if Existing Tab Open
				let manager = new TradeManager();
				//Set CSFR
				let CSFRElement = document.getElementById("window-csrf");
				manager.csfr = CSFRElement ? CSFRElement.innerText.split('"')[1] : ""
				let trades = document.getElementsByClassName("rlg-trade")
				for (let trade of trades) {
					//Parse Trades
					let time = parseTimeString(trade.querySelector(".rlg-trade__time > span:nth-child(2)")?.textContent || "") || 0;
					let id = trade.querySelector(".rlg-trade__bump")?.getAttribute("data-alias")
					if (id) manager.add(new Trade(manager, { id, lastUpdated: time }));
				};
				//Reload every 5 minutes to updates CSRF + update trade list
				setTimeout(() => {
					location.reload();
				}, 5 * 60 * 1000)
			}
		}
	}
})