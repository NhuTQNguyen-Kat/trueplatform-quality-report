import { NextResponse } from 'next/server';
import { loadCachedData } from '@/lib/data';
import { isJiraConfigured } from '@/lib/jira/client';
import path from 'path';
import { existsSync } from 'fs';

export async function GET() {
  const cached = loadCachedData();
  const demoPath = path.join(process.cwd(), 'data', 'demo-data.json');
  const hasDemo = existsSync(demoPath);

  const status = {
    lastSync: cached?.lastSync || null,
    status: cached ? 'success' : 'never',
    isDemoMode: cached?.isDemoMode ?? !isJiraConfigured(),
    message: cached ? 'Data loaded' : isJiraConfigured() ? 'Run sync to fetch data' : 'Using demo mode',
    dataQualityWarnings: [] as string[],
    unmatchedIssues: 0,
  };

  if (cached && cached.teams.length === 0 && cached.bugs.length > 0) {
    status.dataQualityWarnings.push('Some bugs may have unmapped teams');
  }

  return NextResponse.json(status);
}
