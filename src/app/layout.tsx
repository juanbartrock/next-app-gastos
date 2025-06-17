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
import { OnboardingProvider } from "@/contexts/OnboardingContext";
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
  title: "FinanzIA - Gestión Inteligente de Gastos",
  description: "Aplicación de gestión de gastos personales y familiares con inteligencia artificial integrada",
  keywords: ["finanzas", "gastos", "presupuesto", "inteligencia artificial", "ahorro", "argentina"],
  authors: [{ name: "FinanzIA" }],
  creator: "FinanzIA",
  publisher: "FinanzIA",
  icons: {
    icon: [
      { url: "/FinanzIA-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/FinanzIA-logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/FinanzIA-logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/FinanzIA-logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "FinanzIA - Gestión Inteligente de Gastos",
    description: "Aplicación de gestión de gastos personales y familiares con inteligencia artificial integrada",
    url: "https://finanzai.vercel.app",
    siteName: "FinanzIA",
    images: [
      {
        url: "/FinanzIA-logo.png",
        width: 400,
        height: 400,
        alt: "FinanzIA Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanzIA - Gestión Inteligente de Gastos",
    description: "Aplicación de gestión de gastos personales y familiares con inteligencia artificial integrada",
    images: ["/FinanzIA-logo.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#6366f1",
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
                      <OnboardingProvider>
                        <SidebarStateManager />
                        {children}
                      </OnboardingProvider>
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
