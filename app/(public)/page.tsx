import Link from 'next/link';
import { Button } from '../_components/ui/button';
import { ArrowRight, QrCode, Sparkles, TrendingUp, BarChart3, Bell, Building2, CreditCard, Users, Wallet, Shield, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Digital Tipping Made Simple</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Empower Your Staff with{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Instant Tips
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Generate QR codes for your team, let customers tip with a scan, 
                and track everything in one powerful dashboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity text-lg px-8" asChild>
                  <Link href="/sign-up">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 border-2" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
                <div>
                  <div className="text-3xl font-bold text-foreground">50K+</div>
                  <div className="text-sm text-muted-foreground">Tips Processed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">2K+</div>
                  <div className="text-sm text-muted-foreground">Happy Staff</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Businesses</div>
                </div>
              </div>
            </div>

            {/* Right Content - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative w-72 h-[580px] bg-card rounded-[3rem] border-4 border-foreground/10 shadow-2xl overflow-hidden">
                  {/* Phone Screen */}
                  <div className="absolute inset-2 bg-background rounded-[2.5rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="h-12 flex items-center justify-center">
                      <div className="w-24 h-6 bg-foreground/10 rounded-full" />
                    </div>

                    {/* App Content */}
                    <div className="p-6 space-y-6">
                      {/* Staff Profile */}
                      <div className="text-center space-y-3">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary-foreground">JS</span>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">John Smith</div>
                          <div className="text-sm text-muted-foreground">Barista at Coffee House</div>
                        </div>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-yellow-500 text-lg">★</span>
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">(4.9)</span>
                        </div>
                      </div>

                      {/* Tip Amounts */}
                      <div className="grid grid-cols-4 gap-2">
                        {["$3", "$5", "$10", "$15"].map((amount) => (
                          <button
                            key={amount}
                            className="py-3 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors font-semibold text-sm"
                          >
                            {amount}
                          </button>
                        ))}
                      </div>

                      {/* Custom Amount */}
                      <div className="h-12 rounded-xl border border-border flex items-center px-4">
                        <span className="text-muted-foreground text-sm">Custom amount...</span>
                      </div>

                      {/* Tip Button */}
                      <button className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-semibold">
                        Leave a Tip 💝
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-card shadow-xl flex items-center justify-center animate-bounce">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl bg-card shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Manage Tips
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete platform for businesses to manage digital tipping across all their locations and staff.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: QrCode, title: "Instant QR Codes", description: "Generate unique QR codes for each staff member. Print or display them for easy customer scanning.", color: "text-primary", bgColor: "bg-primary/10" },
              { icon: Building2, title: "Branch Management", description: "Manage multiple locations from one dashboard. Track performance across all your branches.", color: "text-purple-500", bgColor: "bg-purple-500/10" },
              { icon: Users, title: "Staff Profiles", description: "Create detailed profiles for your team with photos, bios, and personal QR codes.", color: "text-blue-500", bgColor: "bg-blue-500/10" },
              { icon: BarChart3, title: "Analytics & Insights", description: "Track tips in real-time with beautiful charts. Identify top performers and trends.", color: "text-green-500", bgColor: "bg-green-500/10" },
              { icon: Bell, title: "Real-Time Alerts", description: "Staff get instant notifications when they receive tips. Keep morale high!", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
              { icon: Wallet, title: "Payroll Ready", description: "Export tip data for easy payroll integration. Track earnings by period.", color: "text-primary", bgColor: "bg-primary/10" },
              { icon: Shield, title: "Secure & Private", description: "Bank-level security for all transactions. Your data is always protected.", color: "text-blue-500", bgColor: "bg-blue-500/10" },
              { icon: CreditCard, title: "Customer Ratings", description: "Let customers rate and leave feedback. Build your team's reputation.", color: "text-purple-500", bgColor: "bg-purple-500/10" },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes. No technical knowledge required.
            </p>
          </div>
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-blue-500 transform -translate-y-1/2" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { number: "01", icon: Building2, title: "Register Your Business", description: "Sign up and add your branches. Set up your company profile and branding." },
                { number: "02", icon: QrCode, title: "Add Your Staff", description: "Create profiles for your team members. Each gets a unique QR code automatically." },
                { number: "03", icon: Smartphone, title: "Customers Scan & Tip", description: "Customers scan the QR code, choose an amount, and leave a tip with feedback." },
                { number: "04", icon: Wallet, title: "Track & Export", description: "Monitor all tips in your dashboard. Export data for payroll anytime." },
              ].map((step, index) => (
                <div key={step.number} className="relative">
                  <div className="relative z-10 bg-card rounded-2xl p-8 border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-sm font-bold">
                      {step.number}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-2xl p-12 border-2 border-primary/20">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start your 14-day free trial. No credit card required.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-primary-foreground px-10 py-6 text-lg">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}