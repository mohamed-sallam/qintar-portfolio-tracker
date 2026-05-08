import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { formatCurrency, formatQuantity } from '@/src/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme, useHeadingClasses } from '@/src/lib/ThemeContext';

function getChartColors(): string[] {
  const root = getComputedStyle(document.documentElement);
  return [
    root.getPropertyValue('--th-chart-1').trim() || '#C5A059',
    root.getPropertyValue('--th-chart-2').trim() || '#D1BFAE',
    root.getPropertyValue('--th-chart-3').trim() || '#8B7A5E',
    root.getPropertyValue('--th-chart-4').trim() || '#E0E0E0',
    root.getPropertyValue('--th-chart-5').trim() || '#4A4A4A',
  ];
}

export function DashboardScreen() {
  const prefCurrency = useLiveQuery(() => db.appSettings.get('preferred_currency'))?.value || 'USD';
  const portfolio = useLiveQuery(() => db.portfolio.toArray()) || [];
  const prices = useLiveQuery(() => db.cachedPrices.where('currency').equals(prefCurrency).toArray(), [prefCurrency]) || [];
  const plugins = useLiveQuery(() => db.installedPlugins.toArray()) || [];
  const savedTheme = useLiveQuery(() => db.appSettings.get('theme'));

  const { meta } = useTheme();
  const headingCls = useHeadingClasses();
  const COLORS = getChartColors();

  let totalGoldWeight = 0;
  let totalSilverWeight = 0;
  let totalCryptoValue = 0;
  let totalCashValue = 0;
  let totalStockValue = 0;

  const pluginStats: Record<string, { cost: number, value: number, pluginName: string }> = {};

  portfolio.forEach(entry => {
    const pData = prices.find(p => p.pluginId === entry.pluginId && p.assetTypeId === entry.assetTypeId);
    let value = 0;
    if (pData) {
      const pPerUnit = pData.priceResult.sellPrice !== undefined ? pData.priceResult.sellPrice : pData.priceResult.price;
      value = entry.count * pPerUnit;
    }
    const cost = entry.totalCostPaid;
    
    if (entry.baseType === 'GOLD') totalGoldWeight += entry.baseAsset.weightGrams * entry.count;
    if (entry.baseType === 'SILVER') totalSilverWeight += entry.baseAsset.weightGrams * entry.count;
    if (entry.baseType === 'CRYPTO') totalCryptoValue += value;
    if (entry.baseType === 'MONEY') totalCashValue += value;
    if (entry.baseType === 'STOCK') totalStockValue += value;

    if (!pluginStats[entry.pluginId]) {
       const pName = plugins.find(p => p.id === entry.pluginId)?.displayName || entry.pluginId;
       pluginStats[entry.pluginId] = { cost: 0, value: 0, pluginName: pName };
    }
    pluginStats[entry.pluginId].cost += cost;
    pluginStats[entry.pluginId].value += value;
  });

  let goldVal = 0;
  let silverVal = 0;
  portfolio.forEach(e => {
     if(e.baseType === 'GOLD' || e.baseType === 'SILVER') {
       const pData = prices.find(p => p.pluginId === e.pluginId && p.assetTypeId === e.assetTypeId);
       let value = 0;
       if (pData) {
         const pPerUnit = pData.priceResult.sellPrice !== undefined ? pData.priceResult.sellPrice : pData.priceResult.price;
         value = e.count * pPerUnit;
       }
       if (e.baseType === 'GOLD') goldVal += value;
       if (e.baseType === 'SILVER') silverVal += value;
     }
  });

  const chartData = [
    { name: 'Gold', value: goldVal },
    { name: 'Silver', value: silverVal },
    { name: 'Crypto', value: totalCryptoValue },
    { name: 'Cash', value: totalCashValue },
    { name: 'Stock', value: totalStockValue },
  ].filter(d => d.value > 0);

  const tooltipStyle = {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--th-surface-elevated').trim(),
    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--th-border-muted').trim(),
    color: getComputedStyle(document.documentElement).getPropertyValue('--th-text-primary').trim(),
    borderRadius: getComputedStyle(document.documentElement).getPropertyValue('--th-radius-card').trim(),
  };

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 sm:space-y-8 pb-4">
      <div>
         <span className="text-[10px] uppercase tracking-[0.4em] text-text-muted block mb-2">{meta.brandName}</span>
         <h1 className={`text-4xl ${headingCls}`}>
           {meta.titleFont === 'mono' ? 'ANALYTICS' : 'Dashboard'}
         </h1>
      </div>

      {/* ── Stat Tiles ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Tile title={meta.titleFont === 'mono' ? 'AU_WEIGHT' : 'Total Gold'} value={formatQuantity(totalGoldWeight, true)} headingCls={headingCls} />
        <Tile title={meta.titleFont === 'mono' ? 'AG_WEIGHT' : 'Total Silver'} value={formatQuantity(totalSilverWeight, true)} headingCls={headingCls} />
        <Tile title={meta.titleFont === 'mono' ? 'CRYPTO_VAL' : 'Total Crypto'} value={formatCurrency(totalCryptoValue, prefCurrency)} headingCls={headingCls} />
        <Tile title={meta.titleFont === 'mono' ? 'CASH_VAL' : 'Total Cash'} value={formatCurrency(totalCashValue, prefCurrency)} headingCls={headingCls} />
        <Tile title={meta.titleFont === 'mono' ? 'STOCK_VAL' : 'Total Stocks'} value={formatCurrency(totalStockValue, prefCurrency)} headingCls={headingCls} />
      </div>

      {/* ── Pie Chart ──────────────────────────────────────── */}
      <div className="bg-surface-card th-border border-border-subtle p-8 relative overflow-hidden th-card th-shadow theme-transition">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-6">
          {meta.titleFont === 'mono' ? '> ALLOCATION' : 'Allocation'}
        </h2>
        {chartData.length > 0 ? (
          <div className="h-64 font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => formatCurrency(val, prefCurrency)} contentStyle={tooltipStyle} itemStyle={{ color: tooltipStyle.color }}/>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-[10px] uppercase tracking-widest text-text-muted py-10">No assets allocated.</p>
        )}
      </div>

      {/* ── P&L Table ──────────────────────────────────────── */}
      <div className="bg-surface-card th-border border-border-subtle overflow-hidden th-card th-shadow theme-transition">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-muted p-6 border-b border-border-subtle">
          {meta.titleFont === 'mono' ? '> P_AND_L' : 'P&L by Plugin'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-elevated border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-text-muted font-normal">Plugin</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-text-muted font-normal text-right">Cost</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-text-muted font-normal text-right">Value</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-text-muted font-normal text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(pluginStats).map((stat, i) => {
                 const pl = stat.value - stat.cost;
                 const plPct = stat.cost > 0 ? (pl / stat.cost) * 100 : 0;
                 return (
                  <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-surface-elevated transition-colors">
                    <td className="px-6 py-4 truncate max-w-[120px] font-medium opacity-90 text-[11px] uppercase tracking-wide" title={stat.pluginName}>{stat.pluginName}</td>
                    <td className={`px-6 py-4 text-right ${headingCls} not-italic`}>{formatCurrency(stat.cost, prefCurrency)}</td>
                    <td className={`px-6 py-4 text-right ${headingCls} not-italic`}>{formatCurrency(stat.value, prefCurrency)}</td>
                    <td className={`px-6 py-4 text-right ${headingCls} not-italic ${pl >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {pl >= 0 ? '+' : ''}{formatCurrency(pl, prefCurrency)} <br/>
                      <span className="text-[9px] font-sans opacity-60 tracking-wider font-normal">({pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%)</span>
                    </td>
                  </tr>
                 );
              })}
              {Object.keys(pluginStats).length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-[10px] uppercase tracking-widest text-text-muted">No plugin data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ title, value, headingCls }: { title: string, value: string, headingCls: string }) {
  return (
    <div className="bg-surface-card th-border border-border-subtle p-4 sm:p-5 flex flex-col justify-center th-card th-shadow theme-transition overflow-hidden min-w-0">
      <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted mb-2 truncate">{title}</span>
      <span className={`${headingCls} text-lg sm:text-xl not-italic truncate`} title={value}>{value}</span>
    </div>
  );
}
