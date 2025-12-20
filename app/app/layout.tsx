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
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    // Verify user is a company member
    const { userType } = await getUserType(sessionId);

    // Redirect staff-only users to their dashboard if they try to access company routes
    // (unless they're also company members)
    if (!userType.isCompanyMember && userType.isStaffMember) {
      redirect('/staff/dashboard');
    }

    // If user is neither staff nor company member, redirect to sign-in
    if (!userType.isCompanyMember && !userType.isStaffMember) {
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
      <AppNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
