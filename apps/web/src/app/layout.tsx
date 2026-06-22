import type { Metadata } from "next";
import "./globals.css";
import "@moyeorak/design-system/dist/style.css";

export const metadata: Metadata = {
  title: "Fragment 관리자",
  description: "근무 스케줄 운영을 위한 Fragment 관리자 웹",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicons/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicons/favicon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/favicons/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
