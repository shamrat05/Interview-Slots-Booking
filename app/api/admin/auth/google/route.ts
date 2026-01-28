import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';
import { storage } from '@/lib/slots';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (!secret) {
    return NextResponse.json({ error: 'Secret required' }, { status: 401 });
  }

  storage.initialize();
  if (secret !== storage.getAdminPassword()) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }

  const url = getAuthUrl(secret);
  return NextResponse.redirect(url);
}
