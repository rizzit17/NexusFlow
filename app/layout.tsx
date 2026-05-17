import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StoreHydration } from '@/components/layout/StoreHydration';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DS NexusFlow',
  description: 'Volumetric Rider Payout & Delivery Intelligence Platform for DS Group. Enterprise-grade FMCG logistics analytics.',
  keywords: 'DS Group, rider payout, delivery analytics, FMCG logistics, volumetric payout',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginLeft: 'var(--sidebar-width)',
          }}>
            <Topbar />
            <main style={{
              flex: 1,
              overflowY: 'auto',
              padding: '28px 32px',
              background: 'var(--bg-body)',
            }}>
              <StoreHydration>{children}</StoreHydration>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

