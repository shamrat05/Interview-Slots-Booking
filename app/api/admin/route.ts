import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';
import { formatTimeToAMPM } from '@/lib/utils';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    // Initialize storage
    storage.initialize();

    // Check for admin authentication
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (!adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin password
    const storedPassword = storage.getAdminPassword();
    if (adminSecret !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    // Performance cleanup: Remove passed bookings to save space
    await storage.cleanupPassedBookings();

    // Fetch all bookings
    const allBookings = await storage.getAllBookings();
    const bookings: Array<{
      id: string;
      slotId: string;
      name: string;
      email: string;
      whatsapp: string;
      joiningPreference: string;
      slotDate: string;
      slotTime: string;
      slotEndTime: string;
      bookedAt: string;
      whatsappSent: boolean;
      meetLink: string;
      googleEventId: string;
      _rawStartTime: string;
      _rawEndTime: string;
    }> = [];

    allBookings.forEach((dateBookings, date) => {
      dateBookings.forEach((bookingData, slotId) => {
        const booking = bookingData as any;
        
        // Fallback for startTime/endTime if missing (legacy data)
        let rawStartTime = booking.startTime || '';
        let rawEndTime = booking.endTime || '';
        
        if (!rawStartTime && booking.slotId) {
          const parts = booking.slotId.split(':');
          if (parts.length > 1) {
            rawStartTime = parts[1].replace('-', ':');
          }
        }

        bookings.push({
          id: booking.id,
          slotId: booking.slotId,
          name: booking.name,
          email: booking.email,
          whatsapp: booking.whatsapp,
          joiningPreference: booking.joiningPreference || 'Not provided',
          slotDate: booking.date,
          // Store raw time for sorting and logic
          _rawStartTime: rawStartTime,
          _rawEndTime: rawEndTime,
          slotTime: rawStartTime && rawEndTime 
            ? `${formatTimeToAMPM(rawStartTime)} - ${formatTimeToAMPM(rawEndTime)}`
            : rawStartTime 
              ? formatTimeToAMPM(rawStartTime)
              : 'N/A',
          slotEndTime: rawEndTime,
          bookedAt: booking.bookedAt,
          whatsappSent: !!booking.whatsappSent,
          meetLink: booking.meetLink || '',
          googleEventId: booking.googleEventId || ''
        });
      });
    });

    // Sort by date and then raw time
    bookings.sort((a, b) => {
      const dateCompare = a.slotDate.localeCompare(b.slotDate);
      if (dateCompare !== 0) return dateCompare;
      return (a as any)._rawStartTime.localeCompare((b as any)._rawStartTime);
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        totalBookings: bookings.length,
        stats: {
          total: bookings.length,
          uniqueDates: new Set(bookings.map(b => b.slotDate)).size
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Initialize storage
    storage.initialize();

    // Check for admin authentication
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (!adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin password
    const storedPassword = storage.getAdminPassword();
    if (adminSecret !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    // Get booking to delete
    const body = await request.json();
    const { date, slotId } = body;

    if (!date || !slotId) {
      return NextResponse.json(
        { success: false, error: 'Missing date or slotId' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const booking = await storage.getBooking(date, slotId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Delete Google Calendar event if exists
    const bookingData = booking as any;
    if (bookingData.googleEventId) {
      try {
        await deleteCalendarEvent(bookingData.googleEventId);
      } catch (err) {
        console.error('Failed to delete Google Calendar event:', err);
      }
    }

    // Delete the booking
    const deleted = await storage.deleteBooking(date, slotId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Initialize storage
    storage.initialize();

    // Check for admin authentication
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (!adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin password
    const storedPassword = storage.getAdminPassword();
    if (adminSecret !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    // Get booking to reschedule
    const body = await request.json();
    const { oldDate, oldSlotId, newDate, newSlotId, newStartTime, newEndTime } = body;

    if (!oldDate || !oldSlotId || !newDate || !newSlotId || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters for rescheduling' },
        { status: 400 }
      );
    }

    // Check if old booking exists
    const oldBooking = await storage.getBooking(oldDate, oldSlotId);
    if (!oldBooking) {
      return NextResponse.json(
        { success: false, error: 'Original booking not found' },
        { status: 404 }
      );
    }

    // Check if new slot is available
    if (await storage.isSlotBooked(newDate, newSlotId)) {
      return NextResponse.json(
        { success: false, error: 'New slot is already booked' },
        { status: 409 }
      );
    }

    const bookingData = oldBooking as {
      name: string;
      email: string;
      whatsapp: string;
      joiningPreference?: string;
      bookedAt: string;
      googleEventId?: string;
    };

    // Delete old calendar event if exists
    if (bookingData.googleEventId) {
      try {
        await deleteCalendarEvent(bookingData.googleEventId);
      } catch (err) {
        console.error('Failed to delete old Google Calendar event:', err);
      }
    }

    // Create new calendar event
    let meetLink = '';
    let googleEventId = '';
    try {
      const googleResult = await createCalendarEvent({
        name: bookingData.name,
        email: bookingData.email,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime
      });
      if (googleResult && googleResult.meetLink) {
        meetLink = googleResult.meetLink;
        googleEventId = googleResult.eventId || '';
      }
    } catch (err) {
      console.error('Failed to create new Google Meet for reschedule:', err);
    }

    const newBookingData = {
      ...bookingData,
      id: newSlotId,
      slotId: newSlotId,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      rescheduledAt: new Date().toISOString(),
      originalBookedAt: bookingData.bookedAt,
      joiningPreference: bookingData.joiningPreference || 'Not provided',
      meetLink,
      googleEventId
    };

    // Set new booking first
    const created = await storage.setBooking(newDate, newSlotId, newBookingData);

    if (!created) {
      return NextResponse.json(
        { success: false, error: 'Failed to create new booking slot' },
        { status: 500 }
      );
    }

    // Delete old booking
    await storage.deleteBooking(oldDate, oldSlotId);

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        oldSlot: { date: oldDate, slotId: oldSlotId },
        newSlot: { date: newDate, slotId: newSlotId, startTime: newStartTime, endTime: newEndTime }
      }
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Initialize storage
    storage.initialize();

    // Check for admin authentication
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (!adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin password
    const storedPassword = storage.getAdminPassword();
    if (adminSecret !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    // Get update data
    const body = await request.json();
    const { date, slotId, whatsappSent } = body;

    if (!date || !slotId || whatsappSent === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const booking = await storage.getBooking(date, slotId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update the booking
    const updatedBooking = {
      ...(booking as object),
      whatsappSent
    };

    const success = await storage.updateBooking(date, slotId, updatedBooking);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp status updated successfully'
    });
  } catch (error) {
    console.error('Error updating WhatsApp status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    storage.initialize();

    // Check for admin authentication
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (!adminSecret) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const storedPassword = storage.getAdminPassword();
    if (adminSecret !== storedPassword) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 403 });
    }

    const body = await request.json();
    const { action, date, slotId, meetLink: manualLink } = body;

    if (action === 'generate-meet') {
      const booking = await storage.getBooking(date, slotId);
      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const bookingData = booking as any;
      
      // Create new event
      const googleResult = await createCalendarEvent({
        name: bookingData.name,
        email: bookingData.email,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime
      });

      if (googleResult && googleResult.meetLink) {
        const updatedBooking = {
          ...bookingData,
          meetLink: googleResult.meetLink,
          googleEventId: googleResult.eventId
        };
        await storage.updateBooking(date, slotId, updatedBooking);
        return NextResponse.json({ success: true, meetLink: googleResult.meetLink });
      }
      return NextResponse.json({ success: false, error: 'Failed to generate link' });
    }

    if (action === 'manual-link') {
      if (!manualLink) return NextResponse.json({ success: false, error: 'Link is required' }, { status: 400 });
      
      const booking = await storage.getBooking(date, slotId);
      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const updatedBooking = {
        ...(booking as any),
        meetLink: manualLink
      };
      
      await storage.updateBooking(date, slotId, updatedBooking);
      return NextResponse.json({ success: true, meetLink: manualLink });
    }

    if (action === 'update-details') {
      const { name, email, whatsapp, joiningPreference } = body;
      
      const booking = await storage.getBooking(date, slotId);
      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const updatedBooking = {
        ...(booking as any),
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        joiningPreference: joiningPreference.trim()
      };
      
      await storage.updateBooking(date, slotId, updatedBooking);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' });
  } catch (error) {
    console.error('Error in admin POST action:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
