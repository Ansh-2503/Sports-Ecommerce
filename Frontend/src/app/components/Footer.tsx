import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  const footerSections = [
    {
      title: 'Shop',
      links: ['Running', 'Basketball', 'Soccer', 'Tennis', 'Fitness'],
    },
    {
      title: 'Help',
      links: ['Customer Service', 'Track Order', 'Returns', 'Shipping Info', 'Size Guide'],
    },
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Press', 'Sustainability', 'Affiliates'],
    },
  ];

  return (
    <footer className="border-t bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold">SE</span>
              </div>
              <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">SportEquip</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted source for premium sports equipment and athletic gear.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Facebook className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Instagram className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Twitter className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Youtube className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 SportEquip. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
