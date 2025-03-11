import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { userId: string };
  } catch (err) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    // Check for default user
    const [defaultUser] = await db.select()
      .from(users)
      .where(eq(users.isDefaultUser, true))
      .limit(1);

    if (defaultUser) {
      return { userId: defaultUser.id, isDefaultUser: true };
    }
    return null;
  }

  const verifiedToken = await verifyToken(token);
  if (!verifiedToken) return null;

  return { userId: verifiedToken.userId, isDefaultUser: false };
}

export async function createDefaultUser() {
  const [existingDefaultUser] = await db.select()
    .from(users)
    .where(eq(users.isDefaultUser, true))
    .limit(1);

  if (existingDefaultUser) {
    return existingDefaultUser;
  }

  const [defaultUser] = await db.insert(users)
    .values({
      email: 'default@user.local',
      isDefaultUser: true
    })
    .returning();

  return defaultUser;
}
