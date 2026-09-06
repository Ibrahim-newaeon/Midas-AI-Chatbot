import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
