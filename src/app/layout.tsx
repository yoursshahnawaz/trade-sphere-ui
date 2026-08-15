import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/error-boundary";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RouteFocus } from "@/components/layout/route-focus";

// Distinctive pairing: characterful serif display + clean geometric-humanist body.
const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const fontSans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Trade-Sphere", template: "%s · Trade-Sphere" },
  description:
    "A multi-vendor e-commerce marketplace — shop across sellers or open your own storefront.",
  openGraph: {
    title: "Trade-Sphere",
    description: "A multi-vendor e-commerce marketplace.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: some browser extensions (e.g. Grammarly)
          inject data-* attributes on <body> before React hydrates. This
          suppresses only <body>'s own attribute mismatch, not the tree. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <Providers>
          <RouteFocus />
          <ErrorBoundary>
            <Header />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
