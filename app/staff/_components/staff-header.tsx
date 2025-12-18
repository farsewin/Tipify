'use client';

import { Bell } from 'lucide-react';
import { Button } from '../../_components/ui/button';

export function StaffHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center space-x-4 flex-1">
          <h2 className="text-lg font-semibold text-foreground">Staff Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}







