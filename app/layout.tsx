import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Portfolio RDP TOTAL RETURN',
  description: 'Screening de FIAs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#D9D9D9] text-slate-900">
        <header className="sticky top-0 z-50 border-b border-[#003C4C] bg-[#003C4C] text-white shadow-sm">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-bold tracking-wide">
                PORTFOLIO RDP TOTAL RETURN
              </Link>

              <nav className="flex items-center gap-5 text-sm">
                <Link href="/" className="text-slate-100 hover:text-white">
                  Portfolio
                </Link>
                <Link href="/metrics" className="text-slate-200 hover:text-white">
                  Metrics
                </Link>
                <Link href="/ranking" className="text-slate-200 hover:text-white">
                  Ranking
                </Link>
                <Link href="/backtest" className="text-slate-200 hover:text-white">
                  Backtest
                </Link>
              </nav>
            </div>

            <div className="text-xs font-medium text-slate-300">
              Rio das Pedras Investimentos
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-6 py-8">{children}</main>
      </body>
    </html>
  );
}