/**
 * Creates a new Confluence page based on an existing executive snapshot template
 * and refreshes dashboard-aligned bug metrics up to "today".
 */
import fs from 'fs';

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const envText = fs.readFileSync(path, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

function quoteJqlValues(jql) {
  let out = jql
    .replace(/\bAND\b/g, 'and')
    .replace(/\bOR\b/g, 'or')
    .replace(/\bIN\b/g, 'in')
    .replace(/\bNOT\b/g, 'not');
  const quoteIfNeeded = (s) => {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t;
    return `"${t}"`;
  };
  out = out.replace(/project\s*=\s*([A-Z][A-Z0-9]*)(?=\s|$|\)|and|or)/gi, 'project = "$1"');
  out = out.replace(/project\s+in\s*\(([^)]+)\)/g, (_, keys) => {
    const quoted = keys.split(',').map((k) => quoteIfNeeded(k)).join(', ');
    return `project in (${quoted})`;
  });
  out = out.replace(/type\s+in\s*\(([^)]+)\)/g, (_, vals) => {
    const quoted = vals.split(',').map((v) => quoteIfNeeded(v)).join(', ');
    return `type in (${quoted})`;
  });
  out = out.replace(/(key|parent)\s*=\s*([A-Z][A-Z0-9]+-[0-9]+)(?=\s|$|\)|and|or)/gi, '$1 = "$2"');
  out = out.replace(/key\s*!=\s*([A-Z][A-Z0-9]+-[0-9]+)(?=\s|$|\)|and|or)/gi, 'key != "$1"');
  out = out.replace(/(key|parent)\s+in\s*\(([^)]+)\)/gi, (_, field, vals) => {
    const quoted = vals.split(',').map((v) => quoteIfNeeded(v)).join(', ');
    return `${field} in (${quoted})`;
  });
  out = out.replace(/(labels|component)\s*=\s*([^\s"'][^)\s]*(?=\s|$|\)|and|or))/gi, (_, field, val) => {
    if (val.startsWith('"') || val.startsWith("'")) return `${field} = ${val}`;
    return `${field} = "${val}"`;
  });
  return out;
}

async function fetchWithJql(base, auth, jql) {
  const all = [];
  let nextPageToken;
  const fields = [
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
  ].join(',');
  while (true) {
    const params = new URLSearchParams();
    params.set('jql', quoteJqlValues(jql));
    params.set('maxResults', '100');
    params.set('fields', fields);
    if (nextPageToken) params.set('nextPageToken', nextPageToken);
    const url = `${base}/rest/api/3/search/jql?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Basic ${auth}` },
    });
    if (!res.ok) throw new Error(`Jira API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const issues = data.issues || [];
    all.push(...issues);
    nextPageToken = data.nextPageToken;
    if (!nextPageToken || issues.length < 100) break;
  }
  return all;
}

async function fetchDashboardIssues(base, auth, teamConfig) {
  const excludeKeys = new Set(teamConfig.excludeKeys || []);
  const seen = new Map();
  for (const team of teamConfig.teams || []) {
    const issues = await fetchWithJql(base, auth, team.jql);
    for (const issue of issues) {
      if (excludeKeys.has(issue.key)) continue;
      if (!seen.has(issue.key)) seen.set(issue.key, issue);
    }
  }
  return Array.from(seen.values());
}

function computeBugMetrics(issues, benchmarks) {
  const done = benchmarks.statuses.done || [];
  const excluded = benchmarks.statuses.excluded || ['Will not implement'];
  const bugs = issues.filter((i) => i.fields?.issuetype?.name === 'Bug');

  const closedBugs = bugs.filter((b) => done.includes(b.fields?.status?.name || ''));
  const openBugs = bugs.filter(
    (b) => !done.includes(b.fields?.status?.name || '') && !excluded.includes(b.fields?.status?.name || '')
  );
  const excludedBugs = bugs.filter((b) => excluded.includes(b.fields?.status?.name || ''));

  const totalBugs = bugs.length;
  const fixRatePercent = totalBugs > 0 ? Math.round((closedBugs.length / totalBugs) * 1000) / 10 : 0;
  const kpiTotalAfterExclusion = totalBugs - excludedBugs.length;

  return {
    totalBugs,
    openBugs: openBugs.length,
    closedBugs: closedBugs.length,
    excludedCount: excludedBugs.length,
    kpiTotalAfterExclusion,
    fixRatePercent,
    fixRateLabel: `${fixRatePercent}%`,
  };
}

function replaceValueByRowLabel(body, label, newValue) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<p[^>]*>${esc}<\\/p>[\\s\\S]*?<td[^>]*>\\s*<p[^>]*>)([^<]+)(<\\/p>\\s*<\\/td>)`, 'i');
  return body.replace(re, `$1${newValue}$3`);
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function computeFixedOpen(issues, doneStatuses) {
  const done = new Set(doneStatuses || []);
  const fixed = issues.filter((i) => done.has(i.fields?.status?.name || '')).length;
  const total = issues.length;
  const open = total - fixed;
  const fixRatePercent = total > 0 ? Math.round((fixed / total) * 1000) / 10 : 0;
  return { fixed, total, open, fixRatePercent, fixRateLabel: `${fixRatePercent}%` };
}

