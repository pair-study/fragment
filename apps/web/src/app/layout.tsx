import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "일감 관리자",
  description: "근무 스케줄 편성과 급여 정산을 자동화하는 관리자 웹",
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
