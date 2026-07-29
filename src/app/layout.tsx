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
  title: { default: "Hiera | LuckPerms, made legible", template: "%s | Hiera" },
  description:
    "Estudio local-first para inspeccionar backups de LuckPerms, entender herencias y construir plantillas de permisos trazables.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Hiera",
    title: "Hiera | LuckPerms, made legible",
    description:
      "Entiende permisos, grupos y herencias de LuckPerms sin entregar tus datos.",
    images: [
      {
        url: "/hiera-og.png",
        width: 1200,
        height: 640,
        alt: "Hiera: permisos de LuckPerms legibles y locales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiera | LuckPerms, made legible",
    description:
      "Entiende permisos, grupos y herencias de LuckPerms sin entregar tus datos.",
    images: ["/hiera-og.png"],
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