async function fetchIssuesByJql(base, auth, jql, fields = ['status', 'issuetype']) {
  const all = [];
  let nextPageToken;
  const fieldsCsv = fields.join(',');
  while (true) {
    const params = new URLSearchParams();
    params.set('jql', quoteJqlValues(jql));
    params.set('maxResults', '100');
    params.set('fields', fieldsCsv);
    if (nextPageToken) params.set('nextPageToken', nextPageToken);
    const url = `${base}/rest/api/3/search/jql?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Basic ${auth}` },
    });
    if (!res.ok) throw new Error(`Jira API error (customer query): ${res.status} ${await res.text()}`);
    const data = await res.json();
    const issues = data.issues || [];
    all.push(...issues);
    nextPageToken = data.nextPageToken;
    if (!nextPageToken || issues.length < 100) break;
  }
  return all;
}

function replaceCustomerBugsRow(body, metrics) {
  const rowRegex =
    /(<strong>Customer Bugs<\/strong><\/p><\/td><td[^>]*><p[^>]*>)(\d+)(<\/p><\/td><td[^>]*><p[^>]*>)(\d+)(<\/p><\/td><td[^>]*><p[^>]*>)(\d+)(<\/p><\/td><td[^>]*><p[^>]*>)([^<]+)(<\/p><\/td>)/i;
  return body.replace(
    rowRegex,
    `$1${metrics.fixed}$3${metrics.total}$5${metrics.open}$7${metrics.fixRateLabel}$9`
  );
}

function extractCustomerJqlFromPageBody(body) {
  const jqlParamMatch = body.match(/<ac:parameter ac:name="jqlQuery">([\s\S]*?)<\/ac:parameter>/i);
  if (!jqlParamMatch) return null;
  return decodeHtmlEntities(jqlParamMatch[1]).trim();
}

function formatDateYmdInTz(date = new Date(), timeZone = 'Asia/Ho_Chi_Minh') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

