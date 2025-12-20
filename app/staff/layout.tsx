import { StaffNav } from './_components/staff-nav';
import { StaffHeader } from './_components/staff-header';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getUserType } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('👔 StaffLayout: Checking authentication...');
  
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    console.log('❌ StaffLayout: No session cookie found');
    redirect('/sign-in');
  }

  console.log('🔍 StaffLayout: Session cookie found, validating user type...');

  try {
    // Verify user is a staff member
    // This function does the database query to validate session and get user type
    const { userType } = await getUserType(sessionId);
    
    console.log('✅ StaffLayout: User type determined', {
      isCompanyMember: userType.isCompanyMember,
      isStaffMember: userType.isStaffMember,
    });

    // Redirect company members to their dashboard if they try to access staff routes
    // (unless they're also staff members)
    if (!userType.isStaffMember && userType.isCompanyMember) {
      console.log('↪️ StaffLayout: Company-only user, redirecting to company dashboard');
      redirect('/app/dashboard');
    }

    // If user is neither staff nor company member, redirect to sign-in
    if (!userType.isStaffMember && !userType.isCompanyMember) {
      console.log('❌ StaffLayout: User is neither staff nor company member');
      redirect('/sign-in');
    }

    console.log('✅ StaffLayout: Access granted to staff dashboard');
  } catch (err) {
    console.error('❌ StaffLayout: Error during authentication', err);
    
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    
    // Re-throw other errors to be handled by error boundary
    throw err;
  }

  return (
    <div className="flex h-screen bg-background">
      <StaffNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}