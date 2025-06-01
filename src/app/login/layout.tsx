import type { Metadata } from "next";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Iniciar Sesión - App de Gastos",
  description: "Inicia sesión en tu cuenta",
};

export default function LoginLayout({
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