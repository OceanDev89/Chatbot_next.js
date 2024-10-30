import { ipAddress } from '@vercel/functions';
import { kv } from '@vercel/kv';
import { NextFetchEvent, NextRequest } from 'next/server';
import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

import { kasadaHandler } from './utils/kasada/kasada-server';

const MAX_REQUESTS = 25;

export const { auth } = NextAuth(authConfig);

export async function botProtectionMiddleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  if (['POST', 'DELETE'].includes(request.method)) {
    const realIp = ipAddress(request) ?? 'no-ip';
    const pipeline = kv.pipeline();
    pipeline.incr(`rate-limit:${realIp}`);
    pipeline.expire(`rate-limit:${realIp}`, 60 * 60 * 24);
    const [requests] = (await pipeline.exec()) as [number];

    /*
     * NOTE: Do not pass server actions through bot protection
     */

    if (request.nextUrl.pathname === '/') {
      return undefined;
    }

    if (process.env.NODE_ENV === 'development') {
      return undefined;
    }

    /*
     * TODO: Rate limiting is temporarily disabled because due
     * to changes in header contents after upgradin to next 15, will have
     * to re-implement.
     */

    // if (requests > MAX_REQUESTS) {
    //   return new Response('Too many requests', { status: 429 });
    // }

    return kasadaHandler(request, event);
  }
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const response = await botProtectionMiddleware(request, event);
  if (response) return response;

  // @ts-expect-error type mismatch
  return auth(request, event);
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
