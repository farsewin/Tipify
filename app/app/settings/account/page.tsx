import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getAuthenticationService } from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Separator } from '../../../_components/ui/separator';
import UpdateAccountForm from './update-account-form';
import UpdatePasswordForm from './update-password-form';

async function getUserData() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    return { user };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function AccountSettingsPage() {
  const { user } = await getUserData();

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your name and email address.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <UpdateAccountForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}







