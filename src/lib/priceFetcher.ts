import { db } from '@/src/lib/db';
import type { PriceResult, InstalledPlugin } from '@/src/lib/types';
import { universalFetch } from '@/src/lib/utils';

export const fetchPricesForPortfolio = async () => {
    const entries = await db.portfolio.toArray();
    const prefCurrencySetting = await db.appSettings.get('preferred_currency');
    const currency = prefCurrencySetting?.value || 'USD';
    
    const plugins = await db.installedPlugins.toArray();
    const enabledPlugins = plugins.filter(p => p.enabled);

    const promises = entries.map(async (entry) => {
        const plugin = enabledPlugins.find(p => p.id === entry.pluginId);
        if (!plugin) return;

        try {
            if (plugin.isLocalJs && plugin.jsCode) {
                const sdk = {
                    fetch: universalFetch
                };

                try {
                    const pluginDef = new Function('sdk', 'fetch', plugin.jsCode)(sdk, universalFetch);
                    const config = plugin.userConfig || {};
                    const data = await pluginDef.fetchPrice(entry.assetTypeId, { ...config, preferred_currency: currency }, sdk);
                    
                    console.log(`Fetched price for ${entry.assetTypeId} via ${plugin.id}:`, data);
                    
                    if (data.error) throw new Error(data.error);

                    const parsedPrice = parseFloat(data.price);
                    const parsedSellPrice = data.sellPrice !== undefined ? parseFloat(data.sellPrice) : undefined;
                    
                    const priceResult: PriceResult = {
                        price: isNaN(parsedPrice) ? 0 : parsedPrice,
                        sellPrice: (parsedSellPrice !== undefined && !isNaN(parsedSellPrice)) ? parsedSellPrice : undefined,
                        approximate: data.approximate === true
                    };
                    
                    console.log(`Saved priceResult for ${entry.assetTypeId}:`, priceResult);

                    await db.cachedPrices.put({
                        id: `${entry.pluginId}_${entry.assetTypeId}_${currency}`,
                        pluginId: entry.pluginId,
                        assetTypeId: entry.assetTypeId,
                        currency,
                        priceResult,
                        fetchedAt: Date.now()
                    });
                } catch (e) {
                    console.error(`Local JS Plugin error for ${plugin.id} fetching ${entry.assetTypeId}:`, e);
                }
            } else {
                console.error("Plugin is not LocalJs or missing jsCode.", plugin.id);
            }
        } catch (e) {
            console.error("Failed to fetch price for entry", entry.id, e);
        }
    });

    await Promise.all(promises);
};
