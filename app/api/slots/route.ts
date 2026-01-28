import { NextRequest, NextResponse } from 'next/server';
import { storage, generateTimeSlots, isPastSlot } from '@/lib/slots';
import { validateBookingForm, validateWhatsAppNumber, generateBookingId } from '@/lib/validation';
import { createCalendarEvent } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    // Initialize storage if needed
    if (!storage.getAdminPassword()) {
      storage.initialize();
    }

    const searchParams = request.nextUrl.searchParams;
    const returnInfo = searchParams.get('info') === 'true';

    if (returnInfo) {
      const config = await storage.getGlobalConfig();
      // Combine with defaults
      const fullConfig = {
        startHour: config.startHour ?? parseInt(process.env.START_HOUR || '9'),
        endHour: config.endHour ?? parseInt(process.env.END_HOUR || '17'),
        slotDurationMinutes: config.slotDurationMinutes ?? parseInt(process.env.SLOT_DURATION_MINUTES || '60'),
        breakDurationMinutes: config.breakDurationMinutes ?? parseInt(process.env.BREAK_DURATION_MINUTES || '15'),
        numberOfDays: config.numberOfDays ?? parseInt(process.env.BOOKING_DAYS || '3'),
      };
      return NextResponse.json({ success: true, config: fullConfig });
    }

    // Generate all slots with current booking status
    const slots = await generateTimeSlots();

    // Fetch dynamic config
    const config = await storage.getGlobalConfig();
    const fullConfig = {
      startHour: config.startHour ?? parseInt(process.env.START_HOUR || '9'),
      endHour: config.endHour ?? parseInt(process.env.END_HOUR || '24'),
      slotDurationMinutes: config.slotDurationMinutes ?? parseInt(process.env.SLOT_DURATION_MINUTES || '60'),
      breakDurationMinutes: config.breakDurationMinutes ?? parseInt(process.env.BREAK_DURATION_MINUTES || '15'),
      numberOfDays: config.numberOfDays ?? parseInt(process.env.BOOKING_DAYS || '3'),
    };

    // Get unique dates and their blocked status
    const dates = [...new Set(slots.map(s => s.date))];
    const dayBlockedStatus: Record<string, boolean> = {};
    await Promise.all(dates.map(async (date) => {
      dayBlockedStatus[date] = await storage.isDayBlocked(date);
    }));

    return NextResponse.json({
      success: true,
      data: {
        slots,
        config: fullConfig,
        dayBlockedStatus,
        totalSlots: slots.length,
        availableSlots: slots.filter(s => !s.isBooked && !s.isBlocked).length,
        bookedSlots: slots.filter(s => s.isBooked).length,
      }
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize storage
    storage.initialize();

    const body = await request.json();
    const { name, email, whatsapp, joiningPreference, slotId, date, startTime, endTime, secret } = body;

    // Validate required fields
    if (!name || !email || !whatsapp || !joiningPreference || !slotId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if admin is bypassing blocks
    const isAdmin = secret && secret === storage.getAdminPassword();

    // Validate form data
    const validation = validateBookingForm(name, email, whatsapp);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Double-check slot availability (concurrency protection)
    if (await storage.isSlotBooked(date, slotId)) {
      return NextResponse.json(
        { success: false, error: 'This slot has already been booked.' },
        { status: 409 }
      );
    }

    // Server-side time validation
    if (isPastSlot(date, startTime)) {
      return NextResponse.json(
        { success: false, error: 'This slot time has already passed.' },
        { status: 400 }
      );
    }

    // Check if slot is blocked by admin (bypass if valid secret provided)
    if (!isAdmin && (await storage.isSlotBlocked(date, slotId) || await storage.isDayBlocked(date))) {
      return NextResponse.json(
        { success: false, error: 'This slot is currently unavailable for booking.' },
        { status: 403 }
      );
    }

    // Validate WhatsApp format again
    const whatsappResult = validateWhatsAppNumber(whatsapp);
    if (!whatsappResult.isValid) {
      return NextResponse.json(
        { success: false, error: whatsappResult.error },
        { status: 400 }
      );
    }

    // Try to create Google Calendar event if configured
    let meetLink = '';
    let googleEventId = '';
    try {
      const googleResult = await createCalendarEvent({
        name: name.trim(),
        email: email.trim(),
        date,
        startTime,
        endTime
      });
      if (googleResult && googleResult.meetLink) {
        meetLink = googleResult.meetLink;
        googleEventId = googleResult.eventId || '';
      }
    } catch (err) {
      console.error('Failed to create google meet:', err);
      // Don't fail the whole booking if just calendar fails
    }

    // Create booking
    const bookingId = generateBookingId();
    const bookingData = {
      id: bookingId,
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsappResult.formattedNumber!,
      joiningPreference: joiningPreference.trim(),
      bookedAt: new Date().toISOString(),
      whatsappSent: false,
      meetLink,
      googleEventId,
      slotId,
      date,
      startTime,
      endTime
    };

    // Attempt to book the slot
    const success = await storage.setBooking(date, slotId, bookingData);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to book slot. It may have been taken concurrently.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        message: 'Slot booked successfully!',
        details: {
          date,
          time: `${startTime} - ${endTime}`,
          name: bookingData.name,
          email: bookingData.email,
          whatsapp: bookingData.whatsapp
        }
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
