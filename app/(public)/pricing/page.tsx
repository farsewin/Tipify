import Link from 'next/link';
import { Button } from '../../_components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 149,
    currency: 'QAR',
    description: 'Perfect for single locations',
    features: [
      '1 Branch',
      'Unlimited staff',
      'QR code generation',
      'Tip tracking',
      'Basic reporting',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 249,
    currency: 'QAR',
    description: 'For growing businesses',
    features: [
      'Up to 5 branches',
      'Unlimited staff',
      'QR code generation',
      'Advanced tip tracking',
      'Payout batch management',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 399,
    currency: 'QAR',
    description: 'For large operations',
    features: [
      'Unlimited branches',
      'Unlimited staff',
      'QR code generation',
      'Advanced analytics',
      'Custom reporting',
      'Dedicated support',
      'Custom integrations',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-24">
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">Transparent Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Per-branch monthly subscription. No commission on tips. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.popular
                    ? "bg-card border-primary shadow-lg scale-105"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price} {plan.currency}</span>
                    <span className="text-muted-foreground">/branch/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "bg-gradient-to-r from-primary to-purple-600 hover:opacity-90" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/sign-up">Start Free Trial</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <p className="text-sm text-muted-foreground">
              Need a custom plan? <Link href="/contact" className="text-primary underline">Contact us</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}