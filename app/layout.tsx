import type { Metadata } from "next";
import localFont from "next/font/local";
import { Alice, Montserrat } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import CursorGlow from "@/components/layout/CursorGlow";
import ThemeToggle from "@/components/layout/ThemeToggle";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const body = Montserrat({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Alice({ subsets: ["latin"], weight: "400", variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: "NyayaSetu: report civic issues, track them to resolution",
  description: "Geo-tagged civic issue reporting with explainable priority scores and a public resolution tracker.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${body.variable} ${heading.variable} antialiased`}
      >
        <ThemeToggle />
        <CursorGlow />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
