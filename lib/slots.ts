import { format, parse } from 'date-fns';
import { TimeSlot, SlotGenerationConfig } from './types';
import { getDb } from './mongodb';
import { formatTimeToAMPM } from './utils';

function normalizePhoneCore(raw: string): string {
  if (!raw) return '';
  let d = raw.replace(/\D/g, '');
  if (d.length < 7) return '';
  if (d.length > 10 && d.startsWith('880')) d = d.slice(3);
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  return d;
}

class KVStorage {
  private adminPassword: string = '';
  private initialized: boolean = false;

  initialize() {
    if (this.initialized) return;
    this.adminPassword = process.env.ADMIN_SECRET || 'admin123';
    this.initialized = true;
  }

  private ensureInitialized() {
    if (!this.initialized) this.initialize();
  }

  async getBookings(date: string): Promise<Map<string, unknown>> {
    this.ensureInitialized();
    const db = await getDb();
    const docs = await db.collection('bookings').find({ date }).toArray();
    const map = new Map<string, unknown>();
    for (const doc of docs) {
      const { _id, ...data } = doc;
      map.set(doc.slotId, data);
    }
    return map;
  }

  async setBooking(date: string, slotId: string, data: unknown): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('bookings').updateOne(
      { date, slotId },
      { $setOnInsert: data as object },
      { upsert: true }
    );
    return result.upsertedCount === 1;
  }

  async updateBooking(date: string, slotId: string, data: unknown): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('bookings').replaceOne(
      { date, slotId },
      data as object,
      { upsert: true }
    );
    return result.acknowledged;
  }

  async getBooking(date: string, slotId: string): Promise<unknown | null> {
    this.ensureInitialized();
    const db = await getDb();
    const doc = await db.collection('bookings').findOne({ date, slotId });
    if (!doc) return null;
    const { _id, ...data } = doc;
    return data;
  }

  async getAllBookings(): Promise<Map<string, Map<string, unknown>>> {
    this.ensureInitialized();
    const db = await getDb();
    const docs = await db.collection('bookings').find({}).toArray();
    const all = new Map<string, Map<string, unknown>>();
    for (const doc of docs) {
      const { _id, ...data } = doc;
      if (!all.has(doc.date)) all.set(doc.date, new Map());
      all.get(doc.date)!.set(doc.slotId, data);
    }
    return all;
  }

  async deleteBooking(date: string, slotId: string): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('bookings').deleteOne({ date, slotId });
    return result.deletedCount;
  }

  async isSlotBooked(date: string, slotId: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const count = await db.collection('bookings').countDocuments({ date, slotId });
    return count > 0;
  }

  async blockSlot(date: string, slotId: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('blocked_slots').updateOne(
      { date, slotId },
      { $setOnInsert: { date, slotId } },
      { upsert: true }
    );
    return result.upsertedCount === 1 || result.matchedCount === 1;
  }

  async unblockSlot(date: string, slotId: string): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('blocked_slots').deleteOne({ date, slotId });
    return result.deletedCount;
  }

  async isSlotBlocked(date: string, slotId: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const count = await db.collection('blocked_slots').countDocuments({ date, slotId });
    return count > 0;
  }

  async setSlotFinalRound(date: string, slotId: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('final_round_slots').updateOne(
      { date, slotId },
      { $setOnInsert: { date, slotId } },
      { upsert: true }
    );
    return result.upsertedCount === 1 || result.matchedCount === 1;
  }

  async unsetSlotFinalRound(date: string, slotId: string): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('final_round_slots').deleteOne({ date, slotId });
    return result.deletedCount;
  }

  async isSlotFinalRound(date: string, slotId: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const count = await db.collection('final_round_slots').countDocuments({ date, slotId });
    return count > 0;
  }

  async getFinalRoundSlots(date: string): Promise<Set<string>> {
    this.ensureInitialized();
    const db = await getDb();
    const docs = await db.collection('final_round_slots').find({ date }).toArray();
    return new Set(docs.map(d => d.slotId));
  }

  async findBookingByEmailOrPhone(identifier: string): Promise<unknown | null> {
    this.ensureInitialized();
    const db = await getDb();
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      const escaped = trimmed.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const doc = await db.collection('bookings').findOne({
        email: { $regex: new RegExp(`^${escaped}$`, 'i') }
      });
      if (!doc) return null;
      const { _id, ...data } = doc;
      return data;
    }

    const inputCore = normalizePhoneCore(trimmed);
    if (!inputCore) return null;

    const docs = await db.collection('bookings')
      .find({ whatsapp: { $exists: true, $ne: null } })
      .toArray();

    for (const doc of docs) {
      const stored = (doc as any).whatsapp;
      if (typeof stored !== 'string') continue;
      if (normalizePhoneCore(stored) === inputCore) {
        const { _id, ...data } = doc;
        return data;
      }
    }
    return null;
  }

  async blockDay(date: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('blocked_days').updateOne(
      { date },
      { $setOnInsert: { date } },
      { upsert: true }
    );
    return result.upsertedCount === 1 || result.matchedCount === 1;
  }

  async unblockDay(date: string): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('blocked_days').deleteOne({ date });
    return result.deletedCount;
  }

  async isDayBlocked(date: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const count = await db.collection('blocked_days').countDocuments({ date });
    return count > 0;
  }

  async getGlobalConfig(): Promise<Partial<SlotGenerationConfig>> {
    this.ensureInitialized();
    const db = await getDb();
    const doc = await db.collection('app_config').findOne({ key: 'global' });
    if (!doc) return {};
    const { _id, key, ...config } = doc;
    return config as Partial<SlotGenerationConfig>;
  }

  async setGlobalConfig(config: SlotGenerationConfig): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('app_config').replaceOne(
      { key: 'global' },
      { key: 'global', ...config },
      { upsert: true }
    );
    return result.acknowledged;
  }

  async setGoogleToken(token: string): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('app_config').replaceOne(
      { key: 'google_refresh_token' },
      { key: 'google_refresh_token', value: token },
      { upsert: true }
    );
    return result.acknowledged;
  }

  async getGoogleToken(): Promise<string | null> {
    this.ensureInitialized();
    const db = await getDb();
    const doc = await db.collection('app_config').findOne({ key: 'google_refresh_token' });
    return doc?.value ?? null;
  }

  async deleteGoogleToken(): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('app_config').deleteOne({ key: 'google_refresh_token' });
    return result.deletedCount;
  }

  async getBlockedSlots(date: string): Promise<Set<string>> {
    this.ensureInitialized();
    const db = await getDb();
    const docs = await db.collection('blocked_slots').find({ date }).toArray();
    return new Set(docs.map(d => d.slotId));
  }

  async getJobs(): Promise<any[]> {
    this.ensureInitialized();
    const db = await getDb();
    const docs = await db.collection('jobs').find({}).toArray();
    return docs.map(({ _id, ...rest }) => rest);
  }

  async saveJob(job: any): Promise<boolean> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('jobs').replaceOne(
      { id: job.id },
      job,
      { upsert: true }
    );
    return result.acknowledged;
  }

  async deleteJob(id: string): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const result = await db.collection('jobs').deleteOne({ id });
    return result.deletedCount;
  }

  async cleanupPassedBookings(): Promise<number> {
    this.ensureInitialized();
    const db = await getDb();
    const docs = await db.collection('bookings').find({
      $or: [{ meetLink: { $ne: '' } }, { googleEventId: { $ne: '' } }]
    }).toArray();

    const now = new Date();
    const bdNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const currentTotalMinutes = bdNow.getHours() * 60 + bdNow.getMinutes();
    const todayStr = `${bdNow.getFullYear()}-${(bdNow.getMonth() + 1).toString().padStart(2, '0')}-${bdNow.getDate().toString().padStart(2, '0')}`;

    let updatedCount = 0;
    for (const doc of docs) {
      const { date, endTime } = doc;
      if (!date || !endTime) continue;

      let shouldClearLinks = false;
      if (date < todayStr) {
        shouldClearLinks = true;
      } else if (date === todayStr) {
        const [h, m] = endTime.split(':').map(Number);
        if (currentTotalMinutes >= h * 60 + m + 120) shouldClearLinks = true;
      }

      if (shouldClearLinks) {
        await db.collection('bookings').updateOne(
          { _id: doc._id },
          { $set: { meetLink: '', googleEventId: '' } }
        );
        updatedCount++;
      }
    }
    return updatedCount;
  }

  getAdminPassword(): string {
    this.ensureInitialized();
    return this.adminPassword;
  }
}

