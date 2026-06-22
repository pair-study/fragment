import type { Metadata } from "next";
import "./globals.css";
import "@moyeorak/design-system/dist/style.css";

export const metadata: Metadata = {
  title: "프래그먼트",
  description: "근무 스케줄 편성과 확정 이력 관리를 돕는 도구",
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
