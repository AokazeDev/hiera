import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hiera.symera.cloud"),
  title: {
    default: "Hiera | Editor local de LuckPerms",
    template: "%s | Hiera",
  },
  description:
    "Editor gratuito, local y sin cuenta para inspeccionar backups de LuckPerms, entender herencias y consultar catálogos de permisos con fuente.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Hiera",
    title: "Hiera | Editor local de LuckPerms",
    description:
      "Editor gratuito y sin cuenta para entender permisos, grupos y herencias de LuckPerms sin subir tu backup.",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "Hiera: editor local de LuckPerms gratis, local y sin cuenta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiera | Editor local de LuckPerms",
    description:
      "Editor gratuito y sin cuenta para entender permisos, grupos y herencias de LuckPerms sin subir tu backup.",
    images: [
      {
        url: "/og-home.png",
        alt: "Hiera: editor local de LuckPerms gratis, local y sin cuenta",
      },
    ],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#e8e5dd",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
