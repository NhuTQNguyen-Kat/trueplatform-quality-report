import {
  getBenchmarkConfig,
  getTeamMapping,
  getReleaseMapping,
} from './config';
import type { Bug, Team, HealthStatus, ReadinessStatus } from './types';

export function resolveTeam(
  projectKey: string,
  components: string[],
  labels: string[]
): string {
  const mapping = getTeamMapping();
  if (mapping.projects[projectKey]) return mapping.projects[projectKey];
  for (const c of components) {
    if (mapping.components[c]) return mapping.components[c];
  }
  for (const l of labels) {
    if (mapping.labels[l]) return mapping.labels[l];
  }
  return projectKey;
}

export function resolveRelease(fixVersion: string | undefined): string {
  const mapping = getReleaseMapping();
  if (fixVersion && mapping.versions[fixVersion]) return mapping.versions[fixVersion];
  if (fixVersion) return fixVersion;
  return mapping.defaultRelease;
}

export function isMustFix(bug: { priority: string; labels: string[]; components: string[] }): boolean {
  const config = getBenchmarkConfig();
  for (const rule of config.mustFixRules) {
    if (rule.type === 'priority' && rule.values?.includes(bug.priority)) return true;
    if (rule.type === 'label' && rule.contains && bug.labels.some((l) => l.includes(rule.contains!))) return true;
    if (rule.type === 'component' && rule.contains && bug.components.some((c) => c.includes(rule.contains!))) return true;
  }
  return false;
}

export function computeBugScore(
  priority: string,
  severity: string | undefined,
  ageDays: number,
  isBlocker: boolean,
  isUnassigned: boolean
): number {
  const config = getBenchmarkConfig();
  const { bugScoring } = config;
  let score = bugScoring.priority[priority] ?? 10;
  if (severity) score += bugScoring.severity[severity] ?? 0;
  if (isBlocker) score += 50;
  score += Math.min(ageDays * bugScoring.ageWeight, 30);
  if (isUnassigned) score += bugScoring.unassignedPenalty;
  return Math.round(score);
}

export function computeTeamHealth(
  openBugs: number,
  criticalBugs: number,
  highBugs: number,
  mustFixUnresolved: number,
  completionPercent: number,
  hasBlocker: boolean
): { status: HealthStatus; reasons: string[] } {
  const reasons: string[] = [];
  let status: HealthStatus = 'green';

  if (hasBlocker || criticalBugs > 0 || mustFixUnresolved > 0) {
    status = 'red';
    if (hasBlocker) reasons.push('Blocker bug exists');
    if (criticalBugs > 0) reasons.push(`${criticalBugs} critical bug(s)`);
    if (mustFixUnresolved > 0) reasons.push(`${mustFixUnresolved} must-fix bug(s) unresolved`);
  } else if (highBugs > 5 || completionPercent < 70) {
    status = 'red';
    if (highBugs > 5) reasons.push(`${highBugs} high-priority bugs`);
    if (completionPercent < 70) reasons.push(`Completion at ${completionPercent}%`);
  } else if (highBugs >= 1 && highBugs <= 5) {
    status = 'amber';
    reasons.push(`${highBugs} high-priority bug(s)`);
  } else if (completionPercent >= 70 && completionPercent < 90) {
    status = 'amber';
    reasons.push(`Completion at ${completionPercent}%`);
  } else {
    status = 'green';
    reasons.push('On track');
  }
  return { status, reasons };
}

export function computeReleaseReadiness(
  teams: Team[],
  mustFixBugs: Bug[],
  criticalBugs: Bug[],
  hasBlocker: boolean
): { status: ReadinessStatus; reasons: string[] } {
  const reasons: string[] = [];
  const openMustFix = mustFixBugs.filter((b) => !['Done', 'Closed', 'Resolved'].includes(b.status));
  const openCritical = criticalBugs.filter((b) => !['Done', 'Closed', 'Resolved'].includes(b.status));

  if (hasBlocker || openCritical.length > 0 || openMustFix.length > 0) {
    if (hasBlocker) reasons.push('Blocker bug exists');
    if (openCritical.length > 0) reasons.push(`${openCritical.length} critical bug(s) open`);
    if (openMustFix.length > 0) reasons.push(`${openMustFix.length} must-fix bug(s) unresolved`);
    return { status: 'NOT_READY', reasons };
  }

  const teamsAtRisk = teams.filter((t) => t.healthStatus !== 'green').length;
  if (teamsAtRisk > 0) {
    reasons.push(`${teamsAtRisk} team(s) at risk`);
    return { status: 'AT_RISK', reasons };
  }

  return { status: 'READY', reasons: ['All teams green', 'No critical blockers'] };
}
