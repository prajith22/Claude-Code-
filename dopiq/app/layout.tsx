import type { Metadata, Viewport } from "next";
import {
  Sora,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Sniglet,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Editorial serif used sparingly on Shop — magazine-style page title
// + curated category tiles. Lighter weights (400/500) give the
// Anthropologie / Free People feel; heavier weights would compete
// with the sans-serif body.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500"],
});

// Playful rounded display face — layered IN on satirical / emotional
// copy + the Shop/Food category pills. Sora stays the primary
// editorial voice; this never becomes the body font. Sniglet ships
// only 400 + 800 on Google Fonts.
const sniglet = Sniglet({
  subsets: ["latin"],
  variable: "--font-sniglet",
  display: "swap",
  weight: ["400", "800"],
});

// Modern geometric sans with quirky character — used only on the
// Shop/Food category filter pills (design-engineer aesthetic).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dopiq — dopamine without the damage",
  description:
    "Simulate shopping, food delivery, and sports betting with fake money. Get the dopamine hit without touching your bank account.",
  applicationName: "Dopiq",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dopiq",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5EFE4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${sniglet.variable} ${spaceGrotesk.variable}`}
    >
      <body className="text-ink antialiased">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}`,
          }}
        />
      </body>
    </html>
  );
}
