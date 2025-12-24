import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function StatCard({
  title,
  value,
  icon,
  description,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow",
      "animate-fade-in"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-3xl font-bold",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'destructive' && "text-destructive",
          )}>
            {value}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          variant === 'default' && "bg-primary/10 text-primary",
          variant === 'success' && "bg-success/10 text-success",
          variant === 'warning' && "bg-warning/10 text-warning",
          variant === 'destructive' && "bg-destructive/10 text-destructive",
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
