// app/api/waitlist/route.ts
// Next.js App Router API route — proxies to your Express backend

import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from './_proxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers.get('x-forwarded-for') || ''
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error('[Waitlist API] POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Service unavailable. Please try again.' },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyRequest(req, [], 'GET');
}