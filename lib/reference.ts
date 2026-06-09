import { randomBytes } from "crypto";

// Crockford base32 (no I, L, O, U) — URL-safe, phone-dictatable.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Generate a reservation reference like "TA-2K7F9Q". */
export function generateReference(prefix = "TA", length = 6) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % 32];
  return `${prefix}-${out}`;
}
