import Dexie, { type EntityTable } from 'dexie';
import type { PortfolioEntry, CachedPrice, InstalledPlugin, PluginRepo, AppSettings } from './types';

const db = new Dexie('PortfolioDB') as Dexie & {
  portfolio: EntityTable<PortfolioEntry, 'id'>;
  cachedPrices: EntityTable<CachedPrice, 'id'>;
  installedPlugins: EntityTable<InstalledPlugin, 'id'>;
  pluginRepos: EntityTable<PluginRepo, 'url'>;
  appSettings: EntityTable<AppSettings, 'key'>;
};

db.version(1).stores({
  portfolio: 'id, pluginId, assetTypeId',
  cachedPrices: 'id, pluginId, assetTypeId, currency',
  installedPlugins: 'id',
  pluginRepos: 'url',
  appSettings: 'key'
});

db.version(2).stores({
  portfolio: 'id, pluginId, assetTypeId, boughtAt'
});

export { db };
