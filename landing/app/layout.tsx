import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Satoshi (Fontshare, licença livre para uso comercial) servida pelo próprio site:
   sem CSS externo bloqueando a renderização, com pré-carregamento e fallback ajustado
   (menos salto de layout). Só os 4 pesos que a página já usava. */
const satoshi = localFont({
  src: [
    { path: "./fontes/satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./fontes/satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./fontes/satoshi-700.woff2", weight: "700", style: "normal" },
    { path: "./fontes/satoshi-900.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: "Monvatti Marketplaces — inteligência de anúncios no Mercado Livre, Shopee e Amazon",
  description:
    "Extensão que mostra vendas estimadas, métricas, taxas e margem do anúncio direto na página do marketplace. A ferramenta da Monvatti, consultoria que opera mais de 150 clientes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={satoshi.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
