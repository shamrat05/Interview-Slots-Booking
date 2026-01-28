import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';
import { storage } from '@/lib/slots';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const secret = searchParams.get('state'); // We passed secret in 'state'

  if (!code || !secret) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?error=google_auth_failed`);
  }

  try {
    storage.initialize();
    const tokens = await getTokensFromCode(code);
    
    if (tokens.refresh_token) {
      await storage.setGoogleToken(tokens.refresh_token);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?google_auth=success`);
    } else {
      // Sometimes Google doesn't return refresh token if already authorized
      // This is why we used 'prompt: consent' in getAuthUrl
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?error=no_refresh_token`);
    }
  } catch (error) {
    console.error('Google Auth Callback Error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?error=google_auth_exception`);
  }
}
