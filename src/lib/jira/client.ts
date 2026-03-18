import { getTeamJqlConfig } from '@/lib/config';

const JIRA_BASE = process.env.JIRA_BASE_URL?.replace(/\/$/, '') || '';
const JIRA_EMAIL = process.env.JIRA_EMAIL || '';
const JIRA_TOKEN = process.env.JIRA_API_TOKEN || '';
const PROJECT_KEYS = (process.env.JIRA_PROJECT_KEYS || 'TO,CE,KTC').split(',').map((k) => k.trim());
const JQL_BASE = process.env.JIRA_JQL_BASE || '';

export function isJiraConfigured(): boolean {
  return !!(JIRA_BASE && JIRA_EMAIL && JIRA_TOKEN);
}

function buildLegacyJql(): string {
  const projectPart = `project in (${PROJECT_KEYS.join(', ')})`;
  const typePart = 'type in (Bug, Story, Epic)';
  const parts = [projectPart, typePart];
  if (JQL_BASE) parts.unshift(`(${JQL_BASE})`);
  return parts.join(' and ');
}

export interface JiraIssue {
  key: string;
  id: string;
  fields: {
    summary?: string;
    status?: { name?: string };
    priority?: { name?: string };
    issuetype?: { name?: string };
    assignee?: { displayName?: string };
    components?: { name?: string }[];
    labels?: string[];
    fixVersions?: { name?: string }[];
    created?: string;
    updated?: string;
    resolution?: { name?: string };
    parent?: { key?: string };
    [key: string]: unknown;
  };
  _teamId?: string;
}

const SEARCH_FIELDS = [
  'summary',
  'status',
  'priority',
  'issuetype',
  'assignee',
  'components',
  'labels',
  'fixVersions',
  'created',
  'updated',
  'resolution',
  'parent',
  'issuelinks',
];

/**
 * New Jira /search/jql API requires quoted values (project keys, types, labels, etc).
 * Transforms standard JQL to API-compatible format.
 */
function quoteJqlValues(jql: string): string {
  let out = jql
    .replace(/\bAND\b/g, 'and')
    .replace(/\bOR\b/g, 'or')
    .replace(/\bIN\b/g, 'in')
    .replace(/\bNOT\b/g, 'not');

  const quoteIfNeeded = (s: string) => {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t;
    return `"${t}"`;
  };

  // project = X or project in (X, Y) - quote project keys
  out = out.replace(/project\s*=\s*([A-Z][A-Z0-9]*)(?=\s|$|\)|and|or)/gi, 'project = "$1"');
  out = out.replace(/project\s+in\s*\(([^)]+)\)/g, (_, keys) => {
    const quoted = keys.split(',').map((k: string) => quoteIfNeeded(k)).join(', ');
    return `project in (${quoted})`;
  });

  // type in (Bug, Story, Epic)
  out = out.replace(/type\s+in\s*\(([^)]+)\)/g, (_, vals) => {
    const quoted = vals.split(',').map((v: string) => quoteIfNeeded(v)).join(', ');
    return `type in (${quoted})`;
  });

  // key = X, key != X, key in (X, Y), parent = X - quote issue keys
  out = out.replace(/(key|parent)\s*=\s*([A-Z][A-Z0-9]+-[0-9]+)(?=\s|$|\)|and|or)/gi, '$1 = "$2"');
  out = out.replace(/key\s*!=\s*([A-Z][A-Z0-9]+-[0-9]+)(?=\s|$|\)|and|or)/gi, 'key != "$1"');
  out = out.replace(/(key|parent)\s+in\s*\(([^)]+)\)/gi, (_, field, vals) => {
    const quoted = vals.split(',').map((v: string) => quoteIfNeeded(v)).join(', ');
    return `${field} in (${quoted})`;
  });

  // labels = X, component = X - quote if not already quoted
  out = out.replace(/(labels|component)\s*=\s*([^\s"'][^)\s]*(?=\s|$|\)|and|or))/gi, (_, field, val) => {
    if (val.startsWith('"') || val.startsWith("'")) return `${field} = ${val}`;
    return `${field} = "${val}"`;
  });

  // Sprint = 46 (numeric) - leave as is; Sprint = "Sprint 46" - already quoted
  // fixVersion - usually already quoted in config

  return out;
}

async function fetchWithJql(jql: string): Promise<JiraIssue[]> {
  const all: JiraIssue[] = [];
  const maxResults = 100;
  let nextPageToken: string | undefined;
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  const fieldsParam = SEARCH_FIELDS.join(',');
  const normalizedJql = quoteJqlValues(jql);

  while (true) {
    const params = new URLSearchParams();
    params.set('jql', normalizedJql);
    params.set('maxResults', String(maxResults));
    params.set('fields', fieldsParam);
    if (nextPageToken) params.set('nextPageToken', nextPageToken);

    const url = `${JIRA_BASE}/rest/api/3/search/jql?${params.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });

    if (!res.ok) throw new Error(`Jira API error: ${res.status} ${await res.text()}`);

    const data = (await res.json()) as { issues?: JiraIssue[]; nextPageToken?: string };
    const issues = data.issues || [];
    all.push(...issues);

    nextPageToken = data.nextPageToken;
    if (!nextPageToken || issues.length < maxResults) break;
  }
  return all;
}

export async function fetchJiraIssues(): Promise<JiraIssue[]> {
  if (!isJiraConfigured()) return [];

  const teamConfig = getTeamJqlConfig();
  const excludeKeys = new Set(teamConfig.excludeKeys || []);
  const fallbackJql = `project in (${PROJECT_KEYS.join(', ')}) and type in (Bug, Story, Epic)`;

  if (teamConfig.teams && teamConfig.teams.length > 0) {
    const seen = new Map<string, JiraIssue>();
    let anySuccess = false;
    for (const team of teamConfig.teams) {
      try {
        const issues = await fetchWithJql(team.jql);
        anySuccess = true;
        for (const issue of issues) {
          if (excludeKeys.has(issue.key)) continue;
          if (!seen.has(issue.key)) {
            seen.set(issue.key, { ...issue, _teamId: team.id });
          }
        }
      } catch (e) {
        console.error(`JQL fetch failed for team ${team.name}:`, e);
      }
    }
    if (seen.size > 0) return Array.from(seen.values());
    if (!anySuccess) {
      try {
        const issues = await fetchWithJql(fallbackJql);
        return issues;
      } catch (e) {
        console.error('Fallback JQL also failed:', e);
      }
    }
    return Array.from(seen.values());
  }

  return fetchWithJql(fallbackJql);
}
