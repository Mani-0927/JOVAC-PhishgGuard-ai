export type Severity = 'High' | 'Medium' | 'Low';

export interface TriageRequest {
  reporterEmail: string;
  senderAddress: string;
  subject: string;
  emailBody: string;
}

export interface TriageResult {
  reportId: string;
  timestamp: string;
  reporterEmail: string;
  senderAddress: string;
  subject: string;
  category: string;
  confidence: number; // 0..1
  riskScore: number; // 0..100
  severity: Severity;
  redFlags: string[];
  reason: string;
  ruleFlags: string[];
  overriddenByRules: boolean;
  emailSent: boolean;
}

export interface Settings {
  webhookUrl: string;
  timeoutSec: number;
  retries: number;
}