'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UserCircle, Settings, LogOut } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { cn } from '../../_components/utils';
import { signOut } from '../../(auth)/actions';

const navItems = [
  { href: '/staff/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/staff/profile', label: 'My Profile', icon: UserCircle },
];

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav className="border-r bg-white h-screen w-64 p-4 space-y-2 shadow-sm">
      <div className="mb-6 pb-4 border-b">
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
            T
          </div>
          <h1 className="text-xl font-bold text-foreground">Tipify</h1>
        </div>
        <p className="text-xs text-muted-foreground">Staff Portal</p>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary text-primary-foreground font-medium'
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 border-t space-y-1">
        <Link href="/staff/settings">
          <Button
            variant={pathname === '/staff/settings' ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start',
              pathname === '/staff/settings' && 'bg-primary text-primary-foreground font-medium'
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </nav>
  );
}







