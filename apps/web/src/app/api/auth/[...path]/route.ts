import { auth } from '@/lib/auth/server';
import { NextRequest } from 'next/server';

const handler = auth.handler();

function createSpoofedRequest(req: NextRequest) {
  const baseUrl = process.env.NEON_AUTH_BASE_URL || process.env.NEXT_PUBLIC_NEON_AUTH_URL;
  if (!baseUrl) return req;

  const spoofedHeaders = new Headers(req.headers);
  spoofedHeaders.set('origin', baseUrl);

  return new Proxy(req, {
    get(target, prop) {
      if (prop === 'headers') return spoofedHeaders;
      const value = (target as any)[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  }) as unknown as NextRequest;
}

export const GET = (req: NextRequest, ctx: any) => handler.GET(createSpoofedRequest(req), ctx);
export const POST = (req: NextRequest, ctx: any) => handler.POST(createSpoofedRequest(req), ctx);
