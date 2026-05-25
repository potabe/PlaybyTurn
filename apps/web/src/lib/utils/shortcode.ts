// ============================================================
// Short code generator for spectator links
// Generates a 6-character alphanumeric code (e.g. "ABC123")
// ============================================================

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omits confusable chars: 0,O,1,I

/**
 * Generates a random 6-character spectator short code.
 * Uses crypto.getRandomValues for cryptographically secure randomness.
 */
export function generateSpectatorCode(length = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => CHARS[byte % CHARS.length])
    .join("");
}

/**
 * Validates that a spectator code matches the expected format.
 */
export function isValidSpectatorCode(code: string): boolean {
  return /^[A-Z2-9]{6}$/.test(code);
}
