import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { QueryProvider } from "@/components/QueryProvider";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Contractor GO 管理后台",
  description: "管理后台",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Contractor GO Admin",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased safe-area-x">
        <ClerkProvider>
          <SignedIn>
            <div className="fixed z-50 top-[max(0.75rem,calc(var(--safe-area-inset-top)+0.25rem))] right-[max(1rem,calc(var(--safe-area-inset-right)+0.5rem))]">
              <UserButton />
            </div>
          </SignedIn>
          <QueryProvider>{children}</QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
