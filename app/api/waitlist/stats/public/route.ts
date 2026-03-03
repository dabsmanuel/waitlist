// app/api/waitlist/stats/public/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/waitlist/stats/public`, {
      next: { revalidate: 60 } // Cache for 60s — stat doesn't need to be real-time
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error('[Waitlist Stats API] GET error:', error);
    return NextResponse.json(
      { success: false, data: { totalOnWaitlist: 0 } },
      { status: 200 } // Fail silently — don't break the page
    );
  }
}