import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  return request.nextUrl.pathname == '/settings/calendars'
    ? NextResponse.redirect(new URL('/settings/calendars/add', request.url))
    : NextResponse.next();
}
