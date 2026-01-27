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
    
    // Return combined config (Dynamic + Defaults from env)
    const fullConfig = {
      startHour: config.startHour ?? parseInt(process.env.START_HOUR || '9'),
      endHour: config.endHour ?? parseInt(process.env.END_HOUR || '24'),
      slotDurationMinutes: config.slotDurationMinutes ?? parseInt(process.env.SLOT_DURATION_MINUTES || '60'),
      breakDurationMinutes: config.breakDurationMinutes ?? parseInt(process.env.BREAK_DURATION_MINUTES || '15'),
      numberOfDays: config.numberOfDays ?? parseInt(process.env.BOOKING_DAYS || '3'),
      whatsappTemplate: config.whatsappTemplate ?? 'Hello {name}, your interview with LevelAxis is confirmed for {day}, {date} at {time}. We look forward to seeing you!',
    };

    return NextResponse.json({ success: true, data: fullConfig });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
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
