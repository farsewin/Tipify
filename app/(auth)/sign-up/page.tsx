'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader } from 'lucide-react';

import { Button } from '../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Input } from '../../_components/ui/input';
import { Label } from '../../_components/ui/label';
import { Separator } from '../../_components/ui/separator';
import { signUp } from '../actions';

export default function SignUp() {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);

    const password = formData.get('password')!.toString();
    const confirmPassword = formData.get('confirm_password')!.toString();

    if (password !== confirmPassword) {
      setError('Passwords must match');
      return;
    }

    setLoading(true);
    const res = await signUp({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: password,
      confirmPassword: confirmPassword,
      companyName: formData.get('company_name') as string,
      companyLegalName: formData.get('company_legal_name') as string || undefined,
      country: formData.get('country') as string,
      currency: formData.get('currency') as string,
    });
    if (res && res.error) {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-12">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
              T
            </div>
            <span className="font-bold text-2xl text-foreground">Tipify</span>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Enter your information to create an account and start your free trial
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col p-6 gap-4">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {error && <p className="text-destructive">{error}</p>}
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Personal Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" required minLength={8} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Company Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Acme Restaurant"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_legal_name">Legal Name (Optional)</Label>
                <Input
                  id="company_legal_name"
                  name="company_legal_name"
                  type="text"
                  placeholder="Acme Restaurant LLC"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country Code</Label>
                  <Input
                    id="country"
                    name="country"
                    type="text"
                    placeholder="QA"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    type="text"
                    placeholder="QAR"
                    maxLength={3}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
