'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  QrCode,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { cn } from '../../_components/utils';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/branches', label: 'Branches', icon: Building2 },
  { href: '/app/staff', label: 'Staff', icon: Users },
  { href: '/app/tips', label: 'Tips', icon: DollarSign },
  { href: '/app/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/app/qr', label: 'QR Codes', icon: QrCode },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/sign-out', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.redirect) {
        router.push(data.redirect);
      }
    } catch (err) {
      console.error('Sign out error:', err);
      router.push('/sign-in');
    }
  };

  return (
    <nav className="border-r bg-white h-screen w-64 p-4 space-y-2 shadow-sm">
      <div className="mb-6 pb-4 border-b">
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
            T
          </div>
          <h1 className="text-xl font-bold text-foreground">Tipify</h1>
        </div>
        <p className="text-xs text-muted-foreground">Digital Tipping Platform</p>
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
        <Link href="/app/settings">
          <Button
            variant={pathname === '/app/settings' ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start',
              (pathname === '/app/settings' || pathname?.startsWith('/app/settings/')) &&
                'bg-primary text-primary-foreground font-medium'
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Button type="button" variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}

