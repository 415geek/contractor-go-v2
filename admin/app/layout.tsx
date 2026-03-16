import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Contractor GO 管理后台",
  description: "管理后台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="zh-CN" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
