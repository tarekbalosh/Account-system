// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import SidebarWrapper from "@/components/layout/sidebar-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accounting Pro | Restaurant Financial System",
  description: "End-to-end accounting management for modern restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-200 antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <SidebarWrapper>
              {children}
            </SidebarWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
