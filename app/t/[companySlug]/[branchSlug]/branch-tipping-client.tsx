'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import type { Company } from '@/src/models/company.model';
import type { Branch } from '@/src/models/branch.model';
import type { StaffProfile } from '@/src/models/staff-profile.model';

interface BranchTippingPageProps {
  company: Company;
  branch: Branch;
  staff: StaffProfile[];
}

export default function BranchTippingPage({
  company,
  branch,
  staff,
}: BranchTippingPageProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  if (selectedStaff) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{company.name}</CardTitle>
            <CardDescription>{branch.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {selectedStaff.avatarUrl ? (
                <Image
                  src={selectedStaff.avatarUrl}
                  alt={selectedStaff.displayName}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{selectedStaff.displayName}</h2>
                {selectedStaff.position && (
                  <p className="text-muted-foreground">{selectedStaff.position}</p>
                )}
              </div>
            </div>
            <div className="pt-4">
              <Link
                href={`/t/staff/${selectedStaff.publicId}`}
                className="w-full"
              >
                <Button className="w-full">Continue to Tip</Button>
              </Link>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedStaffId(null)}
              className="w-full"
            >
              Choose Different Staff
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <CardDescription>{branch.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-4">Select a staff member to tip</h2>
              {staff.length === 0 ? (
                <p className="text-muted-foreground">No staff members available.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {staff.map((member) => (
                    <Card
                      key={member.id}
                      className="cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setSelectedStaffId(member.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <Image
                              src={member.avatarUrl}
                              alt={member.displayName}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{member.displayName}</p>
                            {member.position && (
                              <p className="text-sm text-muted-foreground">
                                {member.position}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

