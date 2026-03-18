import { NextResponse } from 'next/server';
import { loadCachedData } from '@/lib/data';
import path from 'path';
import { readFileSync, existsSync } from 'fs';

export async function GET() {
  try {
    const cached = loadCachedData();
    if (cached) return NextResponse.json(cached);

    const demoPath = path.join(process.cwd(), 'data', 'demo-data.json');
    if (existsSync(demoPath)) {
      const demo = JSON.parse(readFileSync(demoPath, 'utf-8'));
      return NextResponse.json(demo);
    }

    return NextResponse.json(
      { error: 'No data available. Run sync first or ensure demo data exists.' },
      { status: 404 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 });
  }
}
