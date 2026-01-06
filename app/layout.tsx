
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JackyWear",
  description: "Calzado disponibles · Pedido directo por WhatsApp",

  metadataBase: new URL("https://jackywear.com"),

  openGraph: {
    title: "JackyWear",
    description:
      "Consulta tallas y colores disponibles. Pedido directo por WhatsApp.",
    url: "https://jackywear.com",
    siteName: "JackyWear",
    images: [
      {
        url: "https://jackywear.com/og.png",
        width: 1200,
        height: 630,
        alt: "JackyWear — Calzado disponibles hoy",
      },
    ],
    locale: "es_MX",
    type: "website",
  },

  icons: {
    icon: "/favicon2.ico",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
