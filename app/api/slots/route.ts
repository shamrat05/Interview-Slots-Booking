import { NextRequest, NextResponse } from 'next/server';
import { storage, generateTimeSlots } from '@/lib/slots';
import { validateBookingForm, validateWhatsAppNumber, generateBookingId } from '@/lib/validation';

export async function GET() {
  try {
    // Initialize storage if needed
    if (!storage.getAdminPassword()) {
      storage.initialize();
    }

    // Generate all slots with current booking status
    const slots = await generateTimeSlots();

    return NextResponse.json({
      success: true,
      data: {
        slots,
        totalSlots: slots.length,
        availableSlots: slots.filter(s => !s.isBooked).length,
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
    const { name, email, whatsapp, slotId, date, startTime, endTime } = body;

    // Validate required fields
    if (!name || !email || !whatsapp || !slotId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
        { success: false, error: 'This slot has already been booked. Please choose another time.' },
        { status: 409 }
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

    // Create booking
    const bookingId = generateBookingId();
    const bookingData = {
      id: bookingId,
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsappResult.formattedNumber!,
      bookedAt: new Date().toISOString(),
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
