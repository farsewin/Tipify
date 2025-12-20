import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getMyStaffProfile } from '../../../src/actions/actions';
import { getAuthenticationService } from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import Image from 'next/image';

async function getStaffProfileData() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const authService = getAuthenticationService();
    await authService.validateSession(sessionId);

    const staffProfile = await getMyStaffProfile();
    return { staffProfile };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function StaffProfilePage() {
  const { staffProfile } = await getStaffProfileData();

  if (!staffProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              You don&apos;t have a staff profile linked to your account yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your company administrator to link your account to a staff profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View your staff profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your staff profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffProfile.avatarUrl && (
            <div className="flex justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden">
                <Image
                  src={staffProfile.avatarUrl}
                  alt={staffProfile.displayName}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Display Name</p>
              <p className="text-lg">{staffProfile.displayName}</p>
            </div>
            {staffProfile.position && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p className="text-lg">{staffProfile.position}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    staffProfile.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {staffProfile.active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Public ID</p>
              <p className="text-sm font-mono text-muted-foreground">{staffProfile.publicId}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Used for QR code generation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







