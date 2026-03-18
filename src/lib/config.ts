import { readFileSync, existsSync } from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const DATA_DIR = path.join(process.cwd(), 'data');

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export interface BenchmarkConfig {
  priorities: { critical: string[]; high: string[]; medium: string[]; low: string[] };
  statuses: {
    done: string[];
    inProgress: string[];
    blocked: string[];
    excluded?: string[];
    inTesting?: string[];
    toDo?: string[];
    completionIncludes?: string[];
  };
  teamHealth: Record<string, unknown[]>;
  releaseReadiness: Record<string, string[]>;
  mustFixRules: { type: string; values?: string[]; contains?: string }[];
  bugScoring: {
    priority: Record<string, number>;
    severity: Record<string, number>;
    ageWeight: number;
    unassignedPenalty: number;
  };
}

export interface TeamMapping {
  projects: Record<string, string>;
  components: Record<string, string>;
  labels: Record<string, string>;
}

export interface ReleaseMapping {
  versions: Record<string, string>;
  defaultRelease: string;
}

export function getBenchmarkConfig(): BenchmarkConfig {
  return loadJson(path.join(CONFIG_DIR, 'benchmarks.json'), {
    priorities: { critical: ['Blocker', 'Critical'], high: ['High'], medium: ['Medium'], low: ['Low'] },
    statuses: { done: ['Done', 'Closed', 'Resolved'], inProgress: ['In Progress', 'Open'], blocked: ['Blocked'], excluded: ['Will not implement'], completionIncludes: ['Done', 'Closed', 'Resolved', 'Ready for Test', 'In Testing', 'In Review'] },
    teamHealth: {},
    releaseReadiness: {},
    mustFixRules: [{ type: 'priority', values: ['Blocker', 'Critical'] }],
    bugScoring: {
      priority: { Blocker: 100, Critical: 80, High: 50, Medium: 20, Low: 5 },
      severity: { Critical: 30, Major: 20, Minor: 10 },
      ageWeight: 0.5,
      unassignedPenalty: 10,
    },
  });
}

export function getTeamMapping(): TeamMapping {
  return loadJson(path.join(CONFIG_DIR, 'team-mapping.json'), {
    projects: {},
    components: {},
    labels: {},
  });
}

export function getReleaseMapping(): ReleaseMapping {
  return loadJson(path.join(CONFIG_DIR, 'release-mapping.json'), {
    versions: {},
    defaultRelease: 'TruePlatform Current',
  });
}

export function getDataDir(): string {
  return DATA_DIR;
}

export function getCachePath(): string {
  return path.join(DATA_DIR, 'cache.json');
}

export interface TeamJqlConfig {
  teams: { id: string; name: string; projectKey: string; jql: string }[];
  excludeKeys: string[];
}

export function getTeamJqlConfig(): TeamJqlConfig {
  return loadJson(path.join(CONFIG_DIR, 'team-jql.json'), {
    teams: [],
    excludeKeys: [],
  });
}
