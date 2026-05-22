import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
}

export function StatCard({ title, value, icon: Icon, gradient }: StatCardProps) {
  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} opacity-10 flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h3 className="text-3xl mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}
