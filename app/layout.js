import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { TradingProvider } from '../context/TradingContext';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'FEIN TRADE – Premium Paper Trading Terminal',
  description: 'Practice trading stocks, crypto, and forex on a premium institutional-grade paper trading terminal. Real-time simulated prices, AI assistant, and a full trade journal.',
  keywords: 'paper trading, stock market simulator, crypto trading, forex demo, NEPSE simulator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <head>
        {/* FontAwesome 6 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <TradingProvider>
          {children}
        </TradingProvider>
      </body>
    </html>
  );
}
