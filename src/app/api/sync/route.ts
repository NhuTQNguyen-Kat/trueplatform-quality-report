import { NextRequest, NextResponse } from 'next/server';
import { fetchJiraIssues, isJiraConfigured } from '@/lib/jira/client';
import { normalizeIssues, buildReportData } from '@/lib/normalize';
import { saveCachedData } from '@/lib/data';
import path from 'path';
import { readFileSync, existsSync } from 'fs';

export async function POST(_req: NextRequest) {
  try {
    const demoPath = path.join(process.cwd(), 'data', 'demo-data.json');
    const hasDemo = existsSync(demoPath);

    if (isJiraConfigured()) {
      const issues = await fetchJiraIssues();
      const { bugs, stories, epics, teams, releases } = normalizeIssues(issues);
      const data = buildReportData(
        bugs,
        stories,
        epics,
        teams,
        releases,
        new Date().toISOString(),
        false
      );
      saveCachedData(data);
      return NextResponse.json({
        success: true,
        isDemoMode: false,
        lastSync: data.lastSync,
        message: `Synced ${issues.length} issues`,
      });
    }

    if (hasDemo) {
      const demo = JSON.parse(readFileSync(demoPath, 'utf-8'));
      demo.lastSync = new Date().toISOString();
      saveCachedData(demo);
      return NextResponse.json({
        success: true,
        isDemoMode: true,
        lastSync: demo.lastSync,
        message: 'Using demo data (Jira not configured)',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Jira not configured and no demo data' },
      { status: 400 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
