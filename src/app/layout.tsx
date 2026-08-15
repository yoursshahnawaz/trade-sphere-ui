import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/error-boundary";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RouteFocus } from "@/components/layout/route-focus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trade-Sphere",
  description: "Multi-vendor e-commerce marketplace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
