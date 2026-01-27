import { ValidationResult, WhatsAppValidationResult } from './types';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validateName(name: string): boolean {
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100;
}

export function validateWhatsAppNumber(phone: string): WhatsAppValidationResult {

  let trimmedPhone = phone.trim();

  

  // Remove all spaces, dashes, and parentheses

  let cleanedPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');

  

  // Special handling for Bangladesh local format (e.g., 01712345678)

  if (cleanedPhone.length === 11 && cleanedPhone.startsWith('01')) {

    cleanedPhone = '88' + cleanedPhone;

  }

  

  // Check for valid WhatsApp number formats

  // Supports: +1234567890, 1234567890, 001234567890 (with country code)

  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  

  if (cleanedPhone.length < 10) {

    return {

      isValid: false,

      error: 'Phone number must be at least 10 digits'

    };

  }

  

  if (cleanedPhone.length > 15) {

    return {

      isValid: false,

      error: 'Phone number is too long (max 15 digits)'

    };

  }

  

  if (!phoneRegex.test(cleanedPhone)) {

    return {

      isValid: false,

      error: 'Please enter a valid phone number (e.g., +8801XXXXXXXXX)'

    };

  }

  

  // Format the number consistently with a '+' prefix

  const formattedNumber = cleanedPhone.startsWith('+') 

    ? cleanedPhone 

    : `+${cleanedPhone}`;

  

  return {

    isValid: true,

    formattedNumber

  };

}

export function validateBookingForm(
  name: string,
  email: string,
  whatsapp: string
): ValidationResult {
  const errors: string[] = [];
  
  // Name validation
  if (!name.trim()) {
    errors.push('Name is required');
  } else if (!validateName(name)) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  // Email validation
  if (!email.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(email)) {
    errors.push('Please enter a valid email address');
  }
  
  // WhatsApp validation
  if (!whatsapp.trim()) {
    errors.push('WhatsApp number is required');
  } else {
    const whatsappResult = validateWhatsAppNumber(whatsapp);
    if (!whatsappResult.isValid) {
      errors.push(whatsappResult.error || 'Invalid WhatsApp number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAdminPassword(password: string): boolean {
  const storage = require('./slots').storage;
  const storedPassword = storage.getAdminPassword();
  return password === storedPassword;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function generateBookingId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `booking_${timestamp}_${randomPart}`;
}
