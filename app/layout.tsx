import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Kufi_Arabic, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
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
    <html lang="en" className={`${playfair.variable} ${kufi.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page text-ink">{children}</body>
    </html>
  );
}
