import { addDays, format, parse, startOfDay } from 'date-fns';
import { TimeSlot, SlotGenerationConfig } from './types';
import { getRedisClient } from './redis';
import { formatTimeToAMPM } from './utils';

// Redis Storage Wrapper
// This uses direct Redis connection for persistent storage
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
    const redis = await getRedisClient();
    const pattern = `booking:${date}:*`;
    const keys = await redis.keys(pattern);
    const bookingsMap = new Map<string, unknown>();

    if (keys.length === 0) {
      return bookingsMap;
    }

    // Fetch all values for the keys
    const values = await Promise.all(keys.map(key => redis.get(key)));

    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            const slotId = parsed.slotId;
            if (slotId) {
              bookingsMap.set(slotId, parsed);
            }
          }
        } catch (e) {
          console.error('Failed to parse booking data:', e);
        }
      }
    });

    return bookingsMap;
  }

  async setBooking(date: string, slotId: string, data: unknown): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBookingKey(date, slotId);

    // validation: check if already exists to prevent overwrite
    // 'NX' means only set if not exists
    const result = await redis.set(key, JSON.stringify(data), { NX: true });

    return result === 'OK';
  }

  async updateBooking(date: string, slotId: string, data: unknown): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBookingKey(date, slotId);
    const result = await redis.set(key, JSON.stringify(data));
    return result === 'OK';
  }

  async getBooking(date: string, slotId: string): Promise<unknown | null> {
    const redis = await getRedisClient();
    const key = this.getBookingKey(date, slotId);
    const value = await redis.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (e) {
      console.error('Failed to parse booking data:', e);
      return null;
    }
  }

  async getAllBookings(): Promise<Map<string, Map<string, unknown>>> {
    const redis = await getRedisClient();
    // This is a heavy operation, effectively scanning all bookings.
    // In a real large app, we'd paginate or use sets. For this scale, `keys` is fine.
    const keys = await redis.keys('booking:*');
    const allBookings = new Map<string, Map<string, unknown>>();

    if (keys.length === 0) {
      return allBookings;
    }

    const values = await Promise.all(keys.map(key => redis.get(key)));

    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            const { date, slotId } = parsed;
            if (date && slotId) {
              if (!allBookings.has(date)) {
                allBookings.set(date, new Map());
              }
              allBookings.get(date)!.set(slotId, parsed);
            }
          }
        } catch (e) {
          console.error('Failed to parse booking data:', e);
        }
      }
    });

    return allBookings;
  }

  async deleteBooking(date: string, slotId: string): Promise<number> {
    const redis = await getRedisClient();
    const key = this.getBookingKey(date, slotId);
    return await redis.del(key);
  }

  async isSlotBooked(date: string, slotId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBookingKey(date, slotId);
    const exists = await redis.exists(key);
    return exists === 1;
  }

  // Blocking functionality
  private getBlockedKey(date: string, slotId: string): string {
    return `blocked:${date}:${slotId}`;
  }

  async blockSlot(date: string, slotId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBlockedKey(date, slotId);
    const result = await redis.set(key, '1');
    return result === 'OK';
  }

  async unblockSlot(date: string, slotId: string): Promise<number> {
    const redis = await getRedisClient();
    const key = this.getBlockedKey(date, slotId);
    return await redis.del(key);
  }

  async isSlotBlocked(date: string, slotId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBlockedKey(date, slotId);
    const exists = await redis.exists(key);
    return exists === 1;
  }

  // Day Blocking functionality
  private getBlockedDayKey(date: string): string {
    return `blocked_day:${date}`;
  }

  async blockDay(date: string): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBlockedDayKey(date);
    const result = await redis.set(key, '1');
    return result === 'OK';
  }

  async unblockDay(date: string): Promise<number> {
    const redis = await getRedisClient();
    const key = this.getBlockedDayKey(date);
    return await redis.del(key);
  }

  async isDayBlocked(date: string): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getBlockedDayKey(date);
    const exists = await redis.exists(key);
    return exists === 1;
  }

  // Dynamic Configuration
  private getConfigKey(): string {
    return 'app:config';
  }

  async getGlobalConfig(): Promise<Partial<SlotGenerationConfig>> {
    const redis = await getRedisClient();
    const key = this.getConfigKey();
    const value = await redis.get(key);
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  async setGlobalConfig(config: SlotGenerationConfig): Promise<boolean> {
    const redis = await getRedisClient();
    const key = this.getConfigKey();
    const result = await redis.set(key, JSON.stringify(config));
    return result === 'OK';
  }

  // Google OAuth Storage
  async setGoogleToken(token: string): Promise<boolean> {
    const redis = await getRedisClient();
    const result = await redis.set('app:google_refresh_token', token);
    return result === 'OK';
  }

  async getGoogleToken(): Promise<string | null> {
    const redis = await getRedisClient();
    return await redis.get('app:google_refresh_token');
  }

  async cleanupPassedBookings(): Promise<number> {
    const redis = await getRedisClient();
    const keys = await redis.keys('booking:*');
    if (keys.length === 0) return 0;

    const values = await Promise.all(keys.map(key => redis.get(key)));
    const now = new Date();
    const bdNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    
    // Current time in minutes for comparison
    const currentTotalMinutes = (bdNow.getHours() * 60) + bdNow.getMinutes();
    const todayStr = bdNow.getFullYear() + '-' + 
                    (bdNow.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                    bdNow.getDate().toString().padStart(2, '0');
    
    let updatedCount = 0;

    for (let i = 0; i < keys.length; i++) {
      const value = values[i];
      if (!value) continue;
      
      try {
        const booking = JSON.parse(value);
        const { date, endTime, meetLink, googleEventId } = booking;
        
        // If no links to clean, skip
        if (!meetLink && !googleEventId) continue;
        if (!date || !endTime) continue;

        let shouldClearLinks = false;
        
        // 1. If date is before today, it's definitely passed > 2 hours
        if (date < todayStr) {
          shouldClearLinks = true;
        } 
        // 2. If it's today, check if endTime + 120 minutes (2 hours) has passed
        else if (date === todayStr) {
          const [h, m] = endTime.split(':').map(Number);
          const endTotalMinutes = (h * 60) + m;
          if (currentTotalMinutes >= (endTotalMinutes + 120)) {
            shouldClearLinks = true;
          }
        }

        if (shouldClearLinks) {
          // Keep person info, just clear the heavy/temporary link data
          const updatedBooking = {
            ...booking,
            meetLink: '',
            googleEventId: ''
          };
          // Use direct set to update the existing key
          await redis.set(keys[i], JSON.stringify(updatedBooking));
          updatedCount++;
        }
      } catch (e) {
        console.error('Error updating booking for cleanup:', e);
      }
    }

    return updatedCount;
  }

  async deleteGoogleToken(): Promise<number> {
    const redis = await getRedisClient();
    return await redis.del('app:google_refresh_token');
  }

  async getBlockedSlots(date: string): Promise<Set<string>> {
    const redis = await getRedisClient();
    const pattern = `blocked:${date}:*`;
    const keys = await redis.keys(pattern);
    const blockedSlotIds = new Set<string>();
    
    keys.forEach(key => {
      const prefix = `blocked:${date}:`;
      if (key.startsWith(prefix)) {
         blockedSlotIds.add(key.substring(prefix.length));
      }
    });
    return blockedSlotIds;
  }

  // Job Posting functionality
  async getJobs(): Promise<any[]> {
    const redis = await getRedisClient();
    const keys = await redis.keys('job:*');
    if (keys.length === 0) return [];
    
    const values = await Promise.all(keys.map(key => redis.get(key)));
    return values.map(v => {
      try {
        return JSON.parse(v || '{}');
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  async saveJob(job: any): Promise<boolean> {
    const redis = await getRedisClient();
    const key = `job:${job.id}`;
    const result = await redis.set(key, JSON.stringify(job));
    return result === 'OK';
  }

  async deleteJob(id: string): Promise<number> {
    const redis = await getRedisClient();
    const key = `job:${id}`;
    return await redis.del(key);
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

// Helper to get Bangladesh time (UTC+6) components
export function getBangladeshNow() {
  const now = new Date();
  // getTime() is always UTC
  const bdDate = new Date(now.getTime() + (3600000 * 6));
  return {
    hours: bdDate.getUTCHours(),
    minutes: bdDate.getUTCMinutes(),
    year: bdDate.getUTCFullYear(),
    month: bdDate.getUTCMonth(),
    day: bdDate.getUTCDate(),
    dateStr: `${bdDate.getUTCFullYear()}-${(bdDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${bdDate.getUTCDate().toString().padStart(2, '0')}`,
    fullDate: bdDate
  };
}

export function isPastSlot(dateStr: string, startTime: string): boolean {
  const bdNow = getBangladeshNow();
  if (dateStr < bdNow.dateStr) return true;
  if (dateStr > bdNow.dateStr) return false;
  
  const [h, m] = startTime.split(':').map(Number);
  const slotMinutes = h * 60 + m;
  const currentMinutes = bdNow.hours * 60 + bdNow.minutes;
  
  return slotMinutes <= currentMinutes;
}

export async function generateTimeSlots(config?: Partial<SlotGenerationConfig>): Promise<TimeSlot[]> {
  // Fetch dynamic config from Redis first
  const dynamicConfig = await storage.getGlobalConfig();
  
  // Default configuration (Dynamic > Env > Hardcoded)
  const fullConfig: SlotGenerationConfig = {
    startHour: dynamicConfig.startHour ?? parseInt(process.env.START_HOUR || '9'),
    endHour: dynamicConfig.endHour ?? parseInt(process.env.END_HOUR || '24'),
    slotDurationMinutes: dynamicConfig.slotDurationMinutes ?? parseInt(process.env.SLOT_DURATION_MINUTES || '60'),
    breakDurationMinutes: dynamicConfig.breakDurationMinutes ?? parseInt(process.env.BREAK_DURATION_MINUTES || '15'),
    numberOfDays: dynamicConfig.numberOfDays ?? parseInt(process.env.BOOKING_DAYS || '3'),
    ...config,
  };

  const slots: TimeSlot[] = [];
  const bdNow = getBangladeshNow();
  const todayStr = bdNow.dateStr;

  // Start from today
  const startDate = new Date(Date.UTC(bdNow.year, bdNow.month, bdNow.day));

  // Prefetch all bookings and blocked slots for the date range
  const datePromises: Promise<Map<string, unknown>>[] = [];
  const blockedPromises: Promise<Set<string>>[] = [];
  const blockedDayPromises: Promise<boolean>[] = [];
  const dateStrings: string[] = [];

  for (let dayOffset = 0; dayOffset < fullConfig.numberOfDays; dayOffset++) {
    const currentDate = new Date(startDate.getTime() + (dayOffset * 86400000));
    const dateStr = `${currentDate.getUTCFullYear()}-${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${currentDate.getUTCDate().toString().padStart(2, '0')}`;
    dateStrings.push(dateStr);
    datePromises.push(storage.getBookings(dateStr));
    blockedPromises.push(storage.getBlockedSlots(dateStr));
    blockedDayPromises.push(storage.isDayBlocked(dateStr));
  }

  const bookingsPerDay = await Promise.all(datePromises);
  const blockedPerDay = await Promise.all(blockedPromises);
  const dayBlockedStatuses = await Promise.all(blockedDayPromises);
  
  const bookingsMap = new Map<string, Map<string, unknown>>(); // Date -> (SlotId -> Booking)
  const blockedMap = new Map<string, Set<string>>(); // Date -> Set<SlotId>
  const dayBlockedMap = new Map<string, boolean>(); // Date -> isBlocked

  dateStrings.forEach((dateStr, index) => {
    bookingsMap.set(dateStr, bookingsPerDay[index]);
    blockedMap.set(dateStr, blockedPerDay[index]);
    dayBlockedMap.set(dateStr, dayBlockedStatuses[index]);
  });

  for (let dayOffset = 0; dayOffset < fullConfig.numberOfDays; dayOffset++) {
    const currentDate = new Date(startDate.getTime() + (dayOffset * 86400000));
    const dateStr = `${currentDate.getUTCFullYear()}-${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${currentDate.getUTCDate().toString().padStart(2, '0')}`;

    const isFullDayBlocked = dayBlockedMap.get(dateStr) || false;
    const dayBookings = bookingsMap.get(dateStr) || new Map();
    const dayBlocked = blockedMap.get(dateStr) || new Set();

    const startMinutes = fullConfig.startHour * 60;
    const endMinutes = fullConfig.endHour * 60;
    
    let currentMinutes = startMinutes;

    while (currentMinutes + fullConfig.slotDurationMinutes <= endMinutes) {
      // Calculate start time
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;

      // Check if slot is in the past
      let isPast = false;
      if (dateStr === todayStr) {
        const currentTotalMinutes = (bdNow.hours * 60) + bdNow.minutes;
        if (currentMinutes <= currentTotalMinutes) {
          isPast = true;
        }
      }

      // Calculate end time
      const slotEndMinutes = currentMinutes + fullConfig.slotDurationMinutes;
      const endH = Math.floor(slotEndMinutes / 60);
      const endM = slotEndMinutes % 60;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      const slotId = generateSlotId(dateStr, startTime);

      // Check if slot is booked in storage
      const bookingData = dayBookings.get(slotId);
      const isBooked = !!bookingData;
      const booking = bookingData as any;
      
      // Check if blocked
      const isBlocked = isFullDayBlocked || dayBlocked.has(slotId);

      slots.push({
        id: slotId,
        date: dateStr,
        startTime: startTime,
        endTime: endTime,
        displayTime: `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`,
        isBooked,
        isBlocked,
        isPast,
        booking: booking ? {
          ...booking,
          joiningPreference: booking.joiningPreference || 'Not provided',
          slotTime: `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`
        } : undefined
      });

      // Move to next slot with break
      currentMinutes += fullConfig.slotDurationMinutes + fullConfig.breakDurationMinutes;
    }
  }

  return slots;
}

export function formatDateDisplay(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function getAvailableDates(): string[] {
  const bdNow = getBangladeshNow();
  const numberOfDays = parseInt(process.env.BOOKING_DAYS || '3');
  const dates: string[] = [];

  for (let i = 0; i < numberOfDays; i++) {
    const d = new Date(Date.UTC(bdNow.year, bdNow.month, bdNow.day + i));
    dates.push(`${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCDate().toString().padStart(2, '0')}`);
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
