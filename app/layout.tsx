import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';
import { DebugProvider } from '@/lib/debug-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Practa AI — Practice Sales. Close More Deals.',
  description:
    'AI-powered sales training. Practice real sales conversations with lifelike AI prospects and get instant, structured feedback.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <DebugProvider>
            {children}
            <Toaster theme="dark" />
          </DebugProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
