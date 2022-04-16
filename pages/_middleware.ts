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
 * TODO: 2 queries with joins
 * TODO: go though all files and remove everything unused
 * TODO: deploy to vercel
 * TODO: record a video review
 * TODO: write an overview and add to portfolio
 * TODO: add screenshots to readme and a link to portfolio
 */
