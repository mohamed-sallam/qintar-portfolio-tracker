import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

export type ThemeId = 'arctic' | 'obsidian' | 'emerald' | 'rose' | 'solar';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  previewColors: [string, string, string]; // [surface, accent, text]
  // ── Layout / Typography personality ──
  titleFont: 'serif' | 'sans' | 'display' | 'mono';
  titleStyle: 'italic' | 'normal';
  brandName: string;
  filterStyle: 'underline' | 'pill' | 'chip';
  summaryCardLayout: 'stacked' | 'inline'; // portfolio summary card inner layout
  showDecorativeLines: boolean; // geometric accent lines on summary card
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Clean modern · Rounded cards · Soft shadows',
    previewColors: ['#F4F6F9', '#3B82F6', '#1A2332'],
    titleFont: 'sans', titleStyle: 'normal',
    brandName: 'Qintar',
    filterStyle: 'pill',
    summaryCardLayout: 'inline',
    showDecorativeLines: false,
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Sharp luxury · Serif italic · Gold accents',
    previewColors: ['#0A0A0B', '#C5A059', '#E0E0E0'],
    titleFont: 'serif', titleStyle: 'italic',
    brandName: 'Qintar',
    filterStyle: 'underline',
    summaryCardLayout: 'stacked',
    showDecorativeLines: true,
  },
  {
    id: 'emerald',
    name: 'Emerald Vault',
    description: 'Dark forest · Display type · Glow borders',
    previewColors: ['#0B1410', '#34D399', '#D4E8DC'],
    titleFont: 'display', titleStyle: 'normal',
    brandName: 'Qintar',
    filterStyle: 'chip',
    summaryCardLayout: 'stacked',
    showDecorativeLines: false,
  },
  {
    id: 'rose',
    name: 'Rose Quartz',
    description: 'Warm blush · Pill shapes · Frosted glass',
    previewColors: ['#1A1018', '#F472B6', '#F2E0EC'],
    titleFont: 'serif', titleStyle: 'italic',
    brandName: 'Qintar',
    filterStyle: 'pill',
    summaryCardLayout: 'stacked',
    showDecorativeLines: false,
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    description: 'Brutalist · Mono type · Thick borders',
    previewColors: ['#0F0A05', '#F59E0B', '#F5E6D0'],
    titleFont: 'mono', titleStyle: 'normal',
    brandName: 'QINTAR',
    filterStyle: 'chip',
    summaryCardLayout: 'inline',
    showDecorativeLines: false,
  },
];

interface ThemeContextValue {
  theme: ThemeId;
  meta: ThemeMeta;
  setTheme: (id: ThemeId) => Promise<void>;
}

const defaultMeta = THEMES[0]; // Arctic is now first/default

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'arctic',
  meta: defaultMeta,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const savedTheme = useLiveQuery(() => db.appSettings.get('theme'));
  const [theme, setThemeState] = useState<ThemeId>('arctic');

  useEffect(() => {
    if (savedTheme?.value) {
      setThemeState(savedTheme.value as ThemeId);
    }
  }, [savedTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = async (id: ThemeId) => {
    setThemeState(id);
    document.documentElement.setAttribute('data-theme', id);
    await db.appSettings.put({ key: 'theme', value: id });
  };

  const meta = THEMES.find(t => t.id === theme) || defaultMeta;

  return (
    <ThemeContext.Provider value={{ theme, meta, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Helper: returns the correct font class for the current theme's heading style */
export function useHeadingClasses() {
  const { meta } = useTheme();
  const fontMap = {
    serif:   'font-serif',
    sans:    'font-sans font-bold',
    display: 'font-display font-semibold',
    mono:    'font-mono font-bold',
  };
  const styleClass = meta.titleStyle === 'italic' ? 'italic' : '';
  return `${fontMap[meta.titleFont]} ${styleClass}`.trim();
}
