// app/api/admin/waitlist/_proxy.ts
// Shared proxy logic — imported by both route files.
// The underscore prefix tells Next.js this is NOT a route file.

import { NextRequest, NextResponse } from 'next/server';

// BACKEND_API_URL already contains /api, e.g:
// https://juniorforge.onrender.com/api
// So paths here must be  /waitlist/admin/...  (no leading /api)
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export function buildUpstreamUrl(slug: string[], searchParams: URLSearchParams): string {
  const tail = slug.length > 0 ? `/${slug.join('/')}` : '';
  const qs   = searchParams.toString();
  const url  = `${BACKEND_URL}/waitlist/admin${tail}`;
  return qs ? `${url}?${qs}` : url;
}

function extractAdminToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookie = req.headers.get('cookie') || '';
  const match  = cookie.match(/(?:^|;\s*)adminToken=([^;]+)/);
  return match?.[1] || null;
}

export async function proxyRequest(
  req: NextRequest,
  slug: string[],
  method: string
): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const upstreamUrl      = buildUpstreamUrl(slug, searchParams);
  const token            = extractAdminToken(req);

  console.log(`[Admin Proxy] ${method} → ${upstreamUrl}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const init: RequestInit = { method, headers };

  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    try   { init.body = JSON.stringify(await req.json()); }
    catch { init.body = '{}'; }
  }

  try {
    const upstream    = await fetch(upstreamUrl, init);
    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('text/csv')) {
      const csv = await upstream.text();
      return new NextResponse(csv, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            upstream.headers.get('Content-Disposition') ||
            'attachment; filename="waitlist.csv"'
        }
      });
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });

  } catch (err) {
    console.error(`[Admin Proxy] upstream error:`, err);
    return NextResponse.json(
      { success: false, message: 'Upstream unavailable. Please try again.' },
      { status: 503 }
    );
  }
}