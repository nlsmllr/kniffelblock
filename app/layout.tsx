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
  viewportFit: "cover", // Wichtig für die iOS Notch
  themeColor: "#4c4761", // Sagt dem Browser, welche Farbe der Header-Bereich haben soll
};

export const metadata: Metadata = {
  title: "Kniffelblock",
  description: "Kniffelblock",
  icons: {
    icon: [
      { url: "/apple-icon.png" },
      { url: "/apple-icon.png", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    // DAS ist das Zauberwort für iOS-Homescreen-Apps (PWA)!
    // Erlaubt das Zeichnen hinter die Notch.
    statusBarStyle: "black-translucent",
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {/* Body fixiert den Viewport auf exakt 100dvh. 
        overflow-hidden verhindert, dass der Body scrollt (wir scrollen nur die Tabelle).
        select-none verhindert ungewolltes Markieren von Text beim Antippen.
      */}
      <body className="bg-[#4c4761] relative flex h-[100dvh] w-full flex-col overflow-hidden text-gray-900 select-none">
        {/* HINTERGRUND - Global für die ganze App */}
        <div className="fixed inset-0 z-[-1] bg-[#4c4761]">
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

        {/* VORDERGRUND - Behandelt globale "Safe Areas" für Mobile.
          max(1rem, env(...)) sorgt dafür, dass auf normalen Bildschirmen (Desktop) 
          mindestens 1rem Abstand nach oben ist.
        */}
        <div
          className="flex h-full w-full flex-col"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top))",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
