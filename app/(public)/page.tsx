import Link from 'next/link';
import { Button } from '../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../_components/ui/card';
import { Check, QrCode, DollarSign, Building2, Shield, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-6 py-24 lg:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Digital Tipping Platform
              <span className="block text-primary mt-2">Made for Qatar</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Empower your service team with QR-based tipping. All tips go directly to your company
              account, and you maintain full control over distribution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Why Choose Tipify?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built specifically for service businesses in Qatar
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>QR Code Tipping</CardTitle>
              <CardDescription>
                Customers scan QR codes to tip staff instantly. No cash needed, fully digital.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>No Commission on Tips</CardTitle>
              <CardDescription>
                We only charge a monthly subscription. Keep 100% of your tips.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multi-Branch Support</CardTitle>
              <CardDescription>
                Manage multiple locations from one dashboard. Per-branch pricing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Company-Controlled Distribution</CardTitle>
              <CardDescription>
                All tips go to your account first. You decide when and how to distribute.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Comprehensive Tracking</CardTitle>
              <CardDescription>
                Track tips by branch, staff, date, and distribution status.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Payout Management</CardTitle>
              <CardDescription>
                Create payout batches, track distributions, and export for payroll.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes, not days
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Set Up Your Company</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create your account, add branches, and register your staff members. Takes less than 5 minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Generate QR Codes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Download QR codes for each branch or staff member. Print and display them at your location.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Customers Tip</h3>
              <p className="text-muted-foreground leading-relaxed">
                Customers scan, select staff, enter amount, and pay. Tips go directly to your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center bg-primary/5 rounded-2xl p-12 border-2 border-primary/20">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your 14-day free trial. No credit card required.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}







