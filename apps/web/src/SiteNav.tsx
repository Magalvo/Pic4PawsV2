'use client';

import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/animais', label: 'Animais' },
  { href: '/abrigos', label: 'Abrigos' },
  { href: '/adocoes', label: 'Adoções' },
  { href: '/doacoes', label: 'Donativos' },
];

export function SiteNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <span className="text-primary text-2xl">🐾</span>
          <span className="font-extrabold text-ink text-base tracking-tight">Pic4Paws</span>
        </a>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={[
                'px-3 py-1.5 rounded-control text-sm font-semibold transition-colors',
                isActive(href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-ink hover:bg-border/40',
              ].join(' ')}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/entrar"
            className="px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors"
          >
            Entrar
          </a>
          <a
            href="/registar"
            className="px-4 py-1.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            Registar
          </a>
        </div>
      </div>
    </header>
  );
}
