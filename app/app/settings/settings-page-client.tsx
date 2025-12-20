'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Separator } from '../../_components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../_components/ui/tabs';
import { Building2, User, Users } from 'lucide-react';
import UpdateCompanyForm from './company/update-company-form';
import UpdateAccountForm from './account/update-account-form';
import UpdatePasswordForm from './account/update-password-form';
import type { Company } from '@/src/modules/company/company.model';
import type { User as UserType } from '@/src/modules/auth/user.model';

interface SettingsPageClientProps {
  company: Company;
  user: UserType;
}

export default function SettingsPageClient({ company, user }: SettingsPageClientProps) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and company settings</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details. Changes will be reflected across the platform.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              <UpdateCompanyForm company={company} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-6">
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
        </TabsContent>

        {/* Team Settings Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team members and their roles. (Coming soon)
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Team management features are coming soon.</p>
                <p className="text-sm mt-2">
                  You&apos;ll be able to invite team members, manage roles, and set permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

