import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import * as React from "react";
import { AppShell } from "./AppShell";
import { ErixProvider } from "@/context/ErixProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Erix SDK — Host Integration Demo",
  description:
    "Live demonstration of embedding Erix UI SDK modules within a host application's shell.",
};

const DEV_CONFIG = {
  apiKey:
    process.env.NEXT_PUBLIC_ERIX_CLIENT_API_KEY ??
    process.env.NEXT_PUBLIC_ERIX_API_KEY ??
    "dev",
  clientCode: process.env.NEXT_PUBLIC_ERIX_CLIENT_CODE ?? "dev-preview",
  modules: [
    "editor",
    "crm",
    "analytics",
    "whatsapp",
    "marketing",
    "meetings",
  ] as any,
  theme: "dark" as const,
  disableHealthCheck: true,
  disableNotifications: true,
  branding: { appName: "Erix SDK" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-erix-platform-theme="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErixProvider config={DEV_CONFIG}>
          <AppShell>
            {children}
          </AppShell>
        </ErixProvider>
      </body>
    </html>
  );
}
