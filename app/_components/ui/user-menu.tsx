'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export function UserMenu() {
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
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarFallback>👤</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
