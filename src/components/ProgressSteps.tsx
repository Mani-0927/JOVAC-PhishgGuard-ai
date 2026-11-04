import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Check, FileSpreadsheet, Loader2, ScanSearch, Upload } from 'lucide-react';

const STEPS = [
  { label: 'Submitting report', icon: Upload, at: 0 },
  { label: 'Running rule checks', icon: ScanSearch, at: 1500 },
  { label: 'AI classification', icon: Brain, at: 3500 },
  { label: 'Logging & notifying', icon: FileSpreadsheet, at: 12000 },
];

/** n8n returns one response at the end, so step progress is time-based (an estimate). */
export default function ProgressSteps({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(t);
  }, [active]);

  const current = STEPS.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);

  return (
    <div className="card" aria-live="polite">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analyzing</h2>
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{(elapsed / 1000).toFixed(0)}s</span>
      </div>
      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const done = i < current;
          const isActive = i === current;
          const Icon = s.icon;
          return (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isActive
                      ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                      : 'border-slate-300 text-slate-500 dark:border-cyber-700 dark:text-slate-400'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={`text-sm ${isActive ? 'font-semibold' : done ? '' : 'text-slate-500 dark:text-slate-400'}`}>{s.label}</span>
            </motion.li>
          );
        })}
      </ol>
      {elapsed > 30000 && (
        <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">The AI model is responding slowly. Hang tight…</p>
      )}
    </div>
  );
}