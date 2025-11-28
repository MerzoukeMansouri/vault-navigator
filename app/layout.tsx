import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/contexts/vault-context";
import { Header } from "@/components/header";
import { TokenDetectionProvider } from "@/components/token-detection-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vault Navigator",
  description: "Modern UI for HashiCorp Vault",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VaultProvider>
          <TokenDetectionProvider>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
            </div>
            <Toaster richColors position="top-right" />
          </TokenDetectionProvider>
        </VaultProvider>
      </body>
    </html>
  );
}
