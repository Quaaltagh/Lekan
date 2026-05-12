import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';


export const metadata: Metadata = {
  title: 'LEKAN ',
  description: 'Platform pelelangan ikan digital terpercaya',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}