import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string) {
  if (isNaN(value)) return `~ ${currency}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatQuantity(value: number, isWeight?: boolean) {
  if (isWeight) return value.toFixed(3) + 'g';
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

import { Capacitor, CapacitorHttp } from '@capacitor/core';

export async function universalFetch(url: string, options?: RequestInit) {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      url,
      method: options?.method || 'GET',
      headers: options?.headers as Record<string, string>,
      data: typeof options?.body === 'string' ? JSON.parse(options.body) : options?.body
    });
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      text: async () => typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
      json: async () => typeof res.data === 'string' ? JSON.parse(res.data) : res.data,
    };
  } else {
    const res = await fetch('/api/plugins/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Fetch failed: ${data.status} ${data.error || ''}`);
    return {
      ok: data.ok,
      status: data.status,
      text: async () => data.text,
      json: async () => JSON.parse(data.text),
    };
  }
}

}
