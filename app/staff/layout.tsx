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
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    // Verify user is a staff member
    const { userType } = await getUserType(sessionId);

    // Redirect company members to their dashboard if they try to access staff routes
    // (unless they're also staff members)
    if (!userType.isStaffMember && userType.isCompanyMember) {
      redirect('/app/dashboard');
    }

    // If user is neither staff nor company member, redirect to sign-in
    if (!userType.isStaffMember && !userType.isCompanyMember) {
      redirect('/sign-in');
    }
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
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







