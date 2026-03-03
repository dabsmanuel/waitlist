// app/api/admin/waitlist/[...slug]/route.ts
//
// Handles ALL paths WITH one or more segments after /waitlist:
//   GET    /api/admin/waitlist/analytics          → analytics
//   GET    /api/admin/waitlist/export             → CSV export
//   POST   /api/admin/waitlist/bulk-invite        → bulk invite
//   PATCH  /api/admin/waitlist/:id/status         → update status
//   POST   /api/admin/waitlist/:id/invite         → send single invite
//   DELETE /api/admin/waitlist/:id               → delete entry

import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../waitlist/_proxy';

type Ctx = { params: Promise<{ slug: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  return proxyRequest(req, slug, 'GET');
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  return proxyRequest(req, slug, 'POST');
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  return proxyRequest(req, slug, 'PATCH');
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  return proxyRequest(req, slug, 'DELETE');
}