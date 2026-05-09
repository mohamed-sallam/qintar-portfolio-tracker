import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { fetchPricesForPortfolio } from '@/src/lib/priceFetcher';
import { useState, useEffect } from 'react';
import { formatCurrency, formatQuantity } from '@/src/lib/utils';
import { RefreshCw, Plus, Trash2, AlertTriangle, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import { AddAssetSheet } from '@/src/components/AddAssetSheet';
import { useTheme, useHeadingClasses } from '@/src/lib/ThemeContext';

export function PortfolioScreen() {
  const prefCurrency = useLiveQuery(() => db.appSettings.get('preferred_currency'))?.value || 'USD';
  const portfolio = useLiveQuery(() => db.portfolio.orderBy('boughtAt').reverse().toArray()) || [];
  const prices = useLiveQuery(() => db.cachedPrices.where('currency').equals(prefCurrency).toArray(), [prefCurrency]) || [];
  
  const plugins = useLiveQuery(() => db.installedPlugins.toArray()) || [];
  
  const [refreshing, setRefreshing] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  const { meta, theme } = useTheme();
  const headingCls = useHeadingClasses();

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPricesForPortfolio();
    setRefreshing(false);
  };

  const getPriceData = (pluginId: string, assetTypeId: string) => {
    return prices.find(p => p.pluginId === pluginId && p.assetTypeId === assetTypeId);
  };

  const getManifestInfo = (pluginId: string) => plugins.find(p => p.id === pluginId)?.manifest;
  
  let totalCost = 0;
  let totalValue = 0;
  let hasApproximations = false;

  const entriesWithData = portfolio.map(entry => {
    const pData = getPriceData(entry.pluginId, entry.assetTypeId);
    const mData = getManifestInfo(entry.pluginId);
    const assetDef = mData?.supportedAssetTypes.find((a: any) => a.id === entry.assetTypeId);
    
    const cost = entry.totalCostPaid; 
    let value = 0;
    let profit = 0;
    
    if (pData) {
        const pPerUnit = pData.priceResult.sellPrice !== undefined ? pData.priceResult.sellPrice : pData.priceResult.price;
        value = entry.count * pPerUnit;
        profit = value - cost;
        if (pData.priceResult.approximate) hasApproximations = true;
    }

    totalCost += cost;
    totalValue += value;

    return { ...entry, value, profit, cost, pData, assetDef, mData };
  });

  const filteredEntries = filterType === 'ALL' ? entriesWithData : entriesWithData.filter(e => e.baseType === filterType);
  const totalProfit = totalValue - totalCost;
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const deleteEntry = async (id: string) => {
    await db.portfolio.delete(id);
  };

  const filters = ['ALL', 'GOLD', 'SILVER', 'CRYPTO', 'MONEY', 'STOCK'];
  const filterLabel = (f: string) => f === 'MONEY' ? 'CASH' : f;

  return (
    <div className="p-4 max-w-xl mx-auto pb-4">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex justify-between items-end mb-6 pt-2">
        <div>
           <span className="text-[10px] uppercase tracking-[0.4em] text-text-muted block mb-2">{meta.brandName}</span>
           <h1 className={`text-3xl ${headingCls}`}>
             {meta.titleFont === 'mono' ? 'PORTFOLIO' : 'Portfolio'}
           </h1>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="w-10 h-10 border border-border-muted flex items-center justify-center hover:bg-surface-elevated transition-colors outline-none shrink-0 th-btn" style={{ borderRadius: 'var(--th-radius-btn)' }}>
          <RefreshCw className={`w-4 h-4 opacity-60 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Summary Card ───────────────────────────────────── */}
      <div className="bg-surface-card th-border border-border-subtle p-6 relative overflow-hidden th-shadow th-card mb-6 theme-transition">
        {meta.showDecorativeLines && (
          <>
            <div className="absolute top-[20%] left-[15%] w-[40%] h-[1px] bg-border-muted rotate-45"></div>
            <div className="absolute top-[40%] right-[10%] w-[60%] h-[1px] bg-border-subtle -rotate-12"></div>
          </>
        )}
        <div className="relative z-10">
           <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted mb-2">
             {meta.titleFont === 'mono' ? '> TOTAL_VALUE' : 'Total Asset Value'}
           </p>
           <div className="flex items-end gap-3 mb-4">
             <h2 className={`text-3xl ${headingCls} leading-none`}>
               {hasApproximations ? '~' : ''}{formatCurrency(totalValue, prefCurrency)}
             </h2>
             {totalProfit !== 0 && (
               <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 th-pill ${totalProfit >= 0 ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'}`}>
                 {totalProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                 {totalProfit >= 0 ? '+' : ''}{totalProfitPct.toFixed(1)}%
               </span>
             )}
           </div>
           
           {meta.summaryCardLayout === 'inline' ? (
             /* Arctic / Solar: side-by-side compact */
             <div className="flex gap-4 pt-4 border-t border-border-subtle">
               <div className="flex-1 bg-surface-elevated p-3 th-card">
                 <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Cost</p>
                 <p className="font-semibold text-sm">{formatCurrency(totalCost, prefCurrency)}</p>
               </div>
               <div className="flex-1 bg-surface-elevated p-3 th-card">
                 <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">P/L</p>
                 <p className={`font-semibold text-sm ${totalProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                   {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, prefCurrency)}
                 </p>
               </div>
             </div>
           ) : (
             /* Obsidian / Emerald / Rose: classic stacked */
             <div className="flex justify-between items-end pt-4 border-t border-border-subtle">
               <div>
                 <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Cost Basis</p>
                 <p className={`${headingCls} text-base not-italic`}>{formatCurrency(totalCost, prefCurrency)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Net P/L</p>
                 <p className={`${headingCls} text-base not-italic ${totalProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                   {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, prefCurrency)}
                 </p>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-1 no-scrollbar">
        {filters.map(f => {
          const isActive = filterType === f;
          if (meta.filterStyle === 'pill') {
            return (
              <button key={f} onClick={() => setFilterType(f)}
                className={`text-[9px] uppercase tracking-[0.15em] px-4 py-2 outline-none transition-all whitespace-nowrap font-medium ${
                  isActive
                    ? 'bg-accent text-btn-text'
                    : 'bg-surface-elevated text-text-muted'
                }`}
                style={{ borderRadius: 'var(--th-radius-pill)' }}
              >
                {filterLabel(f)}
              </button>
            );
          } else if (meta.filterStyle === 'chip') {
            return (
              <button key={f} onClick={() => setFilterType(f)}
                className={`text-[9px] uppercase tracking-[0.15em] px-4 py-2 outline-none transition-all whitespace-nowrap font-medium th-border ${
                  isActive
                    ? 'border-accent text-accent bg-surface-elevated'
                    : 'border-border-subtle text-text-muted'
                }`}
                style={{ borderRadius: 'var(--th-radius-pill)' }}
              >
                {filterLabel(f)}
              </button>
            );
          } else {
            // underline (Obsidian default)
            return (
              <button key={f} onClick={() => setFilterType(f)}
                className={`text-[9px] uppercase tracking-[0.3em] pb-1 whitespace-nowrap outline-none transition-all border-b-2 ${
                  isActive ? 'border-accent text-text-primary' : 'border-transparent text-text-muted'
                }`}
              >
                {filterLabel(f)}
              </button>
            );
          }
        })}
      </div>

      {/* ── Asset Cards ────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredEntries.map(e => (
          <div key={e.id} className="bg-surface-card th-border border-border-subtle p-5 flex flex-col relative group th-card th-shadow theme-transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className={`${headingCls} text-base mb-1 truncate not-italic`}>
                  {e.assetDef?.displayName || e.assetTypeId}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">
                  {formatQuantity(e.count, false)} {e.assetDef?.countLabel}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-semibold text-base`}>
                  {e.pData?.priceResult.approximate ? '~' : ''}{formatCurrency(e.value, prefCurrency)}
                </p>
                <p className={`text-[9px] uppercase tracking-widest mt-1 font-normal ${e.profit >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {e.profit >= 0 ? '+' : ''}{formatCurrency(e.profit, prefCurrency)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
               <div className="text-[9px] uppercase tracking-widest text-text-muted flex items-center">
                 {e.pData ? (
                   `Updated ${new Date(e.pData.fetchedAt).toLocaleTimeString()}`
                 ) : (
                   <span className="flex items-center text-accent"><AlertTriangle className="w-3 h-3 mr-2" /> No price data</span>
                 )}
               </div>
               <button onClick={() => deleteEntry(e.id)} className="text-text-muted hover:text-negative transition-colors outline-none p-1">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center bg-surface-card th-border border-border-subtle p-12 th-card th-shadow">
            <div className="w-16 h-16 mb-6 bg-surface-elevated flex items-center justify-center th-card">
               <Briefcase className="w-6 h-6 text-text-muted" />
            </div>
            <h3 className={`${headingCls} text-xl mb-4 not-italic`}>
              {meta.titleFont === 'mono' ? 'EMPTY' : 'No Assets Yet'}
            </h3>
            <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-8 max-w-[240px] leading-relaxed">
              {meta.titleFont === 'mono' ? 'Initialize acquisition.' : 'Add your first asset to get started.'}
            </p>
            <button onClick={() => setAddSheetOpen(true)} className="bg-btn-bg text-btn-text text-[11px] uppercase tracking-[0.2em] py-3 px-8 font-bold hover:bg-accent-hover transition-colors outline-none th-btn">
              {meta.titleFont === 'mono' ? '+ ACQUIRE' : 'Add Asset'}
            </button>
          </div>
        )}
      </div>

      {/* ── FAB ────────────────────────────────────────────── */}
      {filteredEntries.length > 0 && (
        <button onClick={() => setAddSheetOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-btn-bg text-btn-text flex items-center justify-center shadow-lg hover:bg-accent-hover transition-all outline-none z-10"
          style={{ borderRadius: meta.filterStyle === 'pill' ? '999px' : 'var(--th-radius-btn)' }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {addSheetOpen && <AddAssetSheet onClose={() => setAddSheetOpen(false)} prefCurrency={prefCurrency} />}
    </div>
  );
}
