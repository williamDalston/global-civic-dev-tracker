import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-gradient-to-r from-muted via-muted-foreground/5 to-muted bg-[length:200%_100%]', className)} {...props} />;
}
