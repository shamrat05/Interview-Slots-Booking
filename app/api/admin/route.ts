import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';

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
      name: string;
      email: string;
      whatsapp: string;
      slotDate: string;
      slotTime: string;
      bookedAt: string;
    }> = [];

    allBookings.forEach((dateBookings, date) => {
      dateBookings.forEach((bookingData, slotId) => {
        const booking = bookingData as {
          id: string;
          name: string;
          email: string;
          whatsapp: string;
          bookedAt: string;
          date: string;
          startTime: string;
          endTime: string;
        };
        
        bookings.push({
          id: booking.id,
          name: booking.name,
          email: booking.email,
          whatsapp: booking.whatsapp,
          slotDate: booking.date,
          slotTime: `${booking.startTime} - ${booking.endTime}`,
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
