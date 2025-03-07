import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SidebarStateManager } from "@/components/SidebarStateManager";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App de Gastos",
  description: "Aplicación para gestionar gastos personales y grupales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <ToastProvider>
            <SidebarProvider>
              <CurrencyProvider>
                <SidebarStateManager />
                {children}
              </CurrencyProvider>
            </SidebarProvider>
          </ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
