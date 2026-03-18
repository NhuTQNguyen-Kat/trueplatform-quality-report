import { NextResponse } from 'next/server';
import { getBenchmarkConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = getBenchmarkConfig();
    return NextResponse.json(config);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}
