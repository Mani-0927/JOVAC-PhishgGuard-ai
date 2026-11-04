import { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { TriageResult } from '../types';
import { defang, formatTime, severityStyle } from '../utils';

interface Props {
  items: TriageResult[];
  onSelect: (r: TriageResult) => void;
  onDelete: (reportId: string) => void;
  onClear: () => void;
}

export default function HistoryTable({ items, onSelect, onDelete, onClear }: Props) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return s
      ? items.filter((r) => [r.subject, r.senderAddress, r.category, r.reportId, r.severity].some((v) => v.toLowerCase().includes(s)))
      : items;
  }, [items, q]);

  return (
    <section className="card" aria-labelledby="history-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="history-title" className="text-lg font-semibold">History <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({items.length})</span></h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" aria-hidden />
            <label htmlFor="history-search" className="sr-only">Search history</label>
            <input id="history-search" className="input w-56 pl-8" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {items.length > 0 && (
            <button className="btn-ghost" onClick={() => confirm('Clear all history on this device?') && onClear()}>
              Clear
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{items.length ? 'No matches.' : 'No reports yet. Analyze an email to see it here.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-2 py-2 font-medium">Time</th>
                <th className="px-2 py-2 font-medium">Sender</th>
                <th className="px-2 py-2 font-medium">Subject</th>
                <th className="px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 font-medium">Risk</th>
                <th className="px-2 py-2 font-medium">Severity</th>
                <th className="px-2 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-cyber-700">
              {filtered.map((r) => (
                <tr key={r.reportId} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-cyber-800/60" onClick={() => onSelect(r)}>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-600 dark:text-slate-400">{formatTime(r.timestamp)}</td>
                  <td className="max-w-[180px] truncate px-2 py-2 font-mono text-xs">{defang(r.senderAddress)}</td>
                  <td className="max-w-[240px] truncate px-2 py-2">
                    <button className="truncate text-left hover:underline" onClick={(e) => { e.stopPropagation(); onSelect(r); }}>{r.subject}</button>
                  </td>
                  <td className="px-2 py-2">{r.category}</td>
                  <td className="px-2 py-2 font-mono font-semibold" style={{ color: severityStyle[r.severity].hex }}>{r.riskScore}</td>
                  <td className="px-2 py-2"><span className={`chip ${severityStyle[r.severity].badge}`}>{r.severity}</span></td>
                  <td className="px-2 py-2 text-right">
                    <button aria-label={`Delete report ${r.reportId}`} className="rounded p-1 text-slate-500 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); onDelete(r.reportId); }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}