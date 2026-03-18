# TruePlatform Quality Report

A clean, decision-oriented quality reporting web application for the TruePlatform product. Connects to Jira, aggregates data, and displays release readiness, team health, and bug focus areas.

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

Without Jira credentials, the app runs in **demo mode** using sample data.

---

## Environment Variables

Create a `.env.local` file (copy from `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `JIRA_BASE_URL` | Yes (for live) | e.g. `https://yourcompany.atlassian.net` |
| `JIRA_EMAIL` | Yes (for live) | Your Jira account email |
| `JIRA_API_TOKEN` | Yes (for live) | Create at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_PROJECT_KEYS` | Yes (for live) | Comma-separated, e.g. `TP,TRUEPLATFORM` |
| `JIRA_JQL_BASE` | No | Optional base JQL, e.g. `labels = trueplatform` |
| `TARGET_RELEASE_DATE` | No | For display on dashboard |

**Demo mode:** If `JIRA_BASE_URL` or `JIRA_API_TOKEN` is empty, the app uses `data/demo-data.json`.

---

## Switching from Demo to Live Jira

1. Add `.env.local` with your Jira credentials.
2. Restart the app (`npm run dev` or `npm start`).
3. Go to **Data Sync** and click **Sync from Jira**.
4. The report will now show live data.

---

## Configuration Files

Edit these JSON files to change behavior without touching code:

| File | Purpose |
|------|---------|
| `config/benchmarks.json` | Threshold rules for team health and release readiness |
| `config/team-mapping.json` | Map Jira projects/components to team names |
| `config/release-mapping.json` | Map fix versions to release display names |

### Benchmark Logic

- **Team health (Green/Amber/Red):** Configured in `teamHealth.red`, `teamHealth.amber`, `teamHealth.green`.
- **Release readiness:** Configured in `releaseReadiness.NOT_READY`, `AT_RISK`, `READY`.
- **Must-fix bugs:** Configured in `mustFixRules` (priority, label, component).
- **Bug scoring:** Configured in `bugScoring` for top-10 / top-5 ranking.

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Executive overview, release readiness, team health, top bugs |
| Teams | `/teams` | Team list; `/teams/[id]` for team detail |
| Bugs | `/bugs` | Searchable bug table, must-fix, filters |
| Releases | `/releases` | Release readiness by version |
| Epics | `/epics` | Epic progress and risk |
| Settings | `/settings` | Config preview |
| Data Sync | `/sync` | Last sync, sync now, setup |

---

## Deployment

### Local production build

```bash
npm run build
npm start
```

### Deploy to Vercel / similar

1. Set environment variables in the hosting dashboard.
2. Deploy (e.g. `vercel deploy`).
3. Run sync via `/sync` or schedule a cron to `POST /api/sync`.

---

## Project Structure

```
quality-report/
├── config/           # benchmarks.json, team-mapping.json, release-mapping.json
├── data/             # cache.json (after sync), demo-data.json
├── src/
│   ├── app/          # Next.js pages and API routes
│   ├── components/   # UI components
│   └── lib/          # Jira client, normalization, benchmarks
└── DESIGN.md         # Solution design
```

---

## What Was Implemented

- ✅ Jira REST API integration (with demo fallback)
- ✅ Data normalization (teams, epics, stories, bugs, releases)
- ✅ Configurable benchmark rules (team health, release readiness, must-fix)
- ✅ Dashboard with release readiness, team health, top bugs
- ✅ Teams list and team detail pages
- ✅ Bugs page with filters and must-fix section
- ✅ Releases page
- ✅ Epics page
- ✅ Settings page (config preview)
- ✅ Data Sync page
- ✅ Bug trend chart (mock data)
- ✅ Demo mode when Jira not configured

## What Still Needs Your Input

- Jira credentials (JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN)
- Jira project keys (JIRA_PROJECT_KEYS)
- Optional: JQL base filter, team mapping, release mapping
- Optional: Target release date
