import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export interface SessionUser {
  id: string;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Minimal, type-safe stubs to satisfy API routes during preflight.
// These can be replaced with real Supabase-auth flows in their PR scope.
export interface AuthUser extends SessionUser {
  name?: string;
  isPremium?: boolean;
  scansRemaining?: number;
}

export async function createSession(email: string, _password: string): Promise<AuthUser | null> {
  if (!email) return null;
  return {
    id: 'mock-user-id',
    email,
    name: email.split('@')[0],
    isPremium: false,
    scansRemaining: 0,
  };
}

export async function registerUser(name: string, email: string, _password: string): Promise<AuthUser | null> {
  if (!email || !name) return null;
  return {
    id: 'mock-user-id',
    email,
    name,
    isPremium: false,
    scansRemaining: 0,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return await getSessionUser();
}
