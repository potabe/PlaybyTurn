import { auth } from '@/lib/auth/server';
import { NextRequest } from 'next/server';

const handler = auth.handler();

function createSpoofedRequest(req: NextRequest) {
  const headers = new Headers(req.headers);
  const baseUrl = process.env.NEON_AUTH_BASE_URL || process.env.NEXT_PUBLIC_NEON_AUTH_URL;
  if (baseUrl) {
    headers.set('origin', baseUrl);
  }
  return new NextRequest(req, { headers });
}

export const GET = (req: NextRequest, ctx: any) => handler.GET(createSpoofedRequest(req), ctx);
export const POST = (req: NextRequest, ctx: any) => handler.POST(createSpoofedRequest(req), ctx);
