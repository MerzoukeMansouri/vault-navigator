import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/contexts/vault-context";
import { Sidebar, MobileHeader } from "@/components/sidebar";
import { TokenDetectionProvider } from "@/components/token-detection-provider";
import { ReleaseNotes } from "@/components/release-notes";
import { Toaster } from "sonner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { MotionProvider } from "@/components/motion-provider";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Vault Navigator",
  description: "Modern UI for HashiCorp Vault",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vault Navigator",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", ibmPlexSans.variable, spaceGrotesk.variable)}>
      <body className={ibmPlexSans.className}>
        <MotionProvider>
          <VaultProvider>
            <TokenDetectionProvider>
              <div className="min-h-screen bg-background md:flex">
                <Sidebar />
                <MobileHeader />
                <main className="flex-1 min-w-0 md:pl-56">
                  <ReleaseNotes />
                  {children}
                </main>
              </div>
              <Toaster richColors position="top-right" />
              <PWAInstallPrompt />
            </TokenDetectionProvider>
          </VaultProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
