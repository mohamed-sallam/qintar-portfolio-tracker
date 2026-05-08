import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Trash2, Settings as SettingsIcon, X, Save, Code, Palette, Check } from 'lucide-react';
import { useTheme, useHeadingClasses, THEMES, type ThemeId } from '@/src/lib/ThemeContext';

const ConfigForm = ({ pluginId, onClose }: { pluginId: string, onClose: () => void }) => {
     const plugin = useLiveQuery(() => db.installedPlugins.get(pluginId), [pluginId]);
     const [localConfig, setLocalConfig] = useState<Record<string, string>>({});
     const { meta } = useTheme();
     const headingCls = useHeadingClasses();
     
     React.useEffect(() => {
        if (plugin?.userConfig && Object.keys(localConfig).length === 0) {
            setLocalConfig(plugin.userConfig);
        }
     }, [plugin]);

     if (!plugin) return null;
     
     const saveConfig = async () => {
         await db.installedPlugins.update(pluginId, { userConfig: localConfig });
         onClose();
     };
     
     return (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-surface-card w-full max-w-md th-border border-border-muted shadow-2xl overflow-hidden flex flex-col max-h-[80vh] font-sans text-text-primary th-card">
              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-elevated">
                 <h2 className="text-[11px] uppercase tracking-[0.3em] font-medium opacity-80">Configure {plugin.displayName}</h2>
                 <button onClick={onClose} className="p-1 hover:bg-surface-base transition-colors outline-none th-btn"><X className="w-5 h-5 opacity-50"/></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                 {plugin.manifest.configSchema?.map((schema: any) => (
                    <div key={schema.key}>
                       <label className="block text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">{schema.label}</label>
                       {schema.type === 'BOOLEAN' ? (
                          <div className="flex items-center mt-2">
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={localConfig[schema.key] === 'true' || localConfig[schema.key] === true as any} onChange={(e) => setLocalConfig({...localConfig, [schema.key]: String(e.target.checked)})} />
                                <div className="w-11 h-6 bg-border-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toggle-on"></div>
                             </label>
                             <span className="ml-4 text-[10px] uppercase tracking-widest text-text-muted">{schema.description}</span>
                          </div>
                       ) : schema.type === 'CURRENCY_SELECT' ? (
                          <select value={localConfig[schema.key] || schema.defaultValue} onChange={(e) => setLocalConfig({...localConfig, [schema.key]: e.target.value})} className="w-full p-4 outline-none th-border border-border-subtle bg-input-bg text-text-primary focus:border-accent font-sans text-sm tracking-wider uppercase th-input">
                             {['USD', 'EUR', 'GBP', 'EGP', 'JPY', 'INR', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       ) : (
                          <>
                             <input type={schema.type === 'NUMBER' ? 'number' : 'text'} step="any" value={localConfig[schema.key] || schema.defaultValue || ''} onChange={(e) => setLocalConfig({...localConfig, [schema.key]: e.target.value})} className="w-full p-4 outline-none th-border border-border-subtle bg-input-bg text-text-primary focus:border-accent font-serif th-input" />
                             {schema.description && <p className="text-[9px] uppercase tracking-widest text-text-muted mt-2">{schema.description}</p>}
                          </>
                       )}
                    </div>
                 ))}
                 {!plugin.manifest.configSchema?.length && <p className="text-[10px] uppercase tracking-widest text-text-muted">No configuration needed.</p>}
              </div>
              <div className="p-6 border-t border-border-subtle bg-surface-elevated">
                 <button onClick={saveConfig} className="w-full bg-btn-bg text-btn-text p-4 text-[11px] uppercase tracking-[0.3em] font-bold flex items-center justify-center hover:bg-accent transition-colors outline-none th-btn"><Save className="w-4 h-4 mr-3 opacity-60"/> Save Configuration</button>
              </div>
           </div>
        </div>
     );
};

export function SettingsScreen() {
  const navigate = useNavigate();
  const prefCurrency = useLiveQuery(() => db.appSettings.get('preferred_currency'));
  const repos = useLiveQuery(() => db.pluginRepos.toArray());
  const installedLogs = useLiveQuery(() => db.installedPlugins.toArray());
  const [repoUrl, setRepoUrl] = useState('');
  
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  const { theme, meta, setTheme } = useTheme();
  const headingCls = useHeadingClasses();

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await db.appSettings.put({ key: 'preferred_currency', value: e.target.value });
  };

  const addRepo = async () => {
    if (!repoUrl) return;
    try {
      await db.pluginRepos.put({ url: repoUrl, name: 'Custom Repo (Refresh Store to load)', lastFetched: 0 });
      setRepoUrl('');
    } catch {
      alert("Invalid Repo URL");
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-xl mx-auto pb-safe">
      <div>
         <span className="text-[10px] uppercase tracking-[0.4em] text-text-muted block mb-2">{meta.brandName}</span>
         <h1 className={`text-4xl ${headingCls}`}>
           {meta.titleFont === 'mono' ? 'CONFIG' : 'Settings'}
         </h1>
      </div>
      
      {/* ── General ─────────────────────────────────────────── */}
      <section className="bg-surface-card p-6 th-border border-border-subtle space-y-4 th-card th-shadow theme-transition">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-2">
          {meta.titleFont === 'mono' ? '> GENERAL' : 'General'}
        </h2>
        <div className="flex justify-between items-center border-t border-border-subtle pt-4">
          <span className={`${headingCls} text-lg not-italic`}>
            {meta.titleFont === 'mono' ? 'CURRENCY' : 'Preferred Currency'}
          </span>
          <select 
            value={prefCurrency?.value || 'USD'} 
            onChange={handleCurrencyChange}
            className="p-3 bg-input-bg th-border border-border-subtle outline-none focus:border-accent font-sans text-sm tracking-wider uppercase th-input"
          >
            {['USD', 'EUR', 'GBP', 'EGP', 'JPY', 'INR', 'CAD'].map(c => 
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>
      </section>

      {/* ── Theme Picker ────────────────────────────────────── */}
      <section className="bg-surface-card p-6 th-border border-border-subtle th-card th-shadow theme-transition">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-4 h-4 text-accent" />
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-muted">
            {meta.titleFont === 'mono' ? '> THEME' : 'Appearance'}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {THEMES.map(t => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-full text-left p-4 transition-all outline-none flex items-center gap-4 group ${
                  isActive 
                    ? 'bg-surface-elevated border-accent' 
                    : 'bg-surface-elevated border-border-subtle hover:border-border-muted'
                }`}
                style={{
                  borderWidth: 'var(--th-border-w)',
                  borderStyle: 'solid',
                  borderColor: isActive ? 'var(--th-accent)' : undefined,
                  borderRadius: 'var(--th-radius-card)',
                }}
              >
                {/* Color swatch preview */}
                <div className="flex gap-1.5 shrink-0">
                  {t.previewColors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 border border-white/10"
                      style={{
                        backgroundColor: color,
                        borderRadius: t.id === 'rose' ? '999px'
                          : t.id === 'arctic' ? '8px'
                          : t.id === 'emerald' ? '4px'
                          : '2px',
                      }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-medium ${isActive ? 'text-accent' : ''}`}>{t.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5 truncate">{t.description}</p>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-btn-text" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Repositories ────────────────────────────────────── */}
      <section className="bg-surface-card p-6 th-border border-border-subtle th-card th-shadow theme-transition">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-muted">
            {meta.titleFont === 'mono' ? '> REPOS' : 'Repositories'}
          </h2>
          <Link to="/settings/store" className="bg-surface-elevated th-border border-border-muted text-text-primary hover:border-accent px-4 py-2 flex items-center text-[9px] uppercase tracking-[0.2em] outline-none transition-all th-btn">
            <Store className="w-3 h-3 mr-2 opacity-50" />
            Store
          </Link>
        </div>
        
        <ul className="space-y-3 mb-6">
          {repos?.map(r => (
            <li key={r.url} className="flex justify-between items-center p-4 bg-surface-elevated th-border border-border-subtle group th-card gap-4">
              <div className="flex-1 min-w-0">
                <p className={`${headingCls} text-lg truncate opacity-90 not-italic`}>{r.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-text-muted truncate mt-1 font-sans font-normal">{r.url}</p>
              </div>
              <button onClick={() => db.pluginRepos.delete(r.url)} className="text-text-muted p-2 outline-none hover:text-accent transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {repos?.length === 0 && <p className="text-[9px] uppercase tracking-widest text-text-muted py-2">No repositories added.</p>}
        </ul>

        <div className="flex gap-3">
          <input 
            type="url" 
            placeholder="Repository URL" 
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            className="flex-1 min-w-0 p-3 bg-input-bg th-border border-border-subtle outline-none focus:border-accent font-sans text-sm placeholder:not-italic th-input"
          />
          <button onClick={addRepo} className="bg-btn-bg text-btn-text text-[10px] uppercase tracking-[0.2em] font-bold px-6 py-3 hover:bg-accent transition-colors outline-none shrink-0 th-btn">Add</button>
        </div>
      </section>

      {/* ── Installed Plugins ───────────────────────────────── */}
      <section className="bg-surface-card p-6 th-border border-border-subtle th-card th-shadow theme-transition">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-muted">
            {meta.titleFont === 'mono' ? '> PLUGINS' : 'Installed Plugins'}
          </h2>
          <Link to="/settings/create-plugin" className="bg-surface-elevated th-border border-border-muted text-text-primary hover:border-accent px-4 py-2 flex items-center text-[9px] uppercase tracking-[0.2em] outline-none transition-all th-btn">
            <Code className="w-3 h-3 mr-2 opacity-50" />
            {meta.titleFont === 'mono' ? 'NEW' : 'New JS Plugin'}
          </Link>
        </div>
        {installedLogs?.length === 0 ? (
          <p className="text-[9px] uppercase tracking-widest text-text-muted py-2">No plugins installed. Visit the Plugin Store.</p>
        ) : (
          <ul className="space-y-3">
            {installedLogs?.map(plugin => (
              <li key={plugin.id} className="flex items-center justify-between p-4 bg-surface-elevated th-border border-border-subtle th-card gap-4">
                <div onClick={() => setConfigPluginId(plugin.id)} className="flex-1 min-w-0 cursor-pointer group">
                  <div className="flex items-center gap-3">
                     <p className={`${headingCls} text-lg truncate opacity-90 group-hover:text-accent transition-colors not-italic`}>{plugin.displayName}</p>
                     <SettingsIcon className="w-3 h-3 shrink-0 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted truncate mt-1 font-sans font-normal">v{plugin.version}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={plugin.enabled} onChange={async (e) => {
                      await db.installedPlugins.update(plugin.id, { enabled: e.target.checked });
                    }} />
                    <div className="w-11 h-6 bg-border-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toggle-on"></div>
                  </label>
                  <button onClick={() => db.installedPlugins.delete(plugin.id)} className="text-text-muted p-2 hover:text-red-400 transition-colors outline-none">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      {configPluginId && <ConfigForm pluginId={configPluginId} onClose={() => setConfigPluginId(null)} />}
    </div>
  );
}
