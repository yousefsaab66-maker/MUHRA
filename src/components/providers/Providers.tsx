"use client";

import { AuthProvider } from "./AuthProvider";
import { LocaleProvider } from "./LocaleProvider";
import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <StoreProvider>
          <AuthProvider>{children}</AuthProvider>
        </StoreProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
