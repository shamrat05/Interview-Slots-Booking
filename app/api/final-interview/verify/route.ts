import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();
    
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Email or WhatsApp number is required' },
        { status: 400 }
      );
    }

    storage.initialize();
    const booking = await storage.findBookingByEmailOrPhone(identifier);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'No previous interview found for this identifier.' },
        { status: 404 }
      );
    }

    const bookingData = booking as any;

    if (!bookingData.finalRoundEligible) {
      return NextResponse.json(
        { success: false, error: 'You are not yet eligible for the final interview round. Please contact HR.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: bookingData.name,
        email: bookingData.email,
        whatsapp: bookingData.whatsapp,
        joiningPreference: bookingData.joiningPreference,
        prevBookingId: bookingData.id
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
