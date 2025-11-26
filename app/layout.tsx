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
  title: "Jacky Crocs",
  description: "Crocs disponibles en Tijuana · Pedido directo por WhatsApp",

  metadataBase: new URL("https://jackycrocs.com"),

  openGraph: {
    title: "Jacky Crocs",
    description:
      "Consulta tallas y colores disponibles. Pedido directo por WhatsApp.",
    url: "https://jackycrocs.com",
    siteName: "Jacky Crocs",
    images: [
      {
        url: "/og.jpg", // we'll add this next
        width: 1200,
        height: 630,
        alt: "Jacky Crocs — Crocs disponibles hoy",
      },
    ],
    locale: "es_MX",
    type: "website",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* ✅ Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
