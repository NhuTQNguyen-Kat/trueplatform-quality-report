import { NextRequest, NextResponse } from 'next/server';
import { loadCachedData } from '@/lib/data';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

function isAuthorized(req: NextRequest): boolean {
  const configuredKey = process.env.PUBLIC_SUMMARY_API_KEY?.trim();
  if (!configuredKey) return false;

  const headerKey = req.headers.get('x-summary-key')?.trim();
  const queryKey = req.nextUrl.searchParams.get('key')?.trim();
  const provided = headerKey || queryKey || '';
  return provided.length > 0 && provided === configuredKey;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cached = loadCachedData();
  const data = cached || (() => {
    const demoPath = path.join(process.cwd(), 'data', 'demo-data.json');
    if (!existsSync(demoPath)) return null;
    return JSON.parse(readFileSync(demoPath, 'utf-8'));
  })();

  if (!data) {
    return NextResponse.json({ error: 'No data available' }, { status: 404 });
  }

  return NextResponse.json({
    lastSync: data.lastSync,
    isDemoMode: data.isDemoMode,
    summary: data.summary,
  });
}
