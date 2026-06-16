import { Kniffelblock } from "./KniffelBlock";

export default function Page() {
  return (
    // 'flex', 'flex-col' und 'h-full' hinzugefügt!
    <main className="font-mono flex flex-col h-full w-full">
      <Kniffelblock />
    </main>
  );
}
