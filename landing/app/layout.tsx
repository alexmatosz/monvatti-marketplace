import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monvatti Marketplaces — inteligência de anúncios no Mercado Livre, Shopee e Amazon",
  description:
    "Extensão que mostra vendas estimadas, métricas, taxas e margem do anúncio direto na página do marketplace. A ferramenta da Monvatti, consultoria que opera mais de 150 clientes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Satoshi (Fontshare): mesma família do estilo de referência. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
