# Automation recipes

The automation engine is intentionally approval-friendly. Read-only actions can run automatically; paid, destructive or publishing actions should be represented by `APPROVAL_REQUIRED` until explicitly approved.

## Gmail → operations

```json
{
  "name": "Capture important Gmail",
  "trigger": { "type": "schedule", "everyMinutes": 15 },
  "actions": [
    { "type": "GMAIL_LIST", "config": { "query": "is:important newer_than:1d", "maxResults": 20 } },
    { "type": "AUDIT", "config": { "action": "gmail.capture" } }
  ]
}
```

## Drive → reporting

Use `DRIVE_LIST` to detect recently modified assets and then append selected metadata to Sheets with `SHEETS_APPEND`.

## Creator analytics

A future analytics adapter can feed YouTube/Analytics/Search Console metrics into a scheduled report. Keep source IDs and metric snapshots in the database rather than caching temporary media URLs.

## Safety rules

- Do not automatically spend money in Google Ads without an approval gate.
- Do not automatically delete Drive/Gmail/Photos data without explicit approval.
- Do not automatically publish YouTube content without explicit approval until the workflow has been tested.
- Record every automated action in `AuditLog`.
- Treat refresh-token failures as `REAUTH_REQUIRED` and stop the affected integration.

## Running an automation

1. Create it with `POST /api/automations`.
2. Set `status` to `ACTIVE`.
3. Trigger it with `POST /api/automations/run`.
4. Pass `{ "automationId": "...", "triggerData": {...} }`.

The current runner executes actions synchronously. The next scale step is moving execution to a durable worker/queue so long-running workflows can retry independently.
