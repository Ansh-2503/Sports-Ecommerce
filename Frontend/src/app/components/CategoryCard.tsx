import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  itemCount: number;
}

export function CategoryCard({ name, icon: Icon, itemCount }: CategoryCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-0 shadow-md overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 flex flex-col items-center text-center gap-3 relative">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{itemCount} items</p>
        </div>
      </CardContent>
    </Card>
  );
}
