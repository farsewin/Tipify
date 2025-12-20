import { AppNav } from './_components/app-nav';
import { AppHeader } from './_components/app-header';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getUserType } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🏢 AppLayout: Checking authentication...');
  
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    console.log('❌ AppLayout: No session cookie found');
    redirect('/sign-in');
  }

  console.log('🔍 AppLayout: Session cookie found, validating user type...');

  try {
    // Verify user is a company member
    // This function does the database query to validate session and get user type
    const { userType } = await getUserType(sessionId);
    
    console.log('✅ AppLayout: User type determined', {
      isCompanyMember: userType.isCompanyMember,
      isStaffMember: userType.isStaffMember,
    });

    // Redirect staff-only users to their dashboard if they try to access company routes
    // (unless they're also company members)
    if (!userType.isCompanyMember && userType.isStaffMember) {
      console.log('↪️ AppLayout: Staff-only user, redirecting to staff dashboard');
      redirect('/staff/dashboard');
    }

    // If user is neither staff nor company member, redirect to sign-in
    if (!userType.isCompanyMember && !userType.isStaffMember) {
      console.log('❌ AppLayout: User is neither staff nor company member');
      redirect('/sign-in');
    }

    console.log('✅ AppLayout: Access granted to company dashboard');
  } catch (err) {
    console.error('❌ AppLayout: Error during authentication', err);
    
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    
    // Re-throw other errors to be handled by error boundary
    throw err;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}