import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';

export async function GET(request: NextRequest) {
  try {
    storage.initialize();
    
    // Check auth
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');
    if (!adminSecret || adminSecret !== storage.getAdminPassword()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const config = await storage.getGlobalConfig();
    const googleToken = await storage.getGoogleToken();
    
    // Return combined config (Dynamic + Defaults from env)
    const fullConfig = {
      startHour: config.startHour ?? parseInt(process.env.START_HOUR || '9'),
      endHour: config.endHour ?? parseInt(process.env.END_HOUR || '24'),
      slotDurationMinutes: config.slotDurationMinutes ?? parseInt(process.env.SLOT_DURATION_MINUTES || '60'),
      breakDurationMinutes: config.breakDurationMinutes ?? parseInt(process.env.BREAK_DURATION_MINUTES || '15'),
      numberOfDays: config.numberOfDays ?? parseInt(process.env.BOOKING_DAYS || '3'),
      whatsappTemplate: config.whatsappTemplate ?? 'Hello {name}, your interview with LevelAxis is confirmed for {day}, {date} at {time}. Video Link: {link}',
    };

    return NextResponse.json({ 
      success: true, 
      data: fullConfig,
      isGoogleConnected: !!googleToken
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    storage.initialize();
    
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');
    if (!adminSecret || adminSecret !== storage.getAdminPassword()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await storage.deleteGoogleToken();
    return NextResponse.json({ success: true, message: 'Google account disconnected' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to disconnect' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    storage.initialize();
    
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');
    if (!adminSecret || adminSecret !== storage.getAdminPassword()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startHour, endHour, slotDurationMinutes, breakDurationMinutes, numberOfDays, whatsappTemplate } = body;

    // Basic validation
    if (startHour >= endHour) {
      return NextResponse.json({ success: false, error: 'Start hour must be before end hour' }, { status: 400 });
    }

    const success = await storage.setGlobalConfig({
      startHour: Number(startHour),
      endHour: Number(endHour),
      slotDurationMinutes: Number(slotDurationMinutes),
      breakDurationMinutes: Number(breakDurationMinutes),
      numberOfDays: Number(numberOfDays),
      whatsappTemplate: whatsappTemplate || ''
    });

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
