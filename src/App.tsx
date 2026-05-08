/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/src/components/Layout';
import { PortfolioScreen } from '@/src/screens/PortfolioScreen';
import { DashboardScreen } from '@/src/screens/DashboardScreen';
import { SettingsScreen } from '@/src/screens/SettingsScreen';
import { PluginStoreScreen } from '@/src/screens/PluginStoreScreen';
import { CreateJsPluginScreen } from '@/src/screens/CreateJsPluginScreen';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { useEffect, useState } from 'react';
import { OnboardingScreen } from '@/src/screens/OnboardingScreen';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [errorObj, setErrorObj] = useState<any>(null);
  const [timeoutErred, setTimeoutErred] = useState(false);
  
  useEffect(() => {
    // Set status bar color on Android
    if (Capacitor.isNativePlatform()) {
      try {
        import('@capacitor/app').then(({ App }) => {
          // Prevent app from closing on back button at root level
          // (handled in Layout.tsx)
        });
      } catch (e) {
        // Status bar plugin not available
      }
    }

    // Migration: Update old apiBaseUrl plugins to JS plugins
    const migrateLegacyPlugins = async () => {
      try {
        const installed = await db.installedPlugins.toArray();
        for (const p of installed) {
          // Update BTC plugin to GraphQL if it's string-based
          if (p.id === 'btc-gold-live' && p.jsCode && typeof p.jsCode === 'string' && p.jsCode.includes('TICKER_RE')) {
            await db.installedPlugins.update(p.id, {
              jsCode: `const assetToSku = {
  'btc-ingot-1g': 'EGX24IXBTCXXXX1',
  'btc-ingot-2-5g': 'EGX24IXBTCXX2X5',
  'btc-ingot-5g': 'EGX24IXBTCXXXX5',
  'btc-ingot-10g': 'EGX24IXBTCXXX10',
  'btc-ingot-20g': 'EGX24IXXBTCXX20',
  'btc-ingot-31-1g': 'EGX24IXBTCX31X1',
  'btc-ingot-50g': 'EGX24IXBTCXXX50',
  'btc-ingot-100g': 'EGX24IXBTCXX100',
  'btc-coin-gold-quarter-a-pound': 'EGPXALLAXXX2',
  'btc-coin-gold-half-a-pound': 'EGPXALLAXXX4',
  'btc-coin-gold-pound': 'EGX21PXBTCXXXX8'
};

const manifest = {
  id: 'btc-gold-live',
  displayName: 'BTC Gold (Live)',
  version: '3.0.0',
  configSchema: [],
  supportedAssetTypes: [
    { id: 'btc-ingot-1g', displayName: 'BTC 1g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 1 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-2-5g', displayName: 'BTC 2.5g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 2.5 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-5g', displayName: 'BTC 5g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 5 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-10g', displayName: 'BTC 10g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 10 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-20g', displayName: 'BTC 20g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 20 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-31-1g', displayName: 'BTC Gold Ounce / Biscuit (31.1g, 24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 31.1 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-50g', displayName: 'BTC 50g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 50 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-ingot-100g', displayName: 'BTC 100g Gold Ingot (24K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K24', weightGrams: 100 }, countLabel: 'Pieces', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-coin-gold-quarter-a-pound', displayName: 'BTC 2g Gold Coin (21K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K21', weightGrams: 2 }, countLabel: 'Coins', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-coin-gold-half-a-pound', displayName: 'BTC 4g Gold Coin (21K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K21', weightGrams: 4 }, countLabel: 'Coins', supportedCurrencies: ['EGP'], hasBuySellSpread: true },
    { id: 'btc-coin-gold-pound', displayName: 'BTC Gold Pound / Juneih (21K)', baseType: 'GOLD', baseTypeProperties: { karat: 'K21', weightGrams: 8 }, countLabel: 'Coins', supportedCurrencies: ['EGP'], hasBuySellSpread: true }
  ]
};

async function fetchPrice(assetTypeId, config, sdk) {
  const targetSku = assetToSku[assetTypeId];
  if (!targetSku) return { error: 'Unknown asset type ID: ' + assetTypeId };

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
    const res = await sdk.fetch('https://magento-1205032-5154147.cloudwaysapps.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { sku: targetSku } })
    });
    jsonResult = await res.json();
  } catch (e) {
    return { error: 'Network error: ' + String(e) };
  }

  const items = jsonResult?.data?.products?.items;
  if (!items || items.length === 0) {
    return { error: 'SKU ' + targetSku + ' not found' };
  }

  const value = items[0]?.price_range?.minimum_price?.regular_price?.value;
  if (value === undefined) {
    return { error: 'Price missing for SKU: ' + targetSku };
  }

  return { price: value, sellPrice: value * 0.985, approximate: false };
}

return { manifest, fetchPrice };`
            });
            console.log("Successfully migrated btc-gold-live to GraphQL");
          }

          if (!p.isLocalJs || !p.jsCode || p.apiBaseUrl) {
            console.log("Migrating legacy plugin to JS:", p.id);
            try {
              const shortId = p.id.split('.').pop();
              const proto = window.location.protocol;
              const host = window.location.host;
              const res = await fetch(`${proto}//${host}/api/plugins/${shortId}/manifest`);
              if (res.ok) {
                const data = await res.json();
                if (data.jsCode) {
                  await db.installedPlugins.update(p.id, {
                    isLocalJs: true,
                    jsCode: data.jsCode,
                    apiBaseUrl: undefined
                  });
                  console.log("Successfully migrated plugin to JS:", p.id);
                }
              }
            } catch (e) {
              console.error("Migration failed for plugin:", p.id, e);
            }
          }
        }
      } catch (e) {
        console.error("Migration check failed", e);
      }
    };
    migrateLegacyPlugins();

    const handleErr = (e: any) => {
      console.error('Captured error:', e);
      let errMsg: string = e.message || String(e);
      if (e.reason) {
         errMsg = e.reason.message || String(e.reason);
      } else if (e.error) {
         errMsg = e.error.message || String(e.error);
      }
      
      // Ignore benign WebSocket/HMR errors
      if (errMsg.includes('WebSocket') || errMsg.includes('websocket') || errMsg.includes('HMR')) {
        return;
      }
      
      setErrorObj(errMsg);
    };
    window.addEventListener('unhandledrejection', handleErr);
    window.addEventListener('error', handleErr);

    const t = setTimeout(() => {
       setTimeoutErred(true);
    }, 2000);

    return () => {
      window.removeEventListener('unhandledrejection', handleErr);
      window.removeEventListener('error', handleErr);
      clearTimeout(t);
    };
  }, []);

  const settings = useLiveQuery(() => db.appSettings.toArray());

  if (errorObj) {
     return <div className="p-8 text-red-500 bg-surface-base h-screen w-screen flex flex-col items-center justify-center text-center font-sans">
       <span className="text-red-500 text-2xl mb-4">⚠</span>
       <h1 className="text-xl mb-4 uppercase tracking-widest text-[10px]">Error Detected</h1>
       <p className="opacity-80 max-w-sm mb-6 text-sm">{String(errorObj?.message || errorObj)}</p>
       <button onClick={() => { localStorage.clear(); indexedDB.deleteDatabase('PortfolioDB'); window.location.reload(); }} className="bg-red-900/20 text-red-400 border border-red-500/20 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-red-900/40 transition-colors mb-6 outline-none rounded-lg">
          Reset All App Data
       </button>
     </div>;
  }

  if (settings === undefined) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-base text-text-primary text-[10px] uppercase tracking-[0.4em] font-sans text-text-muted">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading...</p>
        {timeoutErred && <p className="text-red-400 mt-4 normal-case tracking-normal opacity-100 max-w-sm text-center text-xs">It took longer than expected. If you are using a browser that blocks third-party storage, please try a different browser.</p>}
      </div>
    );
  }

  const onboardingConf = settings.find(s => s.key === 'onboarding_done');

  return (
    <HashRouter>
      {onboardingConf?.value === 'true' ? (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PortfolioScreen />} />
            <Route path="dashboard" element={<DashboardScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="settings/store" element={<PluginStoreScreen />} />
            <Route path="settings/create-plugin" element={<CreateJsPluginScreen />} />
          </Route>
        </Routes>
      ) : (
        <OnboardingScreen />
      )}
    </HashRouter>
  );
}
