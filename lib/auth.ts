import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "ta_session";
const MAX_AGE = 60 * 60 * 8; // 8h
// Fail-closed: production REQUIRES a real AUTH_SECRET. The dev fallback only applies
// locally (NODE_ENV !== "production"), so the public repo's fallback can never sign or
// verify real sessions in a deployed environment.
function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (s) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set — a long random AUTH_SECRET is required in production.");
  }
  return new TextEncoder().encode("dev-only-insecure-secret-not-for-production");
}

type Realm = "STAFF" | "CUSTOMER" | "B2B";
type Session = { userId: string; realm: Realm };

// ── signed, expiring session cookie (HS256). The cookie cannot be forged
// without AUTH_SECRET, so a stolen/guessed user id is no longer enough. ──
async function createSession(userId: string, realm: Realm) {
  const token = await new SignJWT({ realm })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: String(payload.sub), realm: payload.realm as Realm };
  } catch {
    return null; // bad signature / expired / tampered
  }
}

// ── Booking-confirmation grant. Lets the just-booked visitor (who has no account)
// view their own confirmation page by reference, WITHOUT exposing it to anyone who
// guesses a reference. Signed + httpOnly so the client cannot forge it; 4h TTL. ──
const BOOKING_COOKIE = "ta_booking";

export async function grantBookingView(reference: string) {
  const token = await new SignJWT({ ref: reference })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(getSecret());
  const c = await cookies();
  c.set(BOOKING_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function hasBookingGrant(reference: string): Promise<boolean> {
  const c = await cookies();
  const token = c.get(BOOKING_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.ref === reference;
  } catch {
    return false;
  }
}

// ── basic login throttle (in-memory; single-instance dev). Use Redis for
// multi-instance production. ──
const attempts = new Map<string, { n: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function isLocked(key: string) {
  const e = attempts.get(key);
  return !!(e && e.n >= MAX_ATTEMPTS && e.until > Date.now());
}
function recordFail(key: string) {
  const e = attempts.get(key) ?? { n: 0, until: 0 };
  e.n += 1;
  if (e.n >= MAX_ATTEMPTS) e.until = Date.now() + LOCK_MS;
  attempts.set(key, e);
}

export async function login(email: string, password: string) {
  const key = email.trim().toLowerCase();
  if (isLocked(key)) return null;

  const user = await db.user.findUnique({
    where: { email: email.trim() },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user || user.realm !== "STAFF" || !user.passwordHash) {
    recordFail(key);
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    recordFail(key);
    return null;
  }

  attempts.delete(key);
  await createSession(user.id, "STAFF");
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function getStaffUser() {
  const session = await getSession();
  if (!session || session.realm !== "STAFF") return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user || user.realm !== "STAFF" || !user.isActive) return null;
  return user;
}

// ── customer accounts (CUSTOMER realm) ──
export async function registerCustomer(input: { firstName: string; lastName: string; email: string; phone: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("EMAIL_IN_USE");

  // "claim your trips": link to an existing guest customer (past bookings) by email, else create one
  let customer = await db.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (customer) {
    customer = await db.customer.update({
      where: { id: customer.id },
      data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone, lifecycleStage: "CUSTOMER" },
    });
  } else {
    customer = await db.customer.create({
      data: { firstName: input.firstName, lastName: input.lastName, email, phone: input.phone, source: "DIRECT_WEB", lifecycleStage: "CUSTOMER" },
    });
  }

  const user = await db.user.create({
    data: {
      email, passwordHash: await bcrypt.hash(input.password, 10), realm: "CUSTOMER",
      firstName: input.firstName, lastName: input.lastName, customerId: customer.id, emailVerifiedAt: new Date(),
    },
  });
  await createSession(user.id, "CUSTOMER");
  return user;
}

export async function loginCustomer(email: string, password: string) {
  const key = email.trim().toLowerCase();
  if (isLocked(key)) return null;
  const user = await db.user.findUnique({ where: { email: key } });
  if (!user || user.realm !== "CUSTOMER" || !user.passwordHash) {
    recordFail(key);
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    recordFail(key);
    return null;
  }
  attempts.delete(key);
  await createSession(user.id, "CUSTOMER");
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function getCustomerUser() {
  const session = await getSession();
  if (!session || session.realm !== "CUSTOMER") return null;
  const user = await db.user.findUnique({ where: { id: session.userId }, include: { customer: true } });
  if (!user || user.realm !== "CUSTOMER" || !user.isActive || !user.customerId) return null;
  return user;
}

export async function logout() {
  const c = await cookies();
  c.delete(COOKIE);
}
