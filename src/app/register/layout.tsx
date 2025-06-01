import type { Metadata } from "next";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Registro - App de Gastos",
  description: "Crea tu cuenta nueva",
};

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextAuthProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </NextAuthProvider>
  );
} 