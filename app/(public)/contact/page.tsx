'use client';

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
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement contact form submission
    // For now, just simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLoading(false);
    setSubmitted(true);
    toast.success('Thank you! We\'ll get back to you soon.');
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-6 py-20 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>We&apos;ve received your message</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We&apos;ll get back to you as soon as possible. In the meantime, feel free
              to start your free trial and explore the platform.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Have questions? We&apos;d love to hear from you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get in Touch</CardTitle>
          <CardDescription>
            Fill out the form below and we&apos;ll get back to you soon.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" name="company" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                name="message"
                required
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell us how we can help..."
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

