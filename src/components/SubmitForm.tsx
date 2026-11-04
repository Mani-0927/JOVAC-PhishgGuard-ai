import { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import type { TriageRequest } from '../types';

const EXAMPLES: { label: string; data: Omit<TriageRequest, 'reporterEmail'> }[] = [
  {
    label: 'Credential phish',
    data: {
      senderAddress: 'security-alert@micr0soft-support.com',
      subject: 'URGENT: Your account will be suspended in 24 hours',
      emailBody:
        'Dear user,\n\nWe detected unusual sign-in activity on your account. Verify your identity within 24 hours or your mailbox will be permanently suspended.\n\nVerify now: http://micr0soft-login.verify-account.xyz/secure\n\nMicrosoft Security Team',
    },
  },
  {
    label: 'Invoice / BEC',
    data: {
      senderAddress: 'ceo.office@company-payments.co',
      subject: 'Wire transfer needed today - confidential',
      emailBody:
        "Hi,\n\nI'm in a meeting and can't talk. Please process an urgent wire of $18,450 to our new vendor before 3 PM. Bank details are in the attached invoice. Keep this confidential until the deal closes.\n\nThanks,\nCEO",
    },
  },
  {
    label: 'Legit newsletter',
    data: {
      senderAddress: 'noreply@github.com',
      subject: 'Your monthly GitHub digest',
      emailBody:
        'Hi there,\n\nHere are the repositories trending in your network this month. You can manage email preferences in your GitHub settings at any time.\n\n— The GitHub Team',
    },
  },
];

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

interface Props {
  loading: boolean;
  onSubmit: (req: TriageRequest) => void;
}

export default function SubmitForm({ loading, onSubmit }: Props) {
  const [form, setForm] = useState<TriageRequest>({ reporterEmail: '', senderAddress: '', subject: '', emailBody: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof TriageRequest, string>>>({});

  const set = (k: keyof TriageRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): boolean {
    const e: typeof errors = {};
    if (!EMAIL_RE.test(form.reporterEmail.trim())) e.reporterEmail = 'Enter a valid email address.';
    const sender = form.senderAddress.trim().match(/<([^>]+)>/)?.[1] ?? form.senderAddress.trim();
    if (!EMAIL_RE.test(sender)) e.senderAddress = 'Enter the sender email (e.g. name@domain.com).';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (form.emailBody.trim().length < 10) e.emailBody = 'Paste the email body (at least 10 characters).';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading && validate()) onSubmit(form);
  }

  const field = (k: keyof TriageRequest) => ({
    id: k,
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `${k}-err` : undefined,
  });
  const err = (k: keyof TriageRequest) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1 text-xs text-rose-600 dark:text-rose-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Report a suspicious email</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden />
          <span className="text-xs text-slate-600 dark:text-slate-400">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, ...ex.data }));
                setErrors({});
              }}
              className="chip border border-slate-300 hover:bg-slate-100 dark:border-cyber-700 dark:hover:bg-cyber-800"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reporterEmail" className="label">Your email</label>
          <input {...field('reporterEmail')} type="email" className="input" placeholder="you@company.com" value={form.reporterEmail} onChange={set('reporterEmail')} autoComplete="email" />
          {err('reporterEmail')}
        </div>
        <div>
          <label htmlFor="senderAddress" className="label">Suspicious sender</label>
          <input {...field('senderAddress')} className="input font-mono" placeholder="sender@domain.com" value={form.senderAddress} onChange={set('senderAddress')} />
          {err('senderAddress')}
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="label">Subject</label>
        <input {...field('subject')} className="input" placeholder="Email subject line" value={form.subject} onChange={set('subject')} />
        {err('subject')}
      </div>
      <div>
        <label htmlFor="emailBody" className="label">Email body</label>
        <textarea {...field('emailBody')} rows={9} className="input font-mono text-xs leading-relaxed" placeholder="Paste the full email content, including links…" value={form.emailBody} onChange={set('emailBody')} />
        {err('emailBody')}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {loading ? 'Analyzing…' : 'Analyze email'}
      </button>
    </form>
  );
}