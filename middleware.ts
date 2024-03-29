import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { serializeDate } from './lib/utils';

export function middleware(request: NextRequest): NextResponse {
  return request.nextUrl.pathname == '/'
    ? NextResponse.redirect(
        new URL(`/view/week/date/${serializeDate(new Date())}`, request.url),
      )
    : NextResponse.next();
}
