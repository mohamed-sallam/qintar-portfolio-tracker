import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Code } from 'lucide-react';
import { db } from '@/src/lib/db';
import { InstalledPlugin } from '@/src/lib/types';
import { useTheme, useHeadingClasses } from '@/src/lib/ThemeContext';
import { universalFetch } from '@/src/lib/utils';

const defaultCode = `
/**
 * BTC (Bullion Trading Center) — Live Price Plugin
 * Source: https://magento-1205032-5154147.cloudwaysapps.com/graphql
 *
 * This version uses the internal GraphQL API to fetch exact prices for a single SKU.
 */

const assetToSku = {
  // ── 24K Ingots ────────────────────────────────────────────────────────
  "btc-ingot-1g": "EGX24IXBTCXXXX1",           // 1g BTC
  "btc-ingot-2-5g": "EGX24IXBTCXX2X5",         // 2.5g BTC
  "btc-ingot-5g": "EGX24IXBTCXXXX5",           // 5g BTC
  "btc-ingot-10g": "EGX24IXBTCXXX10",          // 10g BTC
  "btc-ingot-20g": "EGX24IXXBTCXX20",          // 20g BTC
  "btc-ingot-31-1g": "EGX24IXBTCX31X1",        // 31.1g BTC
  "btc-ingot-50g": "EGX24IXBTCXXX50",          // 50g BTC
  "btc-ingot-100g": "EGX24IXBTCXX100",         // 100g BTC

  // ── 21K Coins ─────────────────────────────────────────────────────────
  "btc-coin-gold-quarter-a-pound": "EGPXALLAXXX2",   // 2g coin - Names of Allah
  "btc-coin-gold-half-a-pound": "EGPXALLAXXX4",      // 4g coin - Names of Allah
  "btc-coin-gold-pound": "EGX21PXBTCXXXX8",          // 8g coin - BTC
};

const manifest = {
  id: "btc-gold-live",
  displayName: "BTC Gold (Live)",
  version: "3.0.0",
  configSchema: [],

  supportedAssetTypes: [
    { id: "btc-ingot-1g", displayName: "BTC 1g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 1 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-2-5g", displayName: "BTC 2.5g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 2.5 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-5g", displayName: "BTC 5g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 5 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-10g", displayName: "BTC 10g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 10 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-20g", displayName: "BTC 20g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 20 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-31-1g", displayName: "BTC Gold Ounce / Biscuit (31.1g, 24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 31.1 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-50g", displayName: "BTC 50g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 50 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-ingot-100g", displayName: "BTC 100g Gold Ingot (24K)", baseType: "GOLD", baseTypeProperties: { karat: "K24", weightGrams: 100 }, countLabel: "Pieces", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-coin-gold-quarter-a-pound", displayName: "BTC 2g Gold Coin – Names of Allah (21K)", baseType: "GOLD", baseTypeProperties: { karat: "K21", weightGrams: 2 }, countLabel: "Coins", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-coin-gold-half-a-pound", displayName: "BTC 4g Gold Coin – Names of Allah (21K)", baseType: "GOLD", baseTypeProperties: { karat: "K21", weightGrams: 4 }, countLabel: "Coins", supportedCurrencies: ["EGP"], hasBuySellSpread: true },
    { id: "btc-coin-gold-pound", displayName: "BTC Gold Pound / Juneih (21K)", baseType: "GOLD", baseTypeProperties: { karat: "K21", weightGrams: 8 }, countLabel: "Coins", supportedCurrencies: ["EGP"], hasBuySellSpread: true }
  ],
};

async function fetchPrice(assetTypeId, config, sdk) {
  const targetSku = assetToSku[assetTypeId];
  if (!targetSku) return { error: "Unknown asset type ID: " + assetTypeId };

  // GraphQL query that fetches only the specific SKU
  const query = \`
    query GetProductPrice($sku: String!) {
      products(filter: { sku: { eq: $sku } }) {
        items {
          sku
          price_range {
            minimum_price {
              regular_price {
                value
              }
            }
          }
        }
      }
    }
  \`;

  let jsonResult;
  try {
    const res = await sdk.fetch("https://magento-1205032-5154147.cloudwaysapps.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { sku: targetSku } })
    });
    jsonResult = await res.json();
  } catch (e) {
    return { error: "Network error fetching GraphQL API: " + String(e) };
  }

  const items = jsonResult?.data?.products?.items;
  if (!items || items.length === 0) {
    return { error: \`SKU \${targetSku} not found in GraphQL response\` };
  }

  const item = items[0];
  const value = item?.price_range?.minimum_price?.regular_price?.value;
  if (value === undefined) {
    return { error: \`Price data missing for SKU: \${targetSku}\` };
  }

  return { price: value, sellPrice: value * 0.985, approximate: false };
}

return { manifest, fetchPrice };`;

