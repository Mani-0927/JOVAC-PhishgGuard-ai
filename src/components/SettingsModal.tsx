import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../api';

interface Props {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (s: Settings) => void;
}

export default function SettingsModal({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(settings);
    setTimeout(() => firstRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, settings, onClose]);

  const isTest = draft.webhookUrl.includes('/webhook-test/');

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="card w-full max-w-lg space-y-4"
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="settings-title" className="text-lg font-semibold">Settings</h2>
              <button onClick={onClose} aria-label="Close settings" className="rounded p-1 hover:opacity-70"><X className="h-5 w-5" /></button>
            </div>

            <div>
              <label htmlFor="webhookUrl" className="label">n8n webhook URL</label>
              <input ref={firstRef} id="webhookUrl" className="input font-mono text-xs" value={draft.webhookUrl} onChange={(e) => setDraft({ ...draft, webhookUrl: e.target.value })} placeholder="https://<you>.app.n8n.cloud/webhook/<id>" />
              {isTest && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Test URL: works only after clicking "Listen for test event" in n8n, one request per click.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeout" className="label">Timeout (seconds)</label>
                <input id="timeout" type="number" min={10} max={300} className="input" value={draft.timeoutSec} onChange={(e) => setDraft({ ...draft, timeoutSec: Math.max(10, Number(e.target.value) || 60) })} />
              </div>
              <div>
                <label htmlFor="retries" className="label">Retries</label>
                <input id="retries" type="number" min={0} max={3} className="input" value={draft.retries} onChange={(e) => setDraft({ ...draft, retries: Math.min(3, Math.max(0, Number(e.target.value) || 0)) })} />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Retries happen only on network errors and HTTP 502/503/504, never on timeouts, to avoid duplicate log rows and reply emails.
            </p>

            <div className="flex justify-between gap-2 pt-2">
              <button className="btn-ghost" onClick={() => setDraft(DEFAULT_SETTINGS)}>Reset to .env</button>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={() => onSave(draft)}>Save</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}