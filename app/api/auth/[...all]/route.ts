import { auth } from '@/src/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

console.log('🔐 [AuthAPI] Setting up Better Auth API route handler...');

export const { GET, POST } = toNextJsHandler(auth);

console.log('✅ [AuthAPI] Better Auth API route handler ready');
