import type { JiraIssue } from './jira/client';
import {
  resolveTeam,
  resolveRelease,
  isMustFix,
  computeBugScore,
  computeTeamHealth,
  computeReleaseReadiness,
} from './benchmarks';
import type { Bug, Story, Epic, Team, Release, ReportData, ReportSummary } from './types';
import { getBenchmarkConfig, getTeamJqlConfig } from './config';

function getProjectKey(key: string): string {
  const match = key.match(/^([A-Z]+)-/);
  return match ? match[1] : key;
}

function parseDate(d: string | undefined): Date {
  if (!d) return new Date(0);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function ageDays(created: string | undefined): number {
  const createdDate = parseDate(created);
  return Math.floor((Date.now() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
}

export function normalizeIssues(issues: JiraIssue[]): {
  bugs: Bug[];
  stories: Story[];
  epics: Epic[];
  teams: Team[];
  releases: Release[];
} {
  const config = getBenchmarkConfig();
  const bugs: Bug[] = [];
  const stories: Story[] = [];
  const epics: Epic[] = [];
  const teamMap = new Map<string, Team>();
  const releaseMap = new Map<string, Release>();

  const teamJql = getTeamJqlConfig();
  const teamById = new Map<string, { id: string; name: string }>();
  for (const t of teamJql.teams || []) {
    teamById.set(t.id, { id: t.id, name: t.name });
  }

  const completionIncludes = config.statuses.completionIncludes || config.statuses.done;
  const inTestingStatuses = config.statuses.inTesting || [];
  const toDoStatuses = config.statuses.toDo || [];

  const getStoryProgressBucket = (status: string): 'done' | 'inTesting' | 'inProgress' | 'toDo' => {
    if (config.statuses.done.includes(status)) return 'done';
    if (inTestingStatuses.includes(status)) return 'inTesting';
    if (config.statuses.inProgress.includes(status) || config.statuses.blocked.includes(status))
      return 'inProgress';
    if (toDoStatuses.includes(status)) return 'toDo';
    return 'toDo';
  };

  for (const t of teamById.values()) {
    if (!teamMap.has(t.id)) {
      teamMap.set(t.id, {
        id: t.id,
        name: t.name,
        healthStatus: 'green',
        healthReasons: [],
        openBugs: 0,
        criticalBugs: 0,
        highBugs: 0,
        blockedBugs: 0,
        mustFixBugs: 0,
        storiesInProgress: 0,
        storiesDone: 0,
        storiesIncludedInCompletion: 0,
        totalStories: 0,
        storyProgress: { done: 0, inTesting: 0, inProgress: 0, toDo: 0 },
        bugsFixedRecently: 0,
        completionPercent: 0,
        recommendedFocus: [],
      });
    }
  }

  const epicKeys = new Set<string>();
  issues.forEach((i) => {
    if (i.fields.issuetype?.name === 'Epic') epicKeys.add(i.key);
  });

  for (const issue of issues) {
    const projectKey = getProjectKey(issue.key);
    const components = (issue.fields.components || []).map((c) => c.name || '').filter(Boolean);
    const labels = issue.fields.labels || [];
    const resolvedTeam = (issue as JiraIssue & { _teamId?: string })._teamId
      ? teamById.get((issue as JiraIssue & { _teamId?: string })._teamId!)
      : null;
    const teamId = resolvedTeam?.id ?? resolveTeam(projectKey, components, labels).replace(/\s+/g, '-').toLowerCase();
    const teamName = resolvedTeam?.name ?? resolveTeam(projectKey, components, labels);
    const fixVersions = (issue.fields.fixVersions || []).map((v) => v.name || '').filter(Boolean);
    const releaseName = resolveRelease(fixVersions[0]);

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        id: teamId,
        name: teamName,
        healthStatus: 'green',
        healthReasons: [],
        openBugs: 0,
        criticalBugs: 0,
        highBugs: 0,
        blockedBugs: 0,
        mustFixBugs: 0,
        storiesInProgress: 0,
        storiesDone: 0,
        storiesIncludedInCompletion: 0,
        totalStories: 0,
        storyProgress: { done: 0, inTesting: 0, inProgress: 0, toDo: 0 },
        bugsFixedRecently: 0,
        completionPercent: 0,
        recommendedFocus: [],
      });
    }
    if (!releaseMap.has(releaseName)) {
      releaseMap.set(releaseName, {
        id: releaseName.replace(/\s+/g, '-').toLowerCase(),
        name: releaseName,
        fixVersion: fixVersions[0] || releaseName,
        readinessStatus: 'READY',
        blockerCount: 0,
        mustFixCount: 0,
        openBugs: 0,
        teamsAtRisk: 0,
      });
    }

    const status = issue.fields.status?.name || 'Unknown';
    const priority = issue.fields.priority?.name || 'Medium';
    const isDone = config.statuses.done.includes(status);
    const isBlocked = config.statuses.blocked.includes(status);
    const isCritical = config.priorities.critical.includes(priority);
    const isHigh = config.priorities.high.includes(priority);

    if (issue.fields.issuetype?.name === 'Epic') {
      epics.push({
        id: issue.id,
        key: issue.key,
        title: issue.fields.summary || 'Untitled',
        status,
        teamId,
        releaseId: releaseName.replace(/\s+/g, '-').toLowerCase(),
        progressPercent: 0,
        totalStories: 0,
        doneStories: 0,
        openBugs: 0,
      });
    } else if (issue.fields.issuetype?.name === 'Bug') {
      const parent = issue.fields.parent as { key?: string } | undefined;
      const epicId = parent?.key ? parent.key : issue.key.split('-')[0] + '-0';
      const mustFix = isMustFix({ priority, labels, components });
      const isBlocker = priority === 'Blocker' || labels.includes('blocker');
      const age = ageDays(issue.fields.created);
      const score = computeBugScore(
        priority,
        (issue.fields as { customfield_10020?: { value?: string } })?.customfield_10020?.value as string | undefined,
        age,
        isBlocker,
        !issue.fields.assignee
      );

      bugs.push({
        id: issue.id,
        key: issue.key,
        title: issue.fields.summary || 'Untitled',
        priority,
        severity: (issue.fields as { customfield_10020?: { value?: string } })?.customfield_10020?.value as string | undefined,
        status,
        teamId,
        epicId,
        releaseId: releaseName.replace(/\s+/g, '-').toLowerCase(),
        isBlocker,
        isMustFix: mustFix,
        ageDays: age,
        assignee: issue.fields.assignee?.displayName,
        labels,
        components,
        score,
      });

      const team = teamMap.get(teamId)!;
      team.openBugs += isDone ? 0 : 1;
      if (isCritical) team.criticalBugs += isDone ? 0 : 1;
      if (isHigh) team.highBugs += isDone ? 0 : 1;
      if (isBlocked) team.blockedBugs += 1;
      if (mustFix && !isDone) team.mustFixBugs += 1;

      const release = releaseMap.get(releaseName)!;
      if (!isDone) release.openBugs += 1;
      if (isBlocker && !isDone) release.blockerCount += 1;
      if (mustFix && !isDone) release.mustFixCount += 1;
    } else if (issue.fields.issuetype?.name === 'Story') {
      const parent = issue.fields.parent as { key?: string } | undefined;
      const epicId = parent?.key || '';

      stories.push({
        id: issue.id,
        key: issue.key,
        title: issue.fields.summary || 'Untitled',
        status,
        epicId,
        teamId,
        assignee: issue.fields.assignee?.displayName,
      });

      const team = teamMap.get(teamId)!;
      if (team) {
        team.totalStories += 1;
        if (config.statuses.inProgress.includes(status)) team.storiesInProgress += 1;
        if (isDone) team.storiesDone += 1;
        if (completionIncludes.includes(status)) team.storiesIncludedInCompletion += 1;
        const bucket = getStoryProgressBucket(status);
        team.storyProgress![bucket] += 1;
      }

      const epic = epics.find((e) => e.key === epicId);
      if (epic) {
        epic.totalStories += 1;
        if (completionIncludes.includes(status)) epic.doneStories += 1;
      }
    }
  }

  epicKeys.forEach((key) => {
    const epic = epics.find((e) => e.key === key);
    if (epic) {
      epic.progressPercent = epic.totalStories > 0 ? Math.round((epic.doneStories / epic.totalStories) * 100) : 0;
      epic.openBugs = bugs.filter((b) => b.epicId === key && !config.statuses.done.includes(b.status)).length;
    }
  });

  for (const team of teamMap.values()) {
    team.completionPercent =
      team.totalStories > 0
        ? Math.round((team.storiesIncludedInCompletion / team.totalStories) * 100)
        : 100;
    const hasBlocker = bugs.some((b) => b.teamId === team.id && b.isBlocker && !config.statuses.done.includes(b.status));
    const mustFixUnresolved = team.mustFixBugs;
    const { status, reasons } = computeTeamHealth(
      team.openBugs,
      team.criticalBugs,
      team.highBugs,
      mustFixUnresolved,
      team.completionPercent,
      hasBlocker
    );
    team.healthStatus = status;
    team.healthReasons = reasons;
    team.recommendedFocus = team.healthReasons.slice(0, 3);
  }

  const teams = Array.from(teamMap.values());
  const releases = Array.from(releaseMap.values());
  const openMustFix = bugs.filter((b) => b.isMustFix && !config.statuses.done.includes(b.status));
  const openCritical = bugs.filter((b) => config.priorities.critical.includes(b.priority) && !config.statuses.done.includes(b.status));
  const hasBlocker = bugs.some((b) => b.isBlocker && !config.statuses.done.includes(b.status));

  for (const r of releases) {
    const rTeams = teams.filter((t) => bugs.some((b) => b.releaseId === r.id && b.teamId === t.id));
    r.teamsAtRisk = rTeams.filter((t) => t.healthStatus !== 'green').length;
    const { status, reasons } = computeReleaseReadiness(
      rTeams,
      bugs.filter((b) => b.releaseId === r.id),
      openCritical.filter((b) => b.releaseId === r.id),
      hasBlocker
    );
    r.readinessStatus = status;
  }

  return { bugs, stories, epics, teams, releases };
}

