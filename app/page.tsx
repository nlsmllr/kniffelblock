import Grainient from "./Grainient";
import { Kniffelblock } from "./KniffelBlock";

export default function Page() {
  return (
    <main className="font-mono">
      <Grainient
        color1="#e6e6fa"
        color2="#9ca8e8"
        color3="#6e88a6"
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

      <Kniffelblock />
    </main>
  );
}
