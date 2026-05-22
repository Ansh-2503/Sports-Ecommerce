import { Button } from './ui/button';
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';

export function Hero() {
  const navigate = useNavigate();
  const { user, setIsAuthModalOpen } = useApp();

  const handleShopNowClick = () => {
    document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCollectionsClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    navigate('/wishlists');
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 min-h-[calc(100vh-4rem)]">
      {/* Decorative background layers — explicitly below content */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm">New Arrivals Every Week</span>
            </div>

            <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
              Elevate Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Game</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Discover premium sports equipment for every athlete. From beginners to professionals,
              we have everything you need to reach your peak performance.
            </p>

            {/* z-index removed — header is sticky top-0 z-50; hero content is normal flow below it */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={handleShopNowClick}
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleCollectionsClick}>
                View Collections
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3>Authentic</h3>
                </div>
                <p className="text-sm text-muted-foreground">100% genuine products</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <h3>Quality</h3>
                </div>
                <p className="text-sm text-muted-foreground">Premium materials</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3>Fast Ship</h3>
                </div>
                <p className="text-sm text-muted-foreground">2-day delivery</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/20 to-accent/20 rounded-3xl transform -rotate-6" />
              <div className="absolute inset-4 bg-card rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden">
                <img src="/Hero_2.png" alt="Featured Advertisement" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
