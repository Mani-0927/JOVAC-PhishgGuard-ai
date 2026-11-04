import type { Severity, TriageResult } from './types';

/** Make URLs, domains and emails non-clickable / non-resolvable for safe display. */
export function defang(text: string): string {
  return text
    .replace(/https?:\/\//gi, (m) => m.toLowerCase().replace('http', 'hxxp').replace('://', '[://]'))
    .replace(/@/g, '[@]')
    .replace(/\b([a-z0-9-]+)\.([a-z]{2,})(?=\b)/gi, '$1[.]$2');
}

/** "suspicious_link_domain" -> "Suspicious link domain" */
export function prettifyFlag(flag: string): string {
  const s = flag.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const severityStyle: Record<Severity, { badge: string; ring: string; hex: string; label: string }> = {
  High: {
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
    ring: 'border-rose-300 dark:border-rose-500/40',
    hex: '#f43f5e',
    label: 'High risk — likely phishing',
  },
  Medium: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    ring: 'border-amber-300 dark:border-amber-500/40',
    hex: '#f59e0b',
    label: 'Needs review',
  },
  Low: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    ring: 'border-emerald-300 dark:border-emerald-500/40',
    hex: '#10b981',
    label: 'Low risk',
  },
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

const HISTORY_KEY = 'phishguard.history';
const HISTORY_MAX = 100;

export function loadHistory(): TriageResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: TriageResult[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_MAX)));
}