import { createAuthClient } from 'better-auth/react';

console.log('🔐 [AuthClient] Creating Better Auth client...');

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

// Export commonly used functions
export const { signIn, signUp, signOut, useSession, getSession } = authClient;

console.log('✅ [AuthClient] Better Auth client created');
