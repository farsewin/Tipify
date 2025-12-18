import Link from 'next/link';
import { Button } from '../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
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
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Per-branch monthly subscription. No commission on tips. Cancel anytime.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.name === 'Pro' ? 'border-primary border-2 shadow-lg scale-105' : 'border-2 hover:border-primary/50 transition-colors'}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price} {plan.currency}
                </span>
                <span className="text-muted-foreground"> /branch/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block">
                <Button
                  className="w-full"
                  variant={plan.name === 'Pro' ? 'default' : 'outline'}
                >
                  Start Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
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
  );
}

