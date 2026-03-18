import { NextResponse } from 'next/server';
import { getTeamMapping } from '@/lib/config';

export async function GET() {
  try {
    const config = getTeamMapping();
    return NextResponse.json(config);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}
