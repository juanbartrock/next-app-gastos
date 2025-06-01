import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { VisibilityProvider } from "@/contexts/VisibilityContext";
import { PermisosFamiliaresProvider } from "@/contexts/PermisosFamiliaresContext";
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
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <SidebarProvider>
                <CurrencyProvider>
                  <VisibilityProvider>
                    <PermisosFamiliaresProvider>
                      <SidebarStateManager />
                      {children}
                    </PermisosFamiliaresProvider>
                  </VisibilityProvider>
                </CurrencyProvider>
              </SidebarProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
