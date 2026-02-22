# Gmail Inbox Monitor — Setup Guide

Monitors Gmail for job application emails and automatically updates HubSpot deal stages.

## Setup Steps

1. **Create Google Apps Script project** at [script.google.com](https://script.google.com)
2. **Paste `Code.gs`** contents into the script editor
3. **Add Script Properties** (Project Settings → Script Properties):
   - `HUBSPOT_TOKEN` = your HubSpot Private App Token (`pat-na1-...`)
   - `SHEET_ID` = Google Sheet ID for the audit log
4. **Create Google Sheet** named "Inbox Monitor Log" and copy its ID from the URL
5. **Create Gmail label**: `_processed/inbox-monitor`
6. **Run `testConnection()`** to verify HubSpot access
7. **Run `createTrigger()`** to set up 15-minute automated processing

## What It Does

| Email Classification | Signal Patterns | Stage Update |
|---------------------|----------------|-------------|
| Confirmation | "thank you for applying", "application received" | Saved → Applied |
| Rejection | "decided to move forward with other candidates" | Any open → Rejected |
| Interview | "schedule an interview", "phone screen" | Applied → Interviewing |
| Offer | "pleased to offer", "offer letter" | Interviewing → Offer |

## Pipeline

Pipeline ID: `1320210144`

| Stage | ID | Type |
|-------|-----|------|
| Saved | 1 | Open |
| Applied | 2 | Open |
| Interviewing | 3 | Open |
| Offer | 4 | Open |
| Accepted | 5 | Closed Won |
| Rejected | 6 | Closed Lost |
| Withdrawn | 7 | Closed Lost |
| No Response | 8 | Closed Lost |
