import { addDays, format, parse, startOfDay } from 'date-fns';
import { TimeSlot, SlotGenerationConfig } from './types';
import { kv } from '@vercel/kv';

// Vercel KV Storage Wrapper
// This replaces the in-memory storage with persistent Redis storage
class KVStorage {
  private adminPassword: string = '';

  initialize() {
    this.adminPassword = process.env.ADMIN_SECRET || 'admin123';
  }

  // Helper to generate a unique key for a booking slot
  private getBookingKey(date: string, slotId: string): string {
    return `booking:${date}:${slotId}`;
  }

  async getBookings(date: string): Promise<Map<string, unknown>> {
    const keys = await kv.keys(`booking:${date}:*`);
    const bookingsMap = new Map<string, unknown>();
    
    if (keys.length === 0) {
      return bookingsMap;
    }

    const values = await kv.mget(...keys);
    
    keys.forEach((key, index) => {
      // Extract slotId from key "booking:YYYY-MM-DD:slotId"
      const parts = key.split(':');
      // The slotId might contain colons or dashes, so we should be careful. 
      // Our generateSlotId uses format "date:startTime". 
      // The key structure is "booking:date:slotId". 
      // Let's assume the last part(s) form the slotId or we just use the stored data which contains the slotId.
      // But actually, getBookingKey joins with ':', so we can just look at the value.
      
      const value = values[index];
      if (value && typeof value === 'object') {
        // @ts-ignore
        const slotId = value.slotId; 
        if (slotId) {
          bookingsMap.set(slotId, value);
        }
      }
    });

    return bookingsMap;
  }

  async setBooking(date: string, slotId: string, data: unknown): Promise<boolean> {
    const key = this.getBookingKey(date, slotId);
    
    // validation: check if already exists to prevent overwrite
    // 'nx' means only set if not exists. Returns 1 if set, null if not.
    // @ts-ignore - The types for @vercel/kv might be slightly different depending on version, but set with nx is standard redis.
    const result = await kv.set(key, data, { nx: true });
    
    return result === 'OK' || result === 1;
  }

  async getBooking(date: string, slotId: string): Promise<unknown | null> {
    const key = this.getBookingKey(date, slotId);
    return await kv.get(key);
  }

  async getAllBookings(): Promise<Map<string, Map<string, unknown>>> {
    // This is a heavy operation, effectively scanning all bookings.
    // In a real large app, we'd paginate or use sets. For this scale, `keys` is fine.
    const keys = await kv.keys('booking:*');
    const allBookings = new Map<string, Map<string, unknown>>();

    if (keys.length === 0) {
      return allBookings;
    }

    const values = await kv.mget(...keys);

    keys.forEach((key, index) => {
      const value = values[index];
      if (value && typeof value === 'object') {
        // @ts-ignore
        const { date, slotId } = value;
        if (date && slotId) {
          if (!allBookings.has(date)) {
            allBookings.set(date, new Map());
          }
          allBookings.get(date)!.set(slotId, value);
        }
      }
    });

    return allBookings;
  }

  async deleteBooking(date: string, slotId: string): Promise<number> {
    const key = this.getBookingKey(date, slotId);
    return await kv.del(key);
  }

  async isSlotBooked(date: string, slotId: string): Promise<boolean> {
    const key = this.getBookingKey(date, slotId);
    const exists = await kv.exists(key);
    return exists === 1;
  }

  getAdminPassword(): string {
    return this.adminPassword;
  }
}

// Singleton instance
export const storage = new KVStorage();

// Slot generation functions
export function generateSlotId(date: string, startTime: string): string {
  return `${date}:${startTime.replace(':', '-')}`;
}

export async function generateTimeSlots(config?: Partial<SlotGenerationConfig>): Promise<TimeSlot[]> {
  // Default configuration
  const fullConfig: SlotGenerationConfig = {
    startHour: parseInt(process.env.START_HOUR || '9'),
    endHour: parseInt(process.env.END_HOUR || '17'),
    slotDurationMinutes: parseInt(process.env.SLOT_DURATION_MINUTES || '60'),
    breakDurationMinutes: parseInt(process.env.BREAK_DURATION_MINUTES || '15'),
    numberOfDays: parseInt(process.env.BOOKING_DAYS || '3'),
    ...config,
  };

  const slots: TimeSlot[] = [];
  const today = startOfDay(new Date());
  
  // Start from tomorrow
  const startDate = addDays(today, 1);

  // Prefetch all bookings for the date range to avoid N+1 queries
  // We'll just fetch all bookings for simplicity, or we could iterate days.
  // Optimization: Fetch all bookings for the relevant days in parallel.
  const datePromises: Promise<Map<string, unknown>>[] = [];
  const dateStrings: string[] = [];

  for (let dayOffset = 0; dayOffset < fullConfig.numberOfDays; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    dateStrings.push(dateStr);
    datePromises.push(storage.getBookings(dateStr));
  }

  const bookingsPerDay = await Promise.all(datePromises);
  const bookingsMap = new Map<string, Map<string, unknown>>(); // Date -> (SlotId -> Booking)
  
  dateStrings.forEach((dateStr, index) => {
    bookingsMap.set(dateStr, bookingsPerDay[index]);
  });

  for (let dayOffset = 0; dayOffset < fullConfig.numberOfDays; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    const dayBookings = bookingsMap.get(dateStr) || new Map();
    
    let currentHour = fullConfig.startHour;

    while (currentHour < fullConfig.endHour) {
      const startTime = `${currentHour.toString().padStart(2, '0')}:00`;
      const endHour = currentHour + Math.floor(fullConfig.slotDurationMinutes / 60);
      const endMinutes = fullConfig.slotDurationMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      const slotId = generateSlotId(dateStr, startTime);
      
      // Check if slot is booked in storage
      const bookingData = dayBookings.get(slotId);
      const isBooked = !!bookingData;
      const booking = bookingData as { name: string; email: string; whatsapp: string; bookedAt: string } | undefined;

      slots.push({
        id: slotId,
        date: dateStr,
        startTime,
        endTime,
        displayTime: `${startTime} - ${endTime}`,
        isBooked,
        booking: booking ? {
          id: slotId,
          name: booking.name,
          email: booking.email,
          whatsapp: booking.whatsapp,
          bookedAt: booking.bookedAt,
          slotId
        } : undefined
      });

      // Move to next slot with break
      currentHour = endHour + Math.floor(fullConfig.breakDurationMinutes / 60);
    }
  }

  return slots;
}

export function formatDateDisplay(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function getAvailableDates(): string[] {
  const today = startOfDay(new Date());
  const numberOfDays = parseInt(process.env.BOOKING_DAYS || '3');
  const dates: string[] = [];

  for (let i = 1; i <= numberOfDays; i++) {
    dates.push(format(addDays(today, i), 'yyyy-MM-dd'));
  }

  return dates;
}

export function groupSlotsByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  return slots.reduce((groups, slot) => {
    if (!groups[slot.date]) {
      groups[slot.date] = [];
    }
    groups[slot.date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);
}
