import { Kniffelblock } from "./KniffelBlock";
import Grainient from "./Grainient";

export default function Page() {
  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col font-mono">
      {/* HINTERGRUND: 
        fixed inset-0 spannt den Hintergrund über den gesamten Bildschirm auf,
        inklusive dem Bereich unter der Notch. z-[-1] legt ihn in den Hintergrund.
      */}
      <div className="fixed inset-0 z-[-1] h-full w-full bg-[#4c4761]">
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

      {/* VORDERGRUND: 
        Nutzt 100dvh für dynamische mobile Höhe.
        Padding mit env() sorgt dafür, dass die UI nicht hinter der Notch 
        oder der mobilen Home-Leiste (iOS) verschwindet.
      */}

      <div className="flex-1 overflow-y-auto">
        <Kniffelblock />
      </div>
    </main>
  );
}
