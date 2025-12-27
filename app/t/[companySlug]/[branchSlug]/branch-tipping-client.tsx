'use client';

import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import Image from 'next/image';
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
  const router = useRouter();

  const handleStaffSelect = (staffMember: StaffProfile) => {
    router.push(`/t/staff/${staffMember.publicId}`);
  };

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
                      onClick={() => handleStaffSelect(member)}
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

