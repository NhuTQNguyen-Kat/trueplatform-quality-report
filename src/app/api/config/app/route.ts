import { NextResponse } from 'next/server';

export async function GET() {
  const targetReleaseDate = process.env.TARGET_RELEASE_DATE || '';
  const jiraBaseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, '') || 'https://katalon.atlassian.net';
  return NextResponse.json({ targetReleaseDate, jiraBaseUrl });
}
