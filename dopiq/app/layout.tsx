import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Dopiq — dopamine without the damage",
  description:
    "Simulate shopping, food delivery, and sports betting with fake money. Get the dopamine hit without touching your bank account.",
  applicationName: "Dopiq",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Dopiq" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
