// app/api/admin/waitlist/route.ts
//
// Handles the BASE path /api/admin/waitlist (no slug):
//   GET  /api/admin/waitlist          → list entries (with pagination/filters)
//   POST /api/admin/waitlist          → create entry (if needed)

import { NextRequest } from 'next/server';
import { proxyRequest } from '../../waitlist/_proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, [], 'GET');
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, [], 'POST');
}