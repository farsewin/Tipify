import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Building2, User, Users } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and company settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/app/settings/company">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>
                    Update company information, currency, and country
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/app/settings/account">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Update your profile and change your password
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <CardTitle>Team Settings</CardTitle>
                <CardDescription>
                  Manage team members and permissions (Coming soon)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}







