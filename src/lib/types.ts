export type BaseType = "GOLD" | "SILVER" | "MONEY" | "CRYPTO" | "STOCK";

export type GoldKarat = "K24" | "K22" | "K21" | "K18" | "K14" | "K9";
export type SilverKarat = "S999" | "S925" | "S800";

export interface GoldAsset {
  weightGrams: number;
  karat: GoldKarat;
}

export interface SilverAsset {
  weightGrams: number;
  karat: SilverKarat;
}

export interface MoneyAsset {
  quantity: number;
  currencyCode: string;
}

export interface CryptoAsset {
  quantity: number;
  symbol: string;
}

export interface StockAsset {
  quantity: number;
  ticker: string;
  exchange: string;
}

export type BaseAsset = GoldAsset | SilverAsset | MoneyAsset | CryptoAsset | StockAsset;

export interface PortfolioEntry {
  id: string;
  pluginId: string;
  assetTypeId: string;
  baseAsset: any; // Keep JSON as object
  baseType: BaseType;
  count: number;
  totalCostPaid: number;
  costCurrency: string;
  boughtAt: number; // timestamp
  notes?: string;
}

export interface CachedPrice {
  id: string; // pluginId_assetTypeId_currency
  pluginId: string;
  assetTypeId: string;
  currency: string;
  priceResult: PriceResult;
  fetchedAt: number; // timestamp
}

export interface PriceResult {
  price: number;
  sellPrice?: number;
  approximate: boolean;
}

export interface InstalledPlugin {
  id: string;
  displayName: string;
  version: string;
  apiBaseUrl?: string;
  manifest: PluginManifest;
  userConfig: Record<string, string>;
  enabled: boolean;
  installedAt: number;
  lastManifestFetch: number;
  isLocalJs?: boolean;
  jsCode?: string;
}

export interface PluginRepo {
  url: string;
  name: string;
  lastFetched: number;
}

export interface AppSettings {
  key: string;
  value: string;
}

export interface PluginManifest {
  id: string;
  displayName: string;
  version: string;
  supportedAssetTypes: AssetTypeDefinition[];
  configSchema: ConfigSchemaItem[];
}

export interface AssetTypeDefinition {
  id: string;
  displayName: string;
  baseType: BaseType;
  baseTypeProperties: any;
  countLabel: string;
  supportedCurrencies: string[];
  hasBuySellSpread: boolean;
}

export interface ConfigSchemaItem {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "CURRENCY_SELECT";
  defaultValue: string;
  description?: string;
}
