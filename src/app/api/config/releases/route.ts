import { NextResponse } from 'next/server';
import { getReleaseMapping } from '@/lib/config';

export async function GET() {
  try {
    const config = getReleaseMapping();
    return NextResponse.json(config);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}
