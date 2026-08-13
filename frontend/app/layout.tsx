// Ye app ka main layout aur providers setup karta hai (Sets up main layout and providers)
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { QueryProvider } from '@/context/QueryProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'ChatNest',
  description: 'Secure, Privacy-Styled Real-Time Messaging Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className="dark">
      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] h-screen w-screen overflow-hidden">
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" theme="dark" richColors />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