export function CreateJsPluginScreen() {
    const navigate = useNavigate();
    const [code, setCode] = useState(defaultCode);
    const [error, setError] = useState('');
    const { meta } = useTheme();
    const headingCls = useHeadingClasses();

    const handleSave = async () => {
        try {
            setError('');
            const sdk = { fetch: universalFetch };
            const pluginDef = new Function('sdk', 'fetch', code)(sdk, universalFetch);

            if (!pluginDef.manifest || !pluginDef.manifest.id || !pluginDef.fetchPrice) {
                throw new Error("Plugin must export 'manifest' and 'fetchPrice' function.");
            }

            const plugin: InstalledPlugin = {
                id: pluginDef.manifest.id,
                displayName: pluginDef.manifest.displayName || "Custom JS Plugin",
                version: pluginDef.manifest.version || "1.0.0",
                manifest: pluginDef.manifest,
                userConfig: {},
                enabled: true,
                installedAt: Date.now(),
                lastManifestFetch: Date.now(),
                isLocalJs: true,
                jsCode: code
            };

            await db.installedPlugins.put(plugin);
            navigate('/settings');
        } catch (e: any) {
            setError(e.message || String(e));
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto flex flex-col h-[calc(100vh-80px)]">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/settings')} className="p-3 th-border border-border-muted hover:bg-surface-elevated transition-colors group th-btn">
                    <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-opacity" />
                </button>
                <div>
                   <span className="text-[10px] uppercase tracking-[0.4em] text-text-muted block mb-1">
                     {meta.titleFont === 'mono' ? '> DEV' : 'Developer'}
                   </span>
                   <h1 className={`text-3xl ${headingCls}`}>
                     {meta.titleFont === 'mono' ? 'PLUGIN_EDITOR' : 'JS Plugin'}
                   </h1>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <p className="text-[10px] uppercase tracking-widest opacity-60 leading-relaxed">
                    Write javascript code that returns an object containing your plugin manifest and fetchPrice implementation.
                    Use <span className="font-mono bg-surface-elevated px-1 py-0.5 th-pill">sdk.fetch(url)</span> to fetch live data natively.
                </p>
                {error && <div className="p-4 bg-red-900/20 text-red-400 border border-red-500/20 text-[10px] uppercase tracking-widest th-card">{error}</div>}
                
                <div className="flex-1 th-border border-border-muted bg-surface-base relative p-1 th-card">
                    <textarea 
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full h-full bg-transparent text-text-primary font-mono text-sm p-4 outline-none resize-none leading-relaxed"
                        spellCheck={false}
                    />
                </div>

                <button onClick={handleSave} className="bg-btn-bg text-btn-text text-[10px] uppercase tracking-[0.2em] font-bold py-4 flex items-center justify-center gap-3 hover:bg-accent transition-colors outline-none w-full th-btn">
                    <Save className="w-4 h-4 opacity-70" />
                    {meta.titleFont === 'mono' ? 'SAVE' : 'Save Local Plugin'}
                </button>
            </div>
        </div>
    );
}