async function main() {
  loadEnvFile('.env.local');

  const baseJira = (process.env.JIRA_BASE_URL || '').replace(/\/$/, '');
  if (!baseJira) throw new Error('Missing JIRA_BASE_URL in .env.local');
  if (!process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
    throw new Error('Missing JIRA_EMAIL or JIRA_API_TOKEN in .env.local');
  }

  const sourcePageId = process.env.CONFLUENCE_TEMPLATE_PAGE_ID || '5292261437';
  const baseWiki = `${baseJira}/wiki`;
  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  const todayYmd = formatDateYmdInTz();

  const teamConfig = JSON.parse(fs.readFileSync('config/team-jql.json', 'utf8'));
  const benchmarks = JSON.parse(fs.readFileSync('config/benchmarks.json', 'utf8'));

  const issues = await fetchDashboardIssues(baseJira, auth, teamConfig);
  const m = computeBugMetrics(issues, benchmarks);

  const getRes = await fetch(
    `${baseWiki}/rest/api/content/${sourcePageId}?expand=body.storage,title,space,ancestors`,
    { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } }
  );
  if (!getRes.ok) throw new Error(`Confluence template get failed: ${getRes.status} ${await getRes.text()}`);
  const template = await getRes.json();

  let body = template.body?.storage?.value || '';
  const templateTitle = template.title || 'True Platform Bug Analytics - Executive Snapshot';
  const dateInTitle = templateTitle.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const newTitle = dateInTitle ? templateTitle.replace(dateInTitle, todayYmd) : `${todayYmd} ${templateTitle}`;

  if (dateInTitle) {
    const dateRe = new RegExp(dateInTitle.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    body = body.replace(dateRe, todayYmd);
  }

  const existingRowRegex =
    /(<strong>Existing Bugs<\/strong><\/p><\/td><td[^>]*><p[^>]*>)(\d+)(<\/p><\/td><td[^>]*><p[^>]*>)(\d+)(<\/p><\/td><td[^>]*><p[^>]*>)(\d+)(<\/p><\/td><td[^>]*><p[^>]*>)([^<]+)(<\/p><\/td>)/i;
  body = body.replace(existingRowRegex, `$1${m.closedBugs}$3${m.totalBugs}$5${m.openBugs}$7${m.fixRateLabel}$9`);

  const customerJql = extractCustomerJqlFromPageBody(body);
  let customerMetrics = null;
  if (customerJql) {
    const customerIssues = await fetchIssuesByJql(baseJira, auth, customerJql, ['status', 'issuetype']);
    customerMetrics = computeFixedOpen(customerIssues, benchmarks.statuses.done || []);
    body = replaceCustomerBugsRow(body, customerMetrics);
  }

  body = body.replace(
    /Exclude <code>Will not implement<\/code> \(\d+ items\); fixed = Closed\/Done\/Resolved[^<]*/i,
    `Exclude <code>Will not implement</code> (${m.excludedCount} items); fixed = Closed/Done/Resolved — <em>same scope as Quality Report Dashboard (union of <code>config/team-jql.json</code>)</em>`
  );

  body = replaceValueByRowLabel(body, 'Dashboard raw total bugs', String(m.totalBugs));
  body = replaceValueByRowLabel(body, 'Dashboard open bugs', String(m.openBugs));
  body = replaceValueByRowLabel(body, 'Dashboard closed bugs', String(m.closedBugs));
  body = replaceValueByRowLabel(body, 'Excluded from KPI (<code>Will not implement</code>)', String(m.excludedCount));
  body = replaceValueByRowLabel(body, 'KPI total after exclusion', String(m.kpiTotalAfterExclusion));

  body = body.replace(/Open defects remain high at \d+\./i, `Open defects remain high at ${m.openBugs}.`);

  const createPayload = {
    type: 'page',
    title: newTitle,
    space: { key: template.space?.key },
    ancestors: template.ancestors || [],
    body: { storage: { value: body, representation: 'storage' } },
  };
  const postRes = await fetch(`${baseWiki}/rest/api/content`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });
  if (!postRes.ok) throw new Error(`Confluence create failed: ${postRes.status} ${await postRes.text()}`);
  const out = await postRes.json();

  console.log(
    JSON.stringify(
      {
        templatePageId: sourcePageId,
        title: newTitle,
        dashboardScope: 'union of config/team-jql.json (Quality Report Dashboard)',
        issuesFetched: issues.length,
        customerQueryMetrics: customerMetrics,
        metrics: m,
        url: `${baseWiki}${out._links.webui}`,
        pageId: out.id,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
