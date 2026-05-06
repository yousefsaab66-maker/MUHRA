"use client";

import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { AuthProvider } from "./AuthProvider";
import { LocaleProvider } from "./LocaleProvider";
import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <StoreProvider>
          <AuthProvider>
            {children}
            <WhatsAppFab />
          </AuthProvider>
        </StoreProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