export function buildReportData(
  bugs: Bug[],
  stories: Story[],
  epics: Epic[],
  teams: Team[],
  releases: Release[],
  lastSync: string,
  isDemoMode: boolean
): ReportData {
  const config = getBenchmarkConfig();
  const excludedStatuses = config.statuses.excluded || ['Will not implement'];
  const openBugs = bugs.filter(
    (b) => !config.statuses.done.includes(b.status) && !excludedStatuses.includes(b.status)
  );
  const closedBugs = bugs.filter((b) => config.statuses.done.includes(b.status));
  const criticalBugs = openBugs.filter((b) => config.priorities.critical.includes(b.priority));
  const highBugs = openBugs.filter((b) => config.priorities.high.includes(b.priority));
  const blockedBugs = bugs.filter((b) => config.statuses.blocked.includes(b.status));
  const mustFixBugs = bugs.filter(
    (b) =>
      b.isMustFix &&
      !config.statuses.done.includes(b.status) &&
      !excludedStatuses.includes(b.status)
  );
  const teamsAtRisk = teams.filter((t) => t.healthStatus !== 'green').length;

  // Top Critical: open only, exclude "Will not implement", focus on High/Critical priority, Critical severity, or Agent bugs
  const agentLabels = ['test-runner-agent', 'insight-agent', 'test-case-generator-agent', 'TestRunner'];
  const isAgentBug = (b: Bug) => b.labels.some((l) => agentLabels.includes(l));
  const qualifiesForTopCritical = (b: Bug) =>
    config.priorities.high.includes(b.priority) ||
    config.priorities.critical.includes(b.priority) ||
    b.severity === 'Critical' ||
    isAgentBug(b);
  const top10Bugs = openBugs
    .filter(qualifiesForTopCritical)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  const topBugsByTeam: Record<string, Bug[]> = {};
  for (const team of teams) {
    topBugsByTeam[team.id] = openBugs.filter((b) => b.teamId === team.id).sort((a, b) => b.score - a.score).slice(0, 5);
  }

  const primaryRelease = releases[0];
  const hasBlocker = bugs.some((b) => b.isBlocker && !config.statuses.done.includes(b.status));
  const { status: overallReadiness, reasons: dodReasons } = computeReleaseReadiness(
    teams,
    mustFixBugs,
    criticalBugs,
    hasBlocker
  );

  const completionIncludesForSummary =
    config.statuses.completionIncludes || config.statuses.done;
  const storiesIncludedInCompletion = stories.filter((s) =>
    completionIncludesForSummary.includes(s.status)
  ).length;
  const totalIssues = bugs.length + stories.length;
  const doneIssues = closedBugs.length + storiesIncludedInCompletion;
  const completionPercent = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;
  const fixRatePercent = bugs.length > 0 ? Math.round((closedBugs.length / bugs.length) * 1000) / 10 : 0;

  const summary: ReportSummary = {
    totalBugs: bugs.length,
    openBugs: openBugs.length,
    closedBugs: closedBugs.length,
    criticalBugs: criticalBugs.length,
    highBugs: highBugs.length,
    blockedIssues: blockedBugs.length,
    teamsAtRisk,
    targetRelease: primaryRelease?.name,
    keyBlockers: mustFixBugs.slice(0, 5).map((b) => b.key),
    totalIssues,
    doneIssues,
    completionPercent,
    fixRatePercent,
    storiesIncludedInCompletion,
  };

  const dodCriteria: import('@/lib/types').DODCriteria[] = [
    { id: 'blocker', label: 'No blocker bugs', passed: !hasBlocker, value: hasBlocker ? '1 blocker' : undefined },
    { id: 'critical', label: 'No critical bugs open', passed: criticalBugs.length === 0, value: criticalBugs.length > 0 ? `${criticalBugs.length} open` : undefined, threshold: '0' },
    { id: 'mustFix', label: 'All must-fix resolved', passed: mustFixBugs.length === 0, value: mustFixBugs.length > 0 ? `${mustFixBugs.length} unresolved` : undefined, threshold: '0' },
    { id: 'highPrio', label: 'High priority ≤ 5', passed: highBugs.length <= 5, value: `${highBugs.length}`, threshold: '≤5' },
    { id: 'teamsAtRisk', label: 'All teams green', passed: teamsAtRisk === 0, value: teamsAtRisk > 0 ? `${teamsAtRisk} at risk` : undefined, threshold: '0' },
    { id: 'completion', label: 'Completion ≥ 70%', passed: completionPercent >= 70, value: `${completionPercent}%`, threshold: '≥70%' },
  ];

  const overallHealth: 'green' | 'amber' | 'red' =
    teamsAtRisk === 0 ? 'green' : teams.some((t) => t.healthStatus === 'red') ? 'red' : 'amber';

  return {
    lastSync,
    isDemoMode,
    overallReadiness,
    overallHealth,
    dodReasons,
    dodCriteria,
    teams,
    bugs,
    stories,
    epics,
    releases,
    summary,
    top10Bugs,
    mustFixBugs,
    topBugsByTeam,
  };
}
