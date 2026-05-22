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

/**
 * Skeleton loader for chart pages — renders animated bar-chart-like
 * placeholder blocks while data is being fetched from the server.
 */
export function ChartSkeleton({ rows = 2, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-8', className)} aria-hidden role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="border-0 shadow-md">
          {/* Card header placeholder */}
          <div className="px-6 pt-6 pb-3 space-y-2">
            <div className="h-5 w-48 rounded bg-secondary/70 animate-pulse" />
            <div className="h-3.5 w-32 rounded bg-secondary/50 animate-pulse" />
          </div>
          {/* Chart bars placeholder */}
          <div className="px-6 pb-6 pt-3 h-[380px] flex flex-col gap-3">
            {/* Y-axis + bars area */}
            <div className="flex-1 flex items-end gap-3">
              {Array.from({ length: 12 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-t bg-secondary/60 animate-pulse"
                  style={{
                    height: `${30 + Math.sin((i + j) * 1.3) * 25 + 20}%`,
                    animationDelay: `${j * 60}ms`,
                  }}
                />
              ))}
            </div>
            {/* X-axis placeholder */}
            <div className="flex gap-3">
              {Array.from({ length: 12 }).map((_, j) => (
                <div key={j} className="flex-1 h-3 rounded bg-secondary/40 animate-pulse" style={{ animationDelay: `${j * 60}ms` }} />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for table-based admin pages (Customers, Transactions, Products).
 */
export function TableSkeleton({ rows = 8, cols = 6, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <Card className={cn('border-0 shadow-md', className)} aria-hidden role="status">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex gap-4 px-6 py-4 border-b">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded bg-secondary/60 animate-pulse" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 rounded bg-secondary/50 animate-pulse"
                style={{ animationDelay: `${(i + j) * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
