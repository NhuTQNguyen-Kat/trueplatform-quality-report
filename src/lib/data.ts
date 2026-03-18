import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getCachePath, getDataDir } from './config';
import type { ReportData } from './types';

export function loadCachedData(): ReportData | null {
  const cachePath = getCachePath();
  try {
    if (existsSync(cachePath)) {
      const content = readFileSync(cachePath, 'utf-8');
      return JSON.parse(content) as ReportData;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveCachedData(data: ReportData): void {
  const dir = getDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getCachePath(), JSON.stringify(data, null, 2), 'utf-8');
}
