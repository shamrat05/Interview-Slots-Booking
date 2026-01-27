import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';

export async function POST(request: NextRequest) {
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

    const storedPassword = storage.getAdminPassword();
    if (adminSecret !== storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, slotId, action } = body; // action: 'block' | 'unblock' | 'blockDay' | 'unblockDay'

    if (!date || (!slotId && action.startsWith('block') && !action.endsWith('Day')) || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    if (action === 'block') {
      await storage.blockSlot(date, slotId);
      return NextResponse.json({ success: true, message: 'Slot blocked' });
    } else if (action === 'unblock') {
      await storage.unblockSlot(date, slotId);
      return NextResponse.json({ success: true, message: 'Slot unblocked' });
    } else if (action === 'blockDay') {
      await storage.blockDay(date);
      return NextResponse.json({ success: true, message: 'Day blocked' });
    } else if (action === 'unblockDay') {
      await storage.unblockDay(date);
      return NextResponse.json({ success: true, message: 'Day unblocked' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage slot' },
      { status: 500 }
    );
  }
}
