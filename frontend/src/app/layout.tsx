import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Toaster } from "sonner";
import "./globals.css";

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
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <footer className="px-6 py-12 bg-muted/50 text-muted-foreground border-t">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">TradeX</span>
              </div>
              <div className="text-sm">© 2024 TradeX. All rights reserved.</div>
            </div>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
