import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ErpProvider } from '@/hooks/use-erp';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Industrial ERP',
  description: 'Sistema completo de ERP Industrial para Planejamento de Manufatura (MRP), Compras, Faturamento e NF-e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0b0f17] text-gray-100 antialiased" suppressHydrationWarning>
        <ErpProvider>
          {children}
        </ErpProvider>
      </body>
    </html>
  );
}
