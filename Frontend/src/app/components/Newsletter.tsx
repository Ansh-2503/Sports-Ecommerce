import { Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Newsletter() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <div className="relative px-6 py-12 md:px-12 md:py-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h2 className="mb-4">Stay in the Loop</h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to our newsletter for exclusive deals, new arrivals, and fitness tips delivered straight to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-background border-0 shadow-sm"
            />
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 whitespace-nowrap">
              Subscribe
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
}
