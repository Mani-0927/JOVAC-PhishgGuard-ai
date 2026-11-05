# 🛡️ PhishGuard: Agentic AI Phishing Email Triage

> Explainable phishing triage powered by rule-based checks, Gemini AI and n8n automation.

🔗 **Live Demo:** https://phishguard-ai-5ry8.onrender.com
🎥 **Demo Video:** https://drive.google.com/file/d/1MbqVFybI1TbpbEV821170xvcopjdt5_6/view?usp=sharing

---

## 📌 Overview

PhishGuard is an agentic AI system that helps users quickly check whether an email is a phishing attempt. A user submits a suspicious email through a web UI. The backend n8n workflow runs rule-based checks, classifies the email with Gemini AI, calculates a risk score, routes the case by severity, sends an alert email and logs everything to Google Sheets.

Unlike a black-box detector, PhishGuard **explains its decision** with red flags, rule flags and a plain-language reason.

## ❗ Problem

Phishing emails are one of the most common ways people lose money and credentials. Most users cannot tell a lookalike domain (`paypa1` vs `paypal`) or a manipulative message from a real one, and security teams struggle to triage reports manually.

## ✅ Solution

PhishGuard combines **deterministic rule checks** with **LLM reasoning**, so results are both reliable and explainable. If the AI is unavailable, the system falls back safely and flags the case for human review instead of failing silently.

## ✨ Features

- 📝 Simple email report form (reporter, sender, subject, body)
- 🔎 Rule checks: lookalike domains, suspicious TLDs, urgency language, credential requests
- 🤖 Gemini AI classification with category, confidence and reason
- 📊 Risk score (0-100) with animated gauge
- 🚦 Auto-routing: **High / Review / Normal**
- 🧠 Explainable output: red flags, rule flags, AI reasoning
- 🛟 Fallback model and safe default ("Needs Human Review") if AI fails
- 📧 Automatic alert email to the reporter (Gmail)
- 🗂️ Audit log of every report (Google Sheets)
- 🧾 Error logging via a dedicated error workflow
- 🔐 Defanged display of sender addresses (`user[@]domain[.]com`)
- 🕘 Scan history, dark/light theme

## 🏗️ Architecture

```
User (React UI on Vercel)
        │  POST (JSON)
        ▼
n8n Webhook ─► Normalize Input ─► Rule Checks ─► Gemini Classify
                                                   │ (error)
                                                   └─► Fallback Model
                                      ▼
                              Parse & Risk Score
                                      ▼
                           Switch / Router (High | Review | Normal)
                                      ▼
                                 Triage Result
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
              Respond to Webhook             Sheets Log ─► Auto Email
              (instant reply to UI)
```

The reply is sent to the UI first, while logging and email notification run in the background to keep the UI fast.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Hosting | Vercel |
| Automation / Backend | n8n Cloud |
| AI | Google Gemini API |
| Logging | Google Sheets |
| Notifications | Gmail |

## 📡 API Contract

**Request** `POST <n8n-webhook-url>`

```json
{
  "reporterEmail": "user@gmail.com",
  "senderAddress": "security@paypa1-verify.xyz",
  "subject": "Urgent: your account is suspended",
  "emailBody": "Click here to verify your password immediately."
}
```

**Response**

```json
{
  "reportId": "27",
  "category": "Credential Harvesting",
  "confidence": 1,
  "riskScore": 85,
  "severity": "High",
  "redFlags": ["Lookalike domain (typosquatting)", "Suspicious TLD (.xyz)", "Urgency language", "Direct credential request"],
  "reason": "The email uses a lookalike domain to impersonate a legitimate service and demands credential verification.",
  "ruleFlags": ["lookalike_or_brand_impersonating_domain", "suspicious_tld", "urgency_language", "credential_request"],
  "overriddenByRules": false
}
```

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Mani-0927/JOVAC-PhishgGuard-ai.git
cd JOVAC-PhishgGuard-ai
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
VITE_N8N_WEBHOOK_URL=https://YOUR-INSTANCE.app.n8n.cloud/webhook/YOUR-PATH
```

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

### 4. Set up the n8n backend

1. Import the workflow from `n8n-workflow/phishguard.json` into n8n.
2. Reconnect credentials: Gemini API key, Google Sheets, Gmail.
3. Create a Google Sheet with the log headers (Timestamp, Reporter, Sender, Subject, Category, Confidence, Risk Score, Severity, Red Flags, Reason, Rule Flags, Overridden).
4. In the Webhook node set method to `POST`, Respond to `Using 'Respond to Webhook' Node`, and add your site under Options → Allowed Origins.
5. Publish the workflow and copy the **Production URL**.

### 5. Deploy the frontend

Push to GitHub, create a Static Site on Render from the repo, set the build command to `npm run build` and publish directory to `dist`, add `VITE_N8N_WEBHOOK_URL` as an environment variable, then deploy (redeploy after any env change).

## 📸 Screenshots

### Submit Report and Result
<img width="800" alt="PhishGuard UI" src="https://github.com/user-attachments/assets/877ec5ba-b667-49cf-952a-44af34fc9ecf" />

### n8n Workflow
<img width="800" alt="n8n workflow" src="https://github.com/user-attachments/assets/5ce6ff21-dd72-4fbf-8863-114335926134" />

## 🔮 Future Scope

- URL and attachment scanning (VirusTotal, WHOIS)
- Gmail/Outlook add-in for one-click reporting
- Header authentication (SPF, DKIM, DMARC) analysis
- Admin dashboard with analytics
- Multi-language phishing detection

## 👥 Team

1. Mani Sharma
2. Vishakha Shree
3. Priyanshi
4. Gaurika
