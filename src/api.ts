import type { Settings, Severity, TriageRequest, TriageResult } from './types';

export type ApiErrorKind = 'config' | 'timeout' | 'network' | 'http' | 'malformed' | 'aborted';

export class ApiError extends Error {
  constructor(message: string, public kind: ApiErrorKind, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------- Settings ----------
const SETTINGS_KEY = 'phishguard.settings';

export const DEFAULT_SETTINGS: Settings = {
  webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL ?? '',
  timeoutSec: 60,
  retries: 1,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    return { ...DEFAULT_SETTINGS, ...saved, webhookUrl: saved.webhookUrl || DEFAULT_SETTINGS.webhookUrl };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ---------- Response normalisation ----------
type Raw = Record<string, unknown>;

function pick(o: Raw, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
}
function str(v: unknown, d = ''): string {
  return v === undefined || v === null ? d : String(v);
}
function num(v: unknown, d = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : d;
}
function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  return ['true', 'yes', '1', 'y'].includes(String(v ?? '').toLowerCase());
}
function list(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[;\n|,]/).map((x) => x.trim()).filter(Boolean);
  return [];
}
function severity(v: unknown, risk: number): Severity {
  const s = String(v ?? '').toLowerCase();
  if (s.startsWith('high')) return 'High';
  if (s.startsWith('med') || s.startsWith('review')) return 'Medium';
  if (s.startsWith('low') || s.startsWith('normal')) return 'Low';
  return risk >= 70 ? 'High' : risk >= 40 ? 'Medium' : 'Low';
}

/** Maps the n8n response (contract or legacy/sheet-style keys) to TriageResult. */
export function normalizeResult(payload: unknown, req: TriageRequest): TriageResult {
  let data: unknown = Array.isArray(payload) ? payload[0] : payload;
  if (data && typeof data === 'object' && 'json' in (data as Raw)) data = (data as Raw).json;
  if (!data || typeof data !== 'object') {
    throw new ApiError('n8n returned an empty or non-JSON response.', 'malformed');
  }
  const o = data as Raw;
  const category = str(pick(o, 'category', 'Category'));
  const riskRaw = pick(o, 'riskScore', 'risk_score', 'Risk Score');
  if (!category && riskRaw === undefined) {
    throw new ApiError(
      'Response is missing "category" and "riskScore". Check that the workflow ends at "Build API Response".',
      'malformed',
    );
  }
  const riskScore = Math.min(100, Math.max(0, Math.round(num(riskRaw))));
  let confidence = num(pick(o, 'confidence', 'Confidence'));
  if (confidence > 1) confidence = confidence / 100;
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    reportId: str(pick(o, 'reportId', 'report_id'), `LOCAL-${Date.now()}`),
    timestamp: str(pick(o, 'timestamp', 'Timestamp'), new Date().toISOString()),
    reporterEmail: str(pick(o, 'reporterEmail', 'Reporter'), req.reporterEmail),
    senderAddress: str(pick(o, 'senderAddress', 'Sender'), req.senderAddress),
    subject: str(pick(o, 'subject', 'Subject'), req.subject),
    category: category || 'Unknown',
    confidence,
    riskScore,
    severity: severity(pick(o, 'severity', 'Severity'), riskScore),
    redFlags: list(pick(o, 'redFlags', 'red_flags', 'Red Flags')),
    reason: str(pick(o, 'reason', 'Reason'), 'No explanation returned.'),
    ruleFlags: list(pick(o, 'ruleFlags', 'rule_flags', 'Rule Flags')),
    overriddenByRules: bool(pick(o, 'overriddenByRules', 'overridden', 'Overridden')),
    emailSent: bool(pick(o, 'emailSent', 'email_sent')),
  };
}

// ---------- Request ----------
const RETRYABLE_STATUS = new Set([502, 503, 504]);

async function attempt(url: string, body: TriageRequest, timeoutMs: number, outer?: AbortSignal): Promise<unknown> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeoutMs);
  const onOuterAbort = () => ctrl.abort();
  outer?.addEventListener('abort', onOuterAbort);

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      if (outer?.aborted) throw new ApiError('Request cancelled.', 'aborted');
      if (timedOut) {
        throw new ApiError(
          `No response within ${Math.round(timeoutMs / 1000)}s. The AI step may be slow — the report may still finish in n8n.`,
          'timeout',
        );
      }
      throw new ApiError(
        'Could not reach n8n. Likely causes: CORS (add this site to the Webhook node "Allowed Origins"), ' +
          'the test webhook is not listening ("Listen for test event"), or you are offline.',
        'network',
      );
    }

    const text = await res.text();
    if (!res.ok) {
      let msg = `n8n responded with HTTP ${res.status}.`;
      if (res.status === 404) {
        msg = url.includes('/webhook-test/')
          ? 'Test webhook is not listening. In n8n click "Listen for test event" (one request per click), or publish and use the /webhook/ URL.'
          : 'Webhook not found. Is the workflow published and the URL correct?';
      } else if (res.status >= 500) {
        msg += ' The workflow errored — check the execution in n8n.';
      }
      throw new ApiError(msg, 'http', res.status);
    }
    if (!text.trim()) throw new ApiError('n8n returned an empty body.', 'malformed');
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError('n8n returned a non-JSON response.', 'malformed');
    }
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  }
}

/**
 * Submit an email for triage. Retries only on errors where the workflow most likely did not
 * finish (network failure, 502/503/504). Timeouts are NOT retried, to avoid duplicate sheet rows
 * and duplicate reply emails.
 */
export async function submitTriage(req: TriageRequest, settings: Settings, signal?: AbortSignal): Promise<TriageResult> {
  const url = settings.webhookUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new ApiError('Webhook URL is not set. Open Settings and paste your n8n webhook URL.', 'config');
  }
  const body: TriageRequest = {
    reporterEmail: req.reporterEmail.trim(),
    senderAddress: req.senderAddress.trim(),
    subject: req.subject.trim(),
    emailBody: req.emailBody,
  };

  let lastErr: unknown;
  for (let i = 0; i <= Math.max(0, settings.retries); i++) {
    try {
      const payload = await attempt(url, body, settings.timeoutSec * 1000, signal);
      return normalizeResult(payload, body);
    } catch (e) {
      lastErr = e;
      const retryable =
        e instanceof ApiError && (e.kind === 'network' || (e.kind === 'http' && RETRYABLE_STATUS.has(e.status ?? 0)));
      if (!retryable || i === settings.retries) break;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr instanceof ApiError ? lastErr : new ApiError(String(lastErr), 'network');
}