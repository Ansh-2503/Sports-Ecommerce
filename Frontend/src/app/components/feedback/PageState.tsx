import { ReactNode } from 'react';
import { AlertCircle, Loader2, PackageOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';

export function PageLoader({ className, label = 'Loading…' }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-96 animate-pulse rounded-lg bg-secondary/60" />
      ))}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn('border-destructive/30 bg-destructive/5', className)}>
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <AlertCircle className="h-10 w-10 shrink-0 text-destructive" aria-hidden />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-destructive">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('border-0 shadow-md', className)}>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        {icon ?? <PackageOpen className="h-12 w-12 text-muted-foreground" aria-hidden />}
        <div>
          <p className="font-medium text-foreground">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
