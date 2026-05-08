import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme, useHeadingClasses } from '@/src/lib/ThemeContext';
import { universalFetch } from '@/src/lib/utils';

export function PluginStoreScreen() {
  const repos = useLiveQuery(() => db.pluginRepos.toArray());
  const installedPlugins = useLiveQuery(() => db.installedPlugins.toArray()) || [];
  const navigate = useNavigate();
  
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { meta } = useTheme();
  const headingCls = useHeadingClasses();

  useEffect(() => {
    if (!repos) return;
    const fetchRepos = async () => {
      setLoading(true);
      setError('');
      try {
        let allPlugins: any[] = [];
        for (const repo of repos) {
          try {
            const res = await fetch(repo.url);
            const data = await res.json();
            // Store repo base URL for resolving relative paths
            const repoBase = repo.url.substring(0, repo.url.lastIndexOf('/') + 1);
            const pluginsWithBase = (data.plugins || []).map((p: any) => ({
              ...p,
              _repoBase: repoBase,
            }));
            allPlugins = [...allPlugins, ...pluginsWithBase];
          } catch (e) {
            console.error('Failed to fetch repo:', repo.url);
          }
        }
        setPlugins(allPlugins);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchRepos();
  }, [repos]);

  const installPlugin = async (pluginStoreEntry: any) => {
    try {
      // Resolve manifestUrl: if it starts with './' or is relative, resolve against repo base
      let urlToFetch = pluginStoreEntry.manifestUrl || (pluginStoreEntry.apiBaseUrl + '/manifest');
      if (urlToFetch.startsWith('./') || urlToFetch.startsWith('../')) {
        urlToFetch = (pluginStoreEntry._repoBase || '') + urlToFetch.replace(/^\.\//, '');
      }
      
      if (!urlToFetch) throw new Error("No manifest URL provided");
      
      const res = await universalFetch(urlToFetch);
      if (!res.ok) throw new Error('Fetch manifest failed');
      const manifest = await res.json();
      
      const pluginManifest = manifest.manifest || manifest;
      const defaultConfig: Record<string, string> = {};
      pluginManifest.configSchema?.forEach((c: any) => {
        defaultConfig[c.key] = c.defaultValue || '';
      });

      await db.installedPlugins.put({
        id: pluginManifest.id,
        displayName: pluginManifest.displayName,
        version: pluginManifest.version,
        isLocalJs: !!manifest.jsCode,
        jsCode: manifest.jsCode,
        apiBaseUrl: manifest.jsCode ? undefined : pluginStoreEntry.apiBaseUrl,
        manifest: pluginManifest,
        userConfig: defaultConfig,
        enabled: true,
        installedAt: Date.now(),
        lastManifestFetch: Date.now()
      });
    } catch (e) {
      alert("Failed to install plugin: " + e);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto flex flex-col h-full pb-safe">
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button onClick={() => navigate('/settings')} className="p-3 th-border border-border-muted hover:bg-surface-elevated transition-colors group th-btn">
          <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
        </button>
        <div>
           <span className="text-[10px] uppercase tracking-[0.3em] text-text-muted block mb-1">
             {meta.titleFont === 'mono' ? '> DISCOVER' : 'Discover'}
           </span>
           <h1 className={`text-2xl ${headingCls}`}>
             {meta.titleFont === 'mono' ? 'STORE' : 'Plugin Store'}
           </h1>
        </div>
      </div>

      {loading && <p className="text-[10px] uppercase tracking-widest text-text-muted animate-pulse px-2">Loading repositories...</p>}
      {error && <p className="text-red-400 text-[10px] uppercase tracking-widest bg-red-900/20 p-4 border border-red-500/20 th-card mx-2">{error}</p>}
      
      <div className="space-y-3 flex-1 overflow-y-auto px-1">
        {!loading && plugins.length === 0 && <p className="text-[10px] uppercase tracking-widest text-text-muted">No plugins found. Add a repository in settings.</p>}
        {plugins.map((p) => {
          const isInstalled = installedPlugins.some(ip => ip.id === p.id);
          return (
            <div key={p.id} className="bg-surface-card p-5 th-border border-border-subtle flex items-center gap-4 th-card th-shadow theme-transition">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base mb-1 truncate`}>{p.displayName}</h3>
                <p className="text-xs opacity-50 line-clamp-2 mb-2">{p.description}</p>
                <p className="text-[9px] uppercase tracking-widest text-text-muted">{p.author} • v{p.version}</p>
              </div>
              <button 
                onClick={() => isInstalled ? null : installPlugin(p)}
                disabled={isInstalled}
                className={`shrink-0 flex items-center px-4 py-2.5 font-bold text-[10px] uppercase tracking-[0.15em] transition-colors outline-none th-btn ${
                  isInstalled ? 'bg-surface-elevated text-text-muted cursor-default' : 'bg-btn-bg text-btn-text'
                }`}
              >
                {isInstalled ? <><Check className="w-4 h-4 mr-1.5" /></> : <><Download className="w-4 h-4 mr-1.5" /></>}
                {isInstalled ? 'Added' : 'Install'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
