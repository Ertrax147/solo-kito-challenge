import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { getStore } from "@netlify/blobs";
//#region src/pages/api/accounts.js
var accounts_exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var DEFAULT_ACCOUNTS = [
	{
		id: "1",
		name: "Ergoz",
		tag: "#LAS",
		region: "LAS",
		role: "MID",
		rank: "DIAMOND IV",
		lp: 12,
		wins: 50,
		losses: 36,
		posDelta: "▲2",
		avgGain: 25,
		avgLoss: 18,
		sparkline: "10,25 25,15 40,25 55,10 70,12",
		isLive: false,
		profileIconUrl: "https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/6879.png",
		opggUrl: "https://www.op.gg/summoners/las/Ergoz-LAS"
	},
	{
		id: "2",
		name: "Ertrax",
		tag: "#LAS",
		region: "LAS",
		role: "MID",
		rank: "EMERALD III",
		lp: 21,
		wins: 21,
		losses: 11,
		posDelta: "▲1",
		avgGain: 30,
		avgLoss: 12,
		sparkline: "10,35 25,30 40,20 55,10 70,5",
		isLive: true,
		profileIconUrl: "https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/5414.png",
		opggUrl: "https://www.op.gg/summoners/las/Ertrax-LAS"
	},
	{
		id: "3",
		name: "CrixxD",
		tag: "#LAS",
		region: "LAS",
		role: "MID",
		rank: "PLATINUM I",
		lp: 61,
		wins: 26,
		losses: 18,
		posDelta: "-",
		avgGain: 28,
		avgLoss: 14,
		sparkline: "10,30 25,25 40,15 55,20 70,5",
		isLive: true,
		profileIconUrl: "https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/4655.png",
		opggUrl: "https://www.op.gg/summoners/las/CrixxD-LAS"
	},
	{
		id: "4",
		name: "LUCOOOOCK",
		tag: "#LAS",
		region: "LAS",
		role: "MID",
		rank: "UNRANKED",
		lp: 0,
		wins: 0,
		losses: 0,
		posDelta: "▲1",
		avgGain: 28,
		avgLoss: 14,
		sparkline: "10,30 25,20 40,15 55,10 70,5",
		isLive: true,
		profileIconUrl: "https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/29.png",
		opggUrl: "https://www.op.gg/summoners/las/LUCOOOOCK-LAS"
	},
	{
		id: "5",
		name: "depredador ápice",
		tag: "#6XX",
		region: "LAS",
		role: "MID",
		rank: "UNRANKED",
		lp: 0,
		wins: 0,
		losses: 0,
		posDelta: "▲1",
		avgGain: 28,
		avgLoss: 14,
		sparkline: "10,30 25,20 40,15 55,10 70,5",
		isLive: true,
		profileIconUrl: "https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/29.png",
		opggUrl: "https://www.op.gg/summoners/las/depredador%20%C3%A1pice-6XX"
	}
];
async function GET() {
	try {
		const stored = await getStore({
			name: "solo-kito-accounts",
			consistency: "strong"
		}).get("accounts_list", { type: "json" });
		const list = stored && Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_ACCOUNTS;
		return new Response(JSON.stringify(list), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	} catch (err) {
		return new Response(JSON.stringify(DEFAULT_ACCOUNTS), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	}
}
async function POST({ request }) {
	try {
		const newAcc = await request.json();
		const store = getStore({
			name: "solo-kito-accounts",
			consistency: "strong"
		});
		const stored = await store.get("accounts_list", { type: "json" }) || DEFAULT_ACCOUNTS;
		const list = Array.isArray(stored) ? stored : DEFAULT_ACCOUNTS;
		const existsIndex = list.findIndex((a) => a.name.toLowerCase() === newAcc.name.toLowerCase() && a.tag.toLowerCase() === newAcc.tag.toLowerCase());
		if (existsIndex >= 0) list[existsIndex] = {
			...list[existsIndex],
			...newAcc
		};
		else list.push(newAcc);
		await store.setJSON("accounts_list", list);
		return new Response(JSON.stringify({
			success: true,
			accounts: list
		}), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	} catch (err) {
		return new Response(JSON.stringify({
			success: false,
			error: err.message
		}), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*"
			}
		});
	}
}
async function DELETE({ request }) {
	try {
		const id = new URL(request.url).searchParams.get("id");
		const store = getStore({
			name: "solo-kito-accounts",
			consistency: "strong"
		});
		const filtered = (await store.get("accounts_list", { type: "json" }) || DEFAULT_ACCOUNTS).filter((a) => a.id !== id);
		await store.setJSON("accounts_list", filtered);
		return new Response(JSON.stringify({
			success: true,
			accounts: filtered
		}), { headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		} });
	} catch (err) {
		return new Response(JSON.stringify({
			success: false,
			error: err.message
		}), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*"
			}
		});
	}
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/accounts@_@js
var page = () => accounts_exports;
//#endregion
export { page };
