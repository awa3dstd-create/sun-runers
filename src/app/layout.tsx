import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sun-runners.cu"),
  title: {
    default: "SUN-RUNNERS · Ingeniería en energía, automatización y clima",
    template: "%s · SUN-RUNNERS",
  },
  description:
    "Diseño, instalación y mantenimiento de sistemas fotovoltaicos con respaldo de batería, instalaciones eléctricas residenciales, automatización de bombeo y soluciones de clima. Ingeniería ejecutada con precisión en toda Cuba.",
  keywords: [
    "SUN-RUNNERS",
    "sistemas fotovoltaicos Cuba",
    "energía solar Cuba",
    "inversores solares Cuba",
    "baterías litio Cuba",
    "instalación eléctrica residencial",
    "automatización bombeo",
    "clima inverter",
    "apagones Cuba",
    "MUST Sunri Deye Growatt Pylontech",
  ],
  authors: [{ name: "SUN-RUNNERS" }],
  creator: "SUN-RUNNERS",
  publisher: "SUN-RUNNERS",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_CU",
    url: "https://sun-runners.cu",
    siteName: "SUN-RUNNERS",
    title: "SUN-RUNNERS · Ingeniería en energía, automatización y clima",
    description:
      "Sistemas fotovoltaicos con respaldo de batería, instalaciones eléctricas, automatización de bombeo y soluciones de clima. Toda Cuba.",
    images: [
      {
        url: "/assets/hero.jpg",
        width: 1344,
        height: 768,
        alt: "Instalación fotovoltaica SUN-RUNNERS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SUN-RUNNERS · Ingeniería en energía",
    description:
      "Sistemas fotovoltaicos con respaldo de batería, instalaciones eléctricas y soluciones de clima en toda Cuba.",
    images: ["/assets/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
