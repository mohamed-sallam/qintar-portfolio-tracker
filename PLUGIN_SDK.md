# Qintar Plugin SDK Documentation

The Qintar application uses a sandboxed Javascript plugin system to fetch live prices. This allows the community to build custom integrations for various asset exchanges, APIs, and scraping sources without modifying the core app.

## The Plugin Lifecycle

When a user adds an asset to their portfolio, they must select an **Asset Type** provided by an installed plugin. Periodically, Qintar invokes the plugin's `fetchPrice` function to retrieve the latest valuation for that asset.

## Plugin Anatomy

A plugin is distributed as a JSON file hosted in a plugin repository (like GitHub Pages).

The JSON file must contain:
1. `manifest`: A JSON object describing the plugin.
2. `jsCode`: A string containing the JavaScript logic for the plugin.

### 1. The Manifest Object

```json
"manifest": {
  "id": "my-custom-plugin",
  "displayName": "My Custom Exchange Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Fetches prices from My API",
  "configSchema": [
    {
      "key": "api_key",
      "label": "API Key",
      "type": "text",
      "required": false
    }
  ],
  "supportedAssetTypes": [
    {
      "id": "gold-ingot-10g",
      "displayName": "10g Gold Ingot",
      "baseType": "GOLD",
      "baseTypeProperties": { "karat": "K24", "weightGrams": 10 },
      "countLabel": "Pieces",
      "supportedCurrencies": ["USD", "EGP"],
      "hasBuySellSpread": true
    }
  ]
}
```

### 2. The JavaScript Code (`jsCode`)

The `jsCode` string is evaluated in a sandboxed environment. It **must** return an object containing the `manifest` and the `fetchPrice` function.

```javascript
const manifest = {
  // ... mirror the manifest object here
};

/**
 * @param {string} assetTypeId - The ID of the asset to price
 * @param {object} config - User-provided config (e.g. config.api_key)
 * @param {object} sdk - Core SDK functions injected by Qintar
 */
async function fetchPrice(assetTypeId, config, sdk) {
  try {
    // ALWAYS use sdk.fetch instead of window.fetch!
    // sdk.fetch intelligently routes through CapacitorHttp on Android
    // to bypass CORS restrictions natively.
    const response = await sdk.fetch('https://api.example.com/price?asset=' + assetTypeId);
    
    if (!response.ok) {
        return { error: 'Failed to fetch' };
    }
    
    const data = await response.json();
    
    // You must return an object with:
    // - price: The base market price per unit
    // - sellPrice (optional): The bid price (if hasBuySellSpread is true)
    // - approximate (boolean): Whether the price is a rough estimate
    return {
      price: data.market_price,
      sellPrice: data.bid_price,
      approximate: false
    };
    
  } catch (err) {
    return { error: String(err) };
  }
}

return { manifest, fetchPrice };
```

## The SDK Object

The `sdk` parameter provided to `fetchPrice` contains utility functions:

- `sdk.fetch(url, options)`: A universal `fetch` wrapper. In the browser, it uses a proxy backend to bypass CORS. On Android, it uses native `CapacitorHttp`. This should be your primary network tool.

## Development Workflow

1. Inside Qintar, go to **Settings > Plugin Store > New JS Plugin**.
2. Write and test your code within the app's live editor.
3. Once working, copy the code and minify it into a JSON string to publish to your GitHub Pages repository.
4. Add your GitHub Pages URL to the Qintar Repository list to share it!
