import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terraforma",
  description: "Cada dia sem apostar devolve vida ao planeta.",
};

export const viewport: Viewport = {
  themeColor: "#06100d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Suspense: o next.config usa cacheComponents, que exige isso em volta de
            hooks como useSearchParams e de estado que só existe no navegador. */}
        <Suspense fallback={null}>
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
