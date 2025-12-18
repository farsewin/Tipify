import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About Tipify</h1>
        <p className="text-xl text-muted-foreground">
          Empowering service businesses with digital tipping solutions
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tipify was created to modernize the tipping experience for service businesses.
              We believe that service workers deserve fair compensation, and businesses should
              have full control over how tips are distributed. Our platform makes tipping
              convenient for customers while giving companies the tools they need to manage
              tip distributions transparently and efficiently.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We&apos;re Different</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">No Commission on Tips</h3>
                <p className="text-muted-foreground">
                  Unlike other platforms, we don&apos;t take a percentage of your tips.
                  We only charge a simple monthly subscription fee per branch. This means
                  you keep 100% of the tips your staff receives.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Company-Controlled Distribution</h3>
                <p className="text-muted-foreground">
                  All tips go directly to your company&apos;s account. You decide when and
                  how to distribute them to your staff. This gives you full control and
                  transparency over the tipping process.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Built for Service Businesses</h3>
                <p className="text-muted-foreground">
                  We understand the unique needs of restaurants, cafes, hotels, salons, and
                  other service businesses. Our platform is designed to be simple, reliable,
                  and easy to use for both managers and staff.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We envision a future where digital tipping is the standard, making it easier
              for customers to show appreciation and for service workers to receive fair
              compensation. We&apos;re committed to building tools that help service
              businesses thrive while supporting their teams.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

