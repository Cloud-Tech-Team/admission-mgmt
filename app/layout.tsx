import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClientSessionProvider, Providers } from "./providers";

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

export const metadata: Metadata = {
  title: "Nri Application",
  description: "Made using Next js ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}

      >
        <Providers>
          <ClientSessionProvider>{children}</ClientSessionProvider>
        </Providers>
      </body>
    </html>
  );
}
