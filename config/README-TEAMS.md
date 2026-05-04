# Team JQL Configuration – TruePlatform

The team-level JQL configuration has been set based on the current requirements.
Review and adjust where necessary.

## Teams and data sources

| Team | Project | JQL Filter |
|------|---------|------------|
| **Admin Team** | TO | fixVersion = AD.2.0.0 |
| **Manual Team** | TO | fixVersion = MT1.4.0 OR labels = test-case-generator-agent |
| **RA Team** | TO | labels = insight-agent OR parent = TO-12502 OR key = TO-16687 (exclude TO-16746) |
| **Core Team** | TO | labels = test-runner-agent OR fixVersion = Core 1.5.0 OR key IN (TO-16851, TO-17009) |
| **TestCloud Team** | KTC | Playwright report (3.3.0) + TestRunner (3.4.0) + Monitor epic 4655 (3.4.0) |
| **AI Team** | TO | All issues (board 965) |
| **CE Team** | CE | Sprint 46 |
| **WebDev Team** | CE | Sprint 47 |

## Items to confirm / adjust

1. **Katalon TestCloud project key**: Currently set to `KTC`.
   If your project key is different (e.g. `TC`, `KT`), update `config/team-jql.json` in team `testcloud-team` for both `projectKey` and JQL.

2. **Epic Monitor (4655)**: Currently using `parent = KTC-4655 OR key = KTC-4655`.
   If the epic key is different (e.g. `TC-4655`), update the TestCloud team JQL.

3. **Sprint 46 / 47**: JQL currently uses `Sprint = "Sprint 46"` or `Sprint = 46`.
   If Jira uses a different sprint name (e.g. `"CE Sprint 46"`), update `config/team-jql.json` for CE and WebDev teams.

4. **AI Team**: Currently includes all issues in project TO.
   If board 965 has a dedicated filter (label, component, ...), add that condition to the AI team JQL.

## How to run sync

1. Ensure `.env.local` contains `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.
2. Go to **Data Sync** → **Sync from Jira**.
3. Verify data on the Dashboard and Teams/Bugs pages.
