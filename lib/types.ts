// Types for the LevelAxis Interview Scheduler Application

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  isBooked: boolean;
  isBlocked?: boolean;
  isPast?: boolean;
  isFinalRound?: boolean;
  booking?: BookingDetails;
}

export interface BookingDetails {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  joiningPreference: string;
  bookedAt: string;
  slotId: string;
  whatsappSent?: boolean;
  meetLink?: string;
  googleEventId?: string;
  finalRoundEligible?: boolean;
  currentCtc?: string;
  expectedCtc?: string;
}

export interface BookingFormData {
  name: string;
  email: string;
  whatsapp: string;
  joiningPreference: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  currentCtc?: string;
  expectedCtc?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  slotDate: string;
  slotTime: string;
  bookedAt: string;
  whatsappSent?: boolean;
  meetLink?: string;
  googleEventId?: string;
  finalRoundEligible?: boolean;
  currentCtc?: string;
  expectedCtc?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SlotGenerationConfig {
  startHour: number;
  endHour: number;
  slotDurationMinutes: number;
  breakDurationMinutes: number;
  numberOfDays: number;
  whatsappTemplate?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WhatsAppValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  error?: string;
}
