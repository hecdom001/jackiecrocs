
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import {RootCartProvider} from "@/components/store/RootCartProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aguuacatito.shop",
  description: "Calzado disponibles · Pedido directo por WhatsApp",

  metadataBase: new URL("https://Aguuacatito.shop"),

  openGraph: {
    title: "Aguuacatito.shop",
    description:
      "Consulta tallas y colores disponibles. Pedido directo por WhatsApp.",
    url: "https://Aguuacatito.shop",
    siteName: "Aguuacatito.shop",
    images: [
      {
        url: "https://Aguuacatito.shop/og-v3.png",
        width: 1200,
        height: 630,
        alt: "Aguuacatito — Calzado y Estilo",
      },
    ],
    locale: "es_MX",
    type: "website",
  },

  icons: {
    icon: "/og-v3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <RootCartProvider>
          { children}
          </RootCartProvider>
        <Analytics />
      </body>
    </html>
  );
}
