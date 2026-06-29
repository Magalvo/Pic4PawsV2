import type { ReactNode } from 'react';
import { SiteNav } from '../src/SiteNav';
import './styles.css';

export const metadata = {
  title: 'Pic4Paws',
  description: 'Liga associações, adotantes e padrinhos de animais em Portugal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <body suppressHydrationWarning>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
