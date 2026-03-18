export type HealthStatus = 'green' | 'amber' | 'red';
export type ReadinessStatus = 'READY' | 'AT_RISK' | 'NOT_READY';

export interface TeamProgressBreakdown {
  done: number;
  inTesting: number;
  inProgress: number;
  toDo: number;
}

export interface Team {
  id: string;
  name: string;
  healthStatus: HealthStatus;
  healthReasons: string[];
  openBugs: number;
  criticalBugs: number;
  highBugs: number;
  blockedBugs: number;
  mustFixBugs: number;
  storiesInProgress: number;
  storiesDone: number;
  storiesIncludedInCompletion: number;
  totalStories: number;
  storyProgress?: TeamProgressBreakdown;
  bugsFixedRecently: number;
  completionPercent: number;
  recommendedFocus: string[];
}

export interface Epic {
  id: string;
  key: string;
  title: string;
  status: string;
  teamId: string;
  releaseId: string;
  progressPercent: number;
  totalStories: number;
  doneStories: number;
  openBugs: number;
}

export interface Story {
  id: string;
  key: string;
  title: string;
  status: string;
  epicId: string;
  teamId: string;
  assignee?: string;
}

export interface Bug {
  id: string;
  key: string;
  title: string;
  priority: string;
  severity?: string;
  status: string;
  teamId: string;
  epicId?: string;
  releaseId?: string;
  isBlocker: boolean;
  isMustFix: boolean;
  ageDays: number;
  assignee?: string;
  labels: string[];
  components: string[];
  score: number;
  source?: string;
}

export interface Release {
  id: string;
  name: string;
  fixVersion: string;
  readinessStatus: ReadinessStatus;
  targetDate?: string;
  blockerCount: number;
  mustFixCount: number;
  openBugs: number;
  teamsAtRisk: number;
}

export interface DODCriteria {
  id: string;
  label: string;
  passed: boolean;
  value?: string;
  threshold?: string;
}

export interface ReportData {
  lastSync: string;
  isDemoMode: boolean;
  overallReadiness: ReadinessStatus;
  overallHealth: HealthStatus;
  dodReasons?: string[];
  dodCriteria?: DODCriteria[];
  teams: Team[];
  bugs: Bug[];
  stories: Story[];
  epics: Epic[];
  releases: Release[];
  summary: ReportSummary;
  top10Bugs: Bug[];
  mustFixBugs: Bug[];
  topBugsByTeam: Record<string, Bug[]>;
}

export interface ReportSummary {
  totalBugs: number;
  openBugs: number;
  closedBugs: number;
  criticalBugs: number;
  highBugs: number;
  blockedIssues: number;
  teamsAtRisk: number;
  targetRelease?: string;
  keyBlockers: string[];
  totalIssues?: number;
  doneIssues?: number;
  completionPercent?: number;
  fixRatePercent?: number;
  storiesIncludedInCompletion?: number;
}

export interface SyncStatus {
  lastSync: string;
  status: 'success' | 'error' | 'never';
  isDemoMode: boolean;
  message?: string;
  dataQualityWarnings: string[];
  unmatchedIssues: number;
}
