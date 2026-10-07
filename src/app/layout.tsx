import type { Metadata, Viewport } from "next";
import { Caveat_Brush, Funnel_Display, Funnel_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Brand type: Funnel Display for headlines, Funnel Sans for everything else (docs/BRAND.md).
const funnelDisplay = Funnel_Display({ variable: "--font-funnel-display", subsets: ["latin"], display: "swap" });
const funnelSans = Funnel_Sans({ variable: "--font-funnel-sans", subsets: ["latin"], display: "swap" });
// Red-pen client markup only (docs/BRAND.md).
const caveatBrush = Caveat_Brush({ variable: "--font-caveat-brush", weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Relaydesk: client approvals for agencies",
    template: "%s | Relaydesk",
  },
  description:
    "Share deliverables with clients, collect approvals in writing and keep every version in one place. A sample SaaS project.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${funnelDisplay.variable} ${funnelSans.variable} ${caveatBrush.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
