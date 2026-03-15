const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(rawPhone: string) {
  const normalized = rawPhone.replace(/[^\d+]/g, '');

  if (!E164_REGEX.test(normalized)) {
    throw new Error('Phone number must be a valid E.164 value.');
  }

  return normalized;
}
