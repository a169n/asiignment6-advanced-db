import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode, Suspense } from "react";
import { QueryProvider } from "@/components/layout/query-provider";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Advanced DB Commerce",
  description: "Product discovery with personalized recommendations"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <Suspense fallback={<div className="h-16 border-b border-slate-800 bg-slate-900/80" />}>
              <Header />
            </Suspense>
            <main className="flex-1 w-full">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
