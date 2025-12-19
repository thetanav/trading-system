import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "@/components/provider";
import { Nav } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TradeX",
  description: "Trading System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen max-w-9xl mx-auto bg-background text-foreground">
        <Providers>
          <Nav />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
