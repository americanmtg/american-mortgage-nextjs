/**
 * API Authentication helpers for admin routes
 */

import { NextResponse } from 'next/server'
import { getSession, SessionPayload } from './auth'

export interface AuthResult {
  authenticated: true
  session: SessionPayload
}

export interface AuthError {
  authenticated: false
  response: NextResponse
}

/**
 * Require authentication for an API route
 * Returns session if authenticated, NextResponse error if not
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const session = await getSession()

  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  return {
    authenticated: true,
    session,
  }
}

/**
 * Require admin role for an API route
 * Returns session if authenticated as admin, NextResponse error if not
 */
export async function requireAdmin(): Promise<AuthResult | AuthError> {
  const result = await requireAuth()

  if (!result.authenticated) {
    return result
  }

  if (result.session.role !== 'admin') {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    }
  }

  return result
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Standard success response helper
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status })
}
