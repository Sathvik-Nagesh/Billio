/**
 * Centralized Phone & WhatsApp Number Utility
 * Provides standard formatting (+91 XXXXX XXXXX), validation, and clean WhatsApp URI generation.
 */

/**
 * Strips all non-digit characters except leading plus if present
 */
export function sanitizeDigits(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Cleans phone number specifically for WhatsApp API URLs (e.g. wa.me/919876543210)
 * Ensures standard 10-digit Indian numbers are prefixed with '91' country code.
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If 10-digit Indian phone, prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If starts with 0 and has 11 digits (e.g. 09876543210), replace leading 0 with 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}

/**
 * Formats a raw phone input dynamically as user types (standard +91 XXXXX XXXXX format for India)
 */
export function formatPhoneDisplay(raw: string): string {
  if (!raw) return '';
  let trimmed = raw.trim();

  if (trimmed === '+91' || trimmed === '+91 ' || trimmed === '+') {
    return '';
  }

  // Auto-prefix +91 if user types digits directly
  if (!trimmed.startsWith('+')) {
    trimmed = '+91 ' + trimmed;
  }

  return trimmed;
}

/**
 * Generates an encoded WhatsApp share URL with greeting message
 */
export function getWhatsAppShareUrl(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? cleanPhoneForWhatsApp(phone) : '';
  const encodedMsg = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}

/**
 * Validates whether the given phone number string contains a plausible mobile number
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
