import Link from 'next/link';
import { SITE_NAME } from '@/lib/config/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/20 transition-shadow group-hover:shadow-md group-hover:shadow-primary/30">
            <span className="text-sm font-bold text-primary-foreground">CT</span>
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline-block">
            {SITE_NAME}
          </span>
        </Link>

        <nav aria-label="Countries" className="flex items-center gap-1">
          {[
            { href: '/us', label: 'United States' },
            { href: '/uk', label: 'United Kingdom' },
            { href: '/au', label: 'Australia' },
            { href: '/ca', label: 'Canada' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
