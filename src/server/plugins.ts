import { Router } from 'express';

export const pluginsRouter = Router();

pluginsRouter.post('/proxy', async (req, res) => {
  const { url, options } = req.body;
  try {
    const fetchRes = await fetch(url, options);
    const text = await fetchRes.text();
    res.json({ ok: fetchRes.ok, status: fetchRes.status, text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const btcJsCode = `return {
  manifest: {
    id: "com.portfolio.starter.btc",
    displayName: "Bitcoin (BTC)",
    version: "1.0.0",
    supportedAssetTypes: [
      { id: "btc_unit", displayName: "Bitcoin", baseType: "CRYPTO", baseTypeProperties: { symbol: "BTC" }, countLabel: "BTC", supportedCurrencies: ["USD", "EUR", "EGP", "GBP"], hasBuySellSpread: false }
    ],
    configSchema: []
  },
  async fetchPrice(assetTypeId, config, sdk) {
    try {
      const resp = await sdk.fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,egp,gbp");
      const data = await resp.json();
      const curr = (config.preferred_currency || 'USD').toLowerCase();
      let price = data.bitcoin[curr] || data.bitcoin['usd'];
      return { price, sellPrice: price, approximate: false };
    } catch(e) {
      return { price: 65000, sellPrice: 65000, approximate: true };
    }
  }
};`;

const goldJsCode = `return {
  manifest: {
    id: "com.portfolio.starter.gold_ingot",
    displayName: "Gold Ingots",
    version: "1.0.0",
    supportedAssetTypes: [
      { id: "gold_ingot_1g", displayName: "1g Gold Ingot", baseType: "GOLD", baseTypeProperties: { weightGrams: 1.0, karat: "K24" }, countLabel: "Ingots", supportedCurrencies: ["USD", "EUR", "EGP", "GBP"], hasBuySellSpread: true },
      { id: "gold_ingot_1oz", displayName: "1oz Gold Ingot", baseType: "GOLD", baseTypeProperties: { weightGrams: 31.1, karat: "K24" }, countLabel: "Bars", supportedCurrencies: ["USD", "EUR", "EGP", "GBP"], hasBuySellSpread: true }
    ],
    configSchema: []
  },
  async fetchPrice(assetTypeId, config, sdk) {
    const goldSpotOzUsd = 2500;
    const isEgp = config.preferred_currency === 'EGP';
    const rateUsd = isEgp ? 50 : 1;
    const spotOz = goldSpotOzUsd * rateUsd;
    
    let weight = assetTypeId === 'gold_ingot_1oz' ? 31.1 : 1.0;
    let price = (spotOz / 31.1) * weight;
    return { price, sellPrice: price * 0.97, approximate: true };
  }
};`;

const repoManifest = {
  repoName: "Starter Plugins Repo (JS Only)",
  repoVersion: 2,
  plugins: [
    {
      id: "com.portfolio.starter.btc",
      displayName: "Bitcoin (BTC)",
      description: "Tracks live BTC price. Pure JS.",
      version: "1.0.0",
      author: "Starter"
    },
    {
      id: "com.portfolio.starter.gold_ingot",
      displayName: "Gold Ingots (Bullion)",
      description: "Gold Ingot tracker. Pure JS.",
      version: "1.0.0",
      author: "Starter"
    }
  ]
};

pluginsRouter.get('/repo.json', (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${proto}://${host}/api/plugins`;
  
  res.json({
    ...repoManifest,
    plugins: repoManifest.plugins.map(p => ({
      ...p,
      manifestUrl: baseUrl + '/' + p.id.split('.').pop() + '/manifest'
    }))
  });
});

pluginsRouter.get('/btc/manifest', (req, res) => {
  res.json({ id: "com.portfolio.starter.btc", displayName: "Bitcoin (BTC)", version: "1.0.0", jsCode: btcJsCode });
});

pluginsRouter.get('/gold_ingot/manifest', (req, res) => {
  res.json({ id: "com.portfolio.starter.gold_ingot", displayName: "Gold Ingots", version: "1.0.0", jsCode: goldJsCode });
});
