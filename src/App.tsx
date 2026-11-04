import { useCallback, useEffect, useRef, useState } from 'react';
import { History, Moon, Radar, Settings as SettingsIcon, ShieldHalf, Sun } from 'lucide-react';
import type { Settings, TriageRequest, TriageResult } from './types';
import { ApiError, loadSettings, saveSettings, submitTriage } from './api';
import { loadHistory, saveHistory } from './utils';
import SubmitForm from './components/SubmitForm';
import ProgressSteps from './components/ProgressSteps';
import VerdictCard from './components/VerdictCard';
import HistoryTable from './components/HistoryTable';
import SettingsModal from './components/SettingsModal';
import Toasts, { type Toast, type ToastKind } from './components/Toasts';

type Tab = 'analyze' | 'history';

export default function App() {
  const [tab, setTab] = useState<Tab>('analyze');
  const [dark, setDark] = useState(() => localStorage.getItem('phishguard.theme') !== 'light');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TriageResult[]>(loadHistory);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('phishguard.theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => saveHistory(history), [history]);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  async function handleSubmit(req: TriageRequest) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await submitTriage(req, settings, ctrl.signal);
      setResult(r);
      setHistory((h) => [r, ...h.filter((x) => x.reportId !== r.reportId)]);
      toast(r.severity === 'High' ? 'error' : 'success', `${r.category} — risk ${r.riskScore}/100`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unexpected error.';
      if (!(e instanceof ApiError && e.kind === 'aborted')) {
        setError(msg);
        toast('error', msg);
        if (e instanceof ApiError && e.kind === 'config') setSettingsOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-transparent to-slate-100 dark:to-cyber-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-cyan-600 focus:px-3 focus:py-1 focus:text-white">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-cyber-700 dark:bg-cyber-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-7 w-7 text-cyan-600 dark:text-cyan-400" aria-hidden />
            <div>
              <h1 className="text-lg font-bold leading-tight">PhishGuard</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Explainable phishing triage</p>
            </div>
          </div>
          <nav className="flex items-center gap-1" aria-label="Main">
            {([
              ['analyze', 'Analyze', Radar],
              ['history', 'History', History],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className={`btn px-3 ${tab === key ? 'bg-slate-200 dark:bg-cyber-800' : 'hover:bg-slate-100 dark:hover:bg-cyber-800/60'}`}
              >
                <Icon className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            <button onClick={() => setDark((d) => !d)} className="btn px-2.5 hover:bg-slate-100 dark:hover:bg-cyber-800/60" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => setSettingsOpen(true)} className="btn px-2.5 hover:bg-slate-100 dark:hover:bg-cyber-800/60" aria-label="Open settings">
              <SettingsIcon className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'analyze' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SubmitForm loading={loading} onSubmit={handleSubmit} />
            <div className="space-y-4">
              {loading && <ProgressSteps active={loading} />}
              {!loading && error && (
                <div role="alert" className="card border-rose-300 text-sm text-rose-700 dark:border-rose-500/40 dark:text-rose-300">
                  <p className="font-semibold">Analysis failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}
              {!loading && result && <VerdictCard result={result} onCopy={() => toast('info', 'Copied report JSON')} />}
              {!loading && !result && !error && (
                <div className="card flex h-full min-h-[300px] flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                  <Radar className="mb-3 h-10 w-10 text-cyan-600/70 dark:text-cyan-400/70" aria-hidden />
                  <p className="text-sm">Paste a suspicious email and click <strong>Analyze</strong>.</p>
                  <p className="mt-1 text-xs">Rule checks + AI classify it and explain why.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <HistoryTable
            items={history}
            onSelect={(r) => {
              setResult(r);
              setError(null);
              setTab('analyze');
            }}
            onDelete={(id) => setHistory((h) => h.filter((x) => x.reportId !== id))}
            onClear={() => setHistory([])}
          />
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => {
          setSettings(s);
          saveSettings(s);
          setSettingsOpen(false);
          toast('success', 'Settings saved');
        }}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}