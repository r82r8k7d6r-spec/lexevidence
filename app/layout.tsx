import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import UserNav from "@/components/UserNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "弁護士提出用 証拠資料作成システム",
  description: "不倫慰謝料請求のための弁護士提出用資料をAIが自動生成するシステム",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="ja"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body className="min-h-full flex flex-col">
        {user && (
          <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between print:hidden">
            <span className="text-sm font-semibold text-gray-800">証拠資料作成システム</span>
            <UserNav email={user.email ?? ""} />
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
