# TruePlatform Quality Report – Solution Design

## 1. Project Architecture

```
quality-report/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard
│   │   ├── layout.tsx
│   │   ├── teams/
│   │   ├── bugs/
│   │   ├── releases/
│   │   ├── epics/
│   │   ├── settings/
│   │   ├── sync/
│   │   └── api/
│   ├── lib/
│   │   ├── jira/               # Jira client & sync
│   │   ├── models/             # Data models & normalization
│   │   ├── benchmarks/         # Health & readiness logic
│   │   └── config/             # Config loading
│   └── components/
├── data/                       # SQLite or JSON cache
├── config/                     # Config files (benchmarks, mappings)
└── public/
```

**Stack:**
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Next.js API routes
- **Storage:** JSON file cache for MVP (easy to swap to SQLite/Postgres later)
- **Config:** JSON files + env vars

---

## 2. Page Structure

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Executive overview, release readiness, team health, top bugs |
| Teams | `/teams` | List teams; `/teams/[id]` team detail |
| Bugs | `/bugs` | Searchable bug table, must-fix, top critical |
| Releases | `/releases` | Release readiness by version |
| Epics | `/epics` | Epic progress and risk |
| Settings | `/settings` | Jira config, thresholds, team/release mapping |
| Data Sync | `/sync` | Last sync, status, data quality |

---

## 3. Data Model

### Core Entities

```
Team
  - id, name
  - projectKeys[], componentNames[], labels[]
  - healthStatus, healthReasons

Epic
  - id, key, title, status
  - teamId, releaseId
  - progressPercent, storyCounts

Story
  - id, key, title, status
  - epicId, teamId
  - assignee

Bug
  - id, key, title, priority, severity
  - status, teamId, epicId, releaseId
  - isBlocker, isMustFix, ageDays
  - assignee, labels, components

Release
  - id, name, fixVersion
  - readinessStatus, targetDate
  - blockerCount, mustFixCount

HealthStatus: 'green' | 'amber' | 'red'
ReadinessStatus: 'READY' | 'AT_RISK' | 'NOT_READY'
```

### Issue-to-Team Mapping (fallback order)
1. Custom field `team` or `Team`
2. Component → team mapping
3. Project key → team mapping
4. Label → team mapping
5. Default: "Unassigned"

### Issue-to-Release Mapping
1. `fixVersion` from Jira
2. Release name mapping config
3. Epic link to release

---

## 4. Jira Sync Approach

- **Endpoint:** `POST /api/sync` (manual) + optional cron
- **Flow:** Fetch issues via JQL pagination → normalize → write to `data/cache.json`
- **JQL:** `JIRA_JQL_BASE` + project filter, e.g. `project IN (TP) AND type IN (Bug, Story, Epic)`
- **Fields:** key, summary, status, priority, issuetype, assignee, components, labels, fixVersions, created, updated, resolution, custom fields
- **Demo mode:** If `JIRA_BASE_URL` or `JIRA_API_TOKEN` missing → use `data/demo-data.json`

---

## 5. Benchmark Logic Model

### Config Structure (`config/benchmarks.json`)

```json
{
  "priorities": {
    "critical": ["Blocker", "Critical"],
    "high": ["High"],
    "medium": ["Medium"],
    "low": ["Low"]
  },
  "statuses": {
    "done": ["Done", "Closed", "Resolved"],
    "inProgress": ["In Progress", "Open"],
    "blocked": ["Blocked"]
  },
  "teamHealth": {
    "red": [
      { "rule": "blockerExists", "value": true },
      { "rule": "criticalBugs", "op": ">", "value": 0 },
      { "rule": "highBugs", "op": ">", "value": 5 },
      { "rule": "mustFixUnresolved", "value": true },
      { "rule": "completionPercent", "op": "<", "value": 70 }
    ],
    "amber": [
      { "rule": "highBugs", "op": "between", "min": 1, "max": 5 },
      { "rule": "completionPercent", "op": "between", "min": 70, "max": 90 }
    ],
    "green": [
      { "rule": "noBlocker" },
      { "rule": "noCritical" },
      { "rule": "mustFixResolved" },
      { "rule": "completionPercent", "op": ">=", "value": 90 }
    ]
  },
  "releaseReadiness": {
    "NOT_READY": ["blockerExists", "criticalBugs>0", "mustFixUnresolved"],
    "AT_RISK": ["highBugs>5", "teamsAtRisk>0"],
    "READY": ["allGreen"]
  },
  "mustFixRules": [
    { "type": "priority", "values": ["Blocker", "Critical"] },
    { "type": "label", "contains": "release-blocker" },
    { "type": "component", "contains": "trueplatform-core" }
  ],
  "bugScoring": {
    "priority": { "Blocker": 100, "Critical": 80, "High": 50, "Medium": 20, "Low": 5 },
    "severity": { "Critical": 30, "Major": 20, "Minor": 10 },
    "ageWeight": 0.5,
    "unassignedPenalty": 10
  }
}
```

---

## 6. Config Inputs Needed From You

Before connecting to live Jira, you will need to provide:

| Input | Required | Description |
|-------|----------|-------------|
| `JIRA_BASE_URL` | Yes | e.g. `https://yourcompany.atlassian.net` |
| `JIRA_EMAIL` | Yes | Your Jira account email |
| `JIRA_API_TOKEN` | Yes | Create at https://id.atlassian.com/manage-profile/security/api-tokens |
| `JIRA_PROJECT_KEYS` | Yes | Comma-separated, e.g. `TP,TRUEPLATFORM` |
| `JIRA_JQL_BASE` | No | Optional base JQL, e.g. `labels = trueplatform` |
| Team mapping | No | JSON: project/component/label → team name |
| Release mapping | No | fixVersion values → release display names |
| Must-fix rules | No | Override in config/benchmarks.json |
| Target release date | No | For display on dashboard |

**Demo mode:** If credentials are missing, the app uses sample data and runs fully locally.
