import { NextRequest, NextResponse } from 'next/server';
import { storage, formatTimeToAMPM } from '@/lib/slots';

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
      bookedAt: string;
    }> = [];

    allBookings.forEach((dateBookings, date) => {
      dateBookings.forEach((bookingData, slotId) => {
        const booking = bookingData as {
          id: string;
          slotId: string;
          name: string;
          email: string;
          whatsapp: string;
          joiningPreference: string;
          bookedAt: string;
          date: string;
          startTime: string;
          endTime: string;
        };

        bookings.push({
          id: booking.id,
          slotId: booking.slotId,
          name: booking.name,
          email: booking.email,
          whatsapp: booking.whatsapp,
          joiningPreference: booking.joiningPreference || 'Not provided',
          slotDate: booking.date,
          slotTime: `${formatTimeToAMPM(booking.startTime)} - ${formatTimeToAMPM(booking.endTime)}`,
          bookedAt: booking.bookedAt
        });
      });
    });

    // Sort by date and time
    bookings.sort((a, b) => {
      const dateCompare = a.slotDate.localeCompare(b.slotDate);
      if (dateCompare !== 0) return dateCompare;
      return a.slotTime.localeCompare(b.slotTime);
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
    if (!await storage.isSlotBooked(date, slotId)) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
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

    // Create new booking with updated slot information
    const bookingData = oldBooking as {
      name: string;
      email: string;
      whatsapp: string;
      joiningPreference?: string;
      bookedAt: string;
    };

    const newBookingData = {
      ...bookingData,
      id: newSlotId,
      slotId: newSlotId,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      rescheduledAt: new Date().toISOString(),
      originalBookedAt: bookingData.bookedAt,
      joiningPreference: bookingData.joiningPreference || 'Not provided'
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
