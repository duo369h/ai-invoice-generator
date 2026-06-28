import { NextResponse } from 'next/server';
import { getRequestUser } from './supabase';

export function getInternalAdminEmails() {
  return String(process.env.INTERNAL_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isInternalAdminEmail(email) {
  if (!email) return false;
  const adminEmails = getInternalAdminEmails();
  if (process.env.NODE_ENV === 'production' && adminEmails.length === 0) {
    return false;
  }
  return adminEmails.includes(String(email).trim().toLowerCase());
}

export async function requireInternalAdmin(request) {
  const context = await getRequestUser(request);
  if (!context || !context.user) {
    return {
      context,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (process.env.NODE_ENV === 'production' && !isInternalAdminEmail(context.user.email)) {
    return {
      context,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { context, response: null };
}
