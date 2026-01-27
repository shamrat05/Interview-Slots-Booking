// Types for the Interview Scheduler Application

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  isBooked: boolean;
  booking?: BookingDetails;
}

export interface BookingDetails {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  bookedAt: string;
  slotId: string;
}

export interface BookingFormData {
  name: string;
  email: string;
  whatsapp: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  slotDate: string;
  slotTime: string;
  bookedAt: string;
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
