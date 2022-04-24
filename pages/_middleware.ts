import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { serializeDate } from '../lib/utils';

export function middleware(request: NextRequest): NextResponse {
  return request.nextUrl.pathname == '/'
    ? NextResponse.redirect(
        new URL(`/view/week/date/${serializeDate(new Date())}`, request.url)
      )
    : NextResponse.next();
}

/*
 * TODO: deploy to vercel
 * TODO: record a video review
 * TODO: write an overview and add to portfolio
 * TODO: add a link to portfolio to readme
 * TODO: add project screenshots
 * TODO: add project URL
 * TODO: export database schema to schema.sql
 */
