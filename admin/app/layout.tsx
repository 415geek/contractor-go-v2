import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { QueryProvider } from "@/components/QueryProvider";

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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ClerkProvider>
          <SignedIn>
            <div className="fixed top-3 right-4 z-50">
              <UserButton />
            </div>
          </SignedIn>
          <QueryProvider>{children}</QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
