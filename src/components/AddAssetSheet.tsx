import { useState } from 'react';
import { db } from '@/src/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, ArrowRight, Save } from 'lucide-react';
import type { AssetTypeDefinition, BaseAsset } from '@/src/lib/types';
import { useTheme, useHeadingClasses } from '@/src/lib/ThemeContext';
import { universalFetch } from '@/src/lib/utils';

export function AddAssetSheet({ onClose, prefCurrency }: { onClose: () => void, prefCurrency: string }) {
  const plugins = useLiveQuery(() => db.installedPlugins.filter(p => p.enabled).toArray()) || [];
  const { meta } = useTheme();
  const headingCls = useHeadingClasses();
  
  const [step, setStep] = useState(1);
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetTypeDefinition | null>(null);
  
  const [count, setCount] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const selectAssetType = async (plugin: any, asset: AssetTypeDefinition) => {
    const config = plugin.userConfig;
    const isSupported = asset.supportedCurrencies.includes(prefCurrency);
    
    let allowed = isSupported;
    if (!isSupported) {
       const schemaHasFallback = plugin.manifest.configSchema.some((c:any) => c.key === 'fallback_enabled');
       const fallbackEnabled = config['fallback_enabled'] === 'true' || config['fallback_enabled'] === true; 
       const hasRate = Object.keys(config).some(k => k.includes('rate') && config[k]?.trim() !== '');
       if (schemaHasFallback && fallbackEnabled && hasRate) {
           allowed = true;
       }
    }

    if (!allowed) {
      setErrorMsg(`This asset does not support ${prefCurrency} and no fallback conversion is configured. Change your preferred currency or configure fallback in plugin settings.`);
      return;
    }
    
    setErrorMsg('');
    setSelectedPlugin(plugin);
    setSelectedAsset(asset);
    
    try {
       if (plugin.isLocalJs && plugin.jsCode) {
           const sdk = {
               fetch: universalFetch
           };
           const pluginDef = new Function('sdk', 'fetch', plugin.jsCode)(sdk, universalFetch);
           const data = await pluginDef.fetchPrice(asset.id, { ...plugin.userConfig, preferred_currency: prefCurrency }, sdk);
           if (!data.error) {
               const p = data.sellPrice !== undefined && !isNaN(parseFloat(data.sellPrice)) ? data.sellPrice : data.price;
               setLivePrice(isNaN(parseFloat(p)) ? 0 : parseFloat(p));
           }
       } else {
           console.error("Not a JS plugin or missing jsCode", plugin.id);
       }
    } catch(e) {
       console.error("Failed to fetch live price", e);
    }
    
    setStep(2);
  };

  const handleCountChange = (newCount: string) => {
     setCount(newCount);
     if (livePrice && !isNaN(Number(newCount))) {
         setCost((Number(newCount) * livePrice).toFixed(2));
     }
  };

  const handleSave = async () => {
    if (!count || isNaN(Number(count))) return alert("Invalid count");
    if (!cost || isNaN(Number(cost))) return alert("Invalid cost");

    const baseAsset: BaseAsset | any = { ...selectedAsset?.baseTypeProperties };
    
    await db.portfolio.put({
      id: crypto.randomUUID(),
      pluginId: selectedPlugin.id,
      assetTypeId: selectedAsset!.id,
      baseAsset,
      baseType: selectedAsset!.baseType,
      count: Number(count),
      totalCostPaid: Number(cost),
      costCurrency: prefCurrency,
      boughtAt: new Date(date).getTime(),
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-overlay backdrop-blur-sm">
      <div
        className="bg-surface-card w-full border-t border-border-muted max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden relative font-sans text-text-primary th-shadow"
        style={{ borderRadius: 'var(--th-radius-card) var(--th-radius-card) 0 0' }}
      >
        <div className="flex justify-between items-center p-6 border-b border-border-subtle">
          <h2 className="text-[11px] uppercase tracking-[0.3em] font-medium opacity-80">
            {step === 1
              ? (meta.titleFont === 'mono' ? '> SELECT_ASSET' : 'Choose Asset')
              : (meta.titleFont === 'mono' ? '> INPUT_DATA' : 'Enter Details')
            }
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated transition-colors outline-none" style={{ borderRadius: 'var(--th-radius-btn)' }}>
            <X className="w-5 h-5 opacity-50"/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              {plugins.length === 0 && <p className="text-[10px] uppercase tracking-widest text-text-muted">No active plugins found. Visit Settings.</p>}
              {plugins.map(plugin => (
                <div key={plugin.id} className="mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-4 font-medium">{plugin.displayName}</h3>
                  <div className="space-y-3">
                    {plugin.manifest.supportedAssetTypes.map((asset: AssetTypeDefinition) => (
                      <button 
                        key={asset.id} 
                        onClick={() => selectAssetType(plugin, asset)}
                        className="w-full text-left p-4 th-border border-border-subtle hover:border-accent outline-none transition-all flex justify-between items-center bg-surface-elevated group th-card"
                      >
                        <div>
                           <p className={`${headingCls} text-lg opacity-90`}>{asset.displayName}</p>
                           <p className="text-[9px] uppercase tracking-widest text-text-muted mt-1 not-italic font-normal">{asset.baseType}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:text-accent transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {errorMsg && <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-[10px] uppercase tracking-widest leading-relaxed mt-4 th-card">{errorMsg}</div>}
            </div>
          )}

          {step === 2 && selectedAsset && (
            <div className="space-y-6 pb-safe">
               <div>
                 <label className="block text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Count ({selectedAsset.countLabel})</label>
                 <input type="number" step="any" value={count} onChange={e => handleCountChange(e.target.value)} className="w-full p-4 bg-input-bg th-border border-border-subtle outline-none focus:border-accent text-text-primary font-serif text-lg th-input" placeholder="0.00" />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Total Cost Paid ({prefCurrency})</label>
                 <input type="number" step="any" value={cost} onChange={e => setCost(e.target.value)} className="w-full p-4 bg-input-bg th-border border-border-subtle outline-none focus:border-accent text-text-primary font-serif text-lg th-input" placeholder="0.00" />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Date of Purchase</label>
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-input-bg th-border border-border-subtle outline-none focus:border-accent text-text-primary opacity-80 th-input" />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Notes</label>
                 <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 bg-input-bg th-border border-border-subtle outline-none focus:border-accent text-text-primary opacity-80 h-24 italic font-serif th-input" placeholder="Optional provenance..." />
               </div>

               <div className="pt-6 flex gap-4">
                 <button onClick={() => setStep(1)} className="flex-1 p-4 th-border border-border-muted text-[9px] uppercase tracking-widest hover:bg-surface-elevated transition-colors outline-none font-medium th-btn">Return</button>
                 <button onClick={handleSave} className="flex-[2] flex justify-center items-center p-4 bg-btn-bg text-btn-text text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-accent transition-colors outline-none th-btn">
                   {meta.titleFont === 'mono' ? 'CONFIRM' : 'Acquire Asset'}
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
