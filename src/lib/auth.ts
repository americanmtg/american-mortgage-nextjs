import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import * as argon2 from 'argon2';
import pool from './db';

// JWT_SECRET must be set in environment - no fallback for security
const jwtSecretString = process.env.JWT_SECRET;
if (!jwtSecretString) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretString);

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'blog_editor';
  created_at: Date;
}

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
}

// Create JWT token
export async function createToken(user: AdminUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Get current session from cookies
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  // Only use secure cookies if HTTPS is configured (check via env var)
  const useSecure = process.env.USE_SECURE_COOKIES === 'true';
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Authenticate user with email and password
export async function authenticateUser(
  email: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    const isValid = await argon2.verify(user.password_hash, password);

    if (!isValid) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

// Create new admin user
export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'blog_editor' = 'admin'
): Promise<AdminUser | null> {
  try {
    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), passwordHash, name, role]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}

// Get all admin users
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM admin_users ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
}

// Get admin user by ID
export async function getAdminUserById(id: number): Promise<AdminUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM admin_users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Update admin user
export async function updateAdminUser(
  id: number,
  data: { name?: string; email?: string; role?: string; password?: string }
): Promise<AdminUser | null> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email.toLowerCase());
    }
    if (data.role) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }
    if (data.password) {
      updates.push(`password_hash = $${paramCount++}`);
      values.push(await hashPassword(data.password));
    }

    if (updates.length === 0) return null;

    values.push(id);
    const result = await pool.query(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, name, role, created_at`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Update user error:', error);
    return null;
  }
}

// Delete admin user
export async function deleteAdminUser(id: number): Promise<boolean> {
  try {
    const result = await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Delete user error:', error);
    return false;
  }
}
