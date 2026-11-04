import { motion } from 'framer-motion';
import { AlertOctagon, Copy, Flag, Mail, MailX, ShieldAlert, ShieldCheck, ShieldQuestion, Wrench } from 'lucide-react';
import type { TriageResult } from '../types';
import { defang, formatTime, prettifyFlag, severityStyle } from '../utils';
import RiskGauge from './RiskGauge';

const sevIcon = { High: ShieldAlert, Medium: ShieldQuestion, Low: ShieldCheck };

export default function VerdictCard({ result, onCopy }: { result: TriageResult; onCopy?: () => void }) {
  const sev = severityStyle[result.severity];
  const Icon = sevIcon[result.severity];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card space-y-5 border-2 ${sev.ring}`}
      aria-labelledby="verdict-title"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {result.reportId} · {formatTime(result.timestamp)}
          </p>
          <h2 id="verdict-title" className="mt-1 flex items-center gap-2 text-xl font-bold">
            <Icon className="h-6 w-6" style={{ color: sev.hex }} aria-hidden />
            {result.category}
          </h2>
          <span className={`chip mt-2 ${sev.badge}`}>
            {result.severity} · {sev.label}
          </span>
        </div>
        <button
          className="btn-ghost px-2.5 py-1.5 text-xs"
          onClick={() => {
            navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
            onCopy?.();
          }}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copy JSON
        </button>
      </header>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-around">
        <RiskGauge score={result.riskScore} color={sev.hex} />
        <div className="w-full max-w-[220px]">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">AI confidence</span>
            <span className="font-mono font-semibold">{Math.round(result.confidence * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-cyber-700">
            <motion.div className="h-full rounded-full bg-cyan-500" initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </div>

      <dl className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-cyber-800/70 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Sender (defanged)</dt>
          <dd className="break-all font-mono text-xs">{defang(result.senderAddress)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Subject</dt>
          <dd className="break-words">{result.subject}</dd>
        </div>
      </dl>

      <section>
        <h3 className="mb-1 text-sm font-semibold">Why</h3>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{result.reason}</p>
      </section>

      {result.redFlags.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Flag className="h-4 w-4 text-rose-500" aria-hidden /> Red flags
          </h3>
          <ul className="space-y-1.5">
            {result.redFlags.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                <span className="break-words font-mono text-xs leading-5">{defang(f)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.ruleFlags.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Wrench className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden /> Rule checks triggered
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.ruleFlags.map((f) => (
              <span key={f} className="chip bg-slate-100 text-slate-800 dark:bg-cyber-700 dark:text-slate-200">
                {prettifyFlag(f)}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 text-xs dark:border-cyber-700">
        {result.overriddenByRules && (
          <span className="chip bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            Rules overrode the AI verdict
          </span>
        )}
        <span className={`chip ${result.emailSent ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-cyber-700 dark:text-slate-300'}`}>
          {result.emailSent ? <Mail className="h-3.5 w-3.5" /> : <MailX className="h-3.5 w-3.5" />}
          {result.emailSent ? `Reply sent to ${result.reporterEmail}` : 'No reply email sent'}
        </span>
      </footer>
    </motion.article>
  );
}