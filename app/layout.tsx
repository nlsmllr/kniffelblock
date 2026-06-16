import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Grainient from "./Grainient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Sorgt dafür, dass der Inhalt bis in die Ränder (Notch) ragt
};

export const metadata: Metadata = {
  title: "Kniffelblock",
  description: "Kniffelblock",
  icons: {
    icon: [
      {
        url: "/apple-icon.png",
      },
      {
        url: "/apple-icon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Macht die Statusleiste transparent, wenn als PWA installiert
    title: "Kniffelblock",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        {/* HINTERGRUND-EBENE */}
        <div className="fixed inset-0 z-[-1] w-full h-full pointer-events-none">
          <Grainient
            color1="#FF9FFC"
            color2="#4c4761"
            color3="#B497CF"
            timeSpeed={0.5}
            colorBalance={0}
            warpStrength={3.5}
            warpFrequency={12}
            warpSpeed={6}
            warpAmplitude={71}
            blendAngle={136}
            blendSoftness={0.09}
            rotationAmount={1440}
            noiseScale={0.5}
            grainAmount={0.11}
            grainScale={6.6}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1.2}
            centerX={0}
            centerY={0}
            zoom={1.2}
          />
        </div>

        {/* EIGENTLICHER INHALT */}
        {children}
      </body>
    </html>
  );
}
