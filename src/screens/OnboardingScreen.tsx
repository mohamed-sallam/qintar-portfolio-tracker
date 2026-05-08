import { useState } from 'react';
import { db } from '@/src/lib/db';
import { useTheme, useHeadingClasses } from '@/src/lib/ThemeContext';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'EGP', 'JPY', 'INR', 'CAD'];

export function OnboardingScreen() {
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const { meta } = useTheme();
  const headingCls = useHeadingClasses();

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await db.appSettings.put({ key: 'preferred_currency', value: currency });
      await db.pluginRepos.put({ 
        url: window.location.origin + '/api/plugins/repo.json', 
        name: 'Starter Plugins Repo',
        lastFetched: Date.now()
      });
      await db.appSettings.put({ key: 'onboarding_done', value: 'true' });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-base text-text-primary p-6 font-sans">
      <div className="w-16 h-16 border border-border-muted flex items-center justify-center mb-8" style={{ borderRadius: meta.titleFont === 'mono' ? '0' : '999px' }}>
        <span className={`${headingCls} text-2xl`}>
          {meta.titleFont === 'mono' ? '>' : 'S'}
        </span>
      </div>
      <h1 className={`text-4xl ${headingCls} mb-4 tracking-tight`}>
        {meta.brandName}
      </h1>
      <p className="text-text-muted mb-10 text-center max-w-xs text-sm leading-relaxed">
        {meta.titleFont === 'mono'
          ? 'Initialize local asset tracker. Select primary currency.'
          : 'Secure, local-first asset tracking. Select your primary accounting currency to initialize.'
        }
      </p>
      
      <div className="w-full max-w-xs mb-10 border-b border-border-muted pb-2">
        <label className="block text-[9px] uppercase tracking-[0.3em] text-text-muted mb-3">
          {meta.titleFont === 'mono' ? '> CURRENCY' : 'Primary Currency'}
        </label>
        <select 
          value={currency} 
          onChange={e => setCurrency(e.target.value)}
          className={`w-full bg-transparent border-none outline-none focus:ring-0 ${headingCls} text-2xl pl-0 text-text-primary`}
        >
          {CURRENCIES.map(c => <option key={c} value={c} className="bg-surface-elevated text-base font-sans font-normal not-italic">{c}</option>)}
        </select>
      </div>

      <button 
        onClick={completeOnboarding}
        disabled={loading}
        className="bg-btn-bg text-btn-text text-[11px] uppercase tracking-[0.3em] font-bold py-4 px-10 hover:bg-accent transition-colors outline-none th-btn"
      >
        {loading ? 'Initializing...' : (meta.titleFont === 'mono' ? 'INITIALIZE' : 'Enter Archive')}
      </button>
    </div>
  );
}
