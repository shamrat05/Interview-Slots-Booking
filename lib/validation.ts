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

  // Ensure it starts with +8801
  if (!trimmedPhone.startsWith('+8801')) {
    return {
      isValid: false,
      error: 'WhatsApp number must start with +8801'
    };
  }

  // Remove the '+' for length check
  let cleanedPhone = trimmedPhone.substring(1);

  // Check if it's all digits
  if (!/^\d+$/.test(cleanedPhone)) {
    return {
      isValid: false,
      error: 'WhatsApp number must contain only digits after +'
    };
  }

  if (cleanedPhone.length !== 13) {
    return {
      isValid: false,
      error: `WhatsApp number must be exactly 13 digits (Current: ${cleanedPhone.length})`
    };
  }

  return {
    isValid: true,
    formattedNumber: trimmedPhone
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
