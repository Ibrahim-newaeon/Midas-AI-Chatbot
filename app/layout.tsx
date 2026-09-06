import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Noto_Sans_Arabic, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Midas AI — Website shopping assistant",
  description:
    "Phase 1 website widget for Midas Furniture. Live Magento catalog across Kuwait, Qatar, KSA, Jordan, and Bahrain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${arabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
