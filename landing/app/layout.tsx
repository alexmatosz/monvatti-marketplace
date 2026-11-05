import type { Metadata } from "next";
import { Sora, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const display = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Monvatti Marketplaces — inteligência de anúncios no Mercado Livre, Shopee e Amazon",
  description:
    "Extensão que mostra vendas estimadas, métricas, taxas e margem do anúncio direto na página do marketplace. A ferramenta da Monvatti, consultoria que opera mais de 150 clientes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