export const storage = new KVStorage();

export function generateSlotId(date: string, startTime: string): string {
  return `${date}:${startTime.replace(':', '-')}`;
}

export function getBangladeshNow() {
  const now = new Date();
  const bdDate = new Date(now.getTime() + 3600000 * 6);
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
  return h * 60 + m <= bdNow.hours * 60 + bdNow.minutes;
}

export async function generateTimeSlots(config?: Partial<SlotGenerationConfig>): Promise<TimeSlot[]> {
  const dynamicConfig = await storage.getGlobalConfig();

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
  const startDate = new Date(Date.UTC(bdNow.year, bdNow.month, bdNow.day));

  const dateStrings: string[] = [];
  for (let i = 0; i < fullConfig.numberOfDays; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    dateStrings.push(`${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCDate().toString().padStart(2, '0')}`);
  }

  const [bookingsPerDay, blockedPerDay, finalRoundPerDay, dayBlockedStatuses] = await Promise.all([
    Promise.all(dateStrings.map(d => storage.getBookings(d))),
    Promise.all(dateStrings.map(d => storage.getBlockedSlots(d))),
    Promise.all(dateStrings.map(d => storage.getFinalRoundSlots(d))),
    Promise.all(dateStrings.map(d => storage.isDayBlocked(d))),
  ]);

  const bookingsMap = new Map<string, Map<string, unknown>>();
  const blockedMap = new Map<string, Set<string>>();
  const finalRoundMap = new Map<string, Set<string>>();
  const dayBlockedMap = new Map<string, boolean>();

  dateStrings.forEach((dateStr, i) => {
    bookingsMap.set(dateStr, bookingsPerDay[i]);
    blockedMap.set(dateStr, blockedPerDay[i]);
    finalRoundMap.set(dateStr, finalRoundPerDay[i]);
    dayBlockedMap.set(dateStr, dayBlockedStatuses[i]);
  });

  for (let dayOffset = 0; dayOffset < fullConfig.numberOfDays; dayOffset++) {
    const dateStr = dateStrings[dayOffset];
    const isFullDayBlocked = dayBlockedMap.get(dateStr) || false;
    const dayBookings = bookingsMap.get(dateStr) || new Map();
    const dayBlocked = blockedMap.get(dateStr) || new Set();
    const dayFinalRound = finalRoundMap.get(dateStr) || new Set();

    const startMinutes = fullConfig.startHour * 60;
    const endMinutes = fullConfig.endHour * 60;
    let currentMinutes = startMinutes;

    while (currentMinutes + fullConfig.slotDurationMinutes <= endMinutes) {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;

      let isPast = false;
      if (dateStr === todayStr) {
        const currentTotalMinutes = bdNow.hours * 60 + bdNow.minutes;
        if (currentMinutes <= currentTotalMinutes) isPast = true;
      }

      const slotEndMinutes = currentMinutes + fullConfig.slotDurationMinutes;
      const endH = Math.floor(slotEndMinutes / 60);
      const endM = slotEndMinutes % 60;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      const slotId = generateSlotId(dateStr, startTime);
      const bookingData = dayBookings.get(slotId);
      const isBooked = !!bookingData;
      const booking = bookingData as any;
      const isBlocked = isFullDayBlocked || dayBlocked.has(slotId);
      const isFinalRound = dayFinalRound.has(slotId);

      slots.push({
        id: slotId,
        date: dateStr,
        startTime,
        endTime,
        displayTime: `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`,
        isBooked,
        isBlocked,
        isPast,
        isFinalRound,
        booking: booking ? {
          ...booking,
          joiningPreference: booking.joiningPreference || 'Not provided',
          slotTime: `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`
        } : undefined
      });

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
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);
}
