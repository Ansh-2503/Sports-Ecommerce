import { Percent, Truck, Award, HeadphonesIcon } from 'lucide-react';

export function PromoBanner() {
  const features = [
    {
      icon: Percent,
      title: 'Special Offers',
      description: 'Up to 30% off on select items',
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over ₹999',
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: '100% authentic guarantee',
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Always here to help',
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
