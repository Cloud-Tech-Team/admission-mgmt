"use client";

import { ToastProvider } from "@heroui/react";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <NextThemesProvider 
          attribute="class" 
          defaultTheme="light"
        >
          <ToastProvider />
          {children}
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}

export const ClientSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};
