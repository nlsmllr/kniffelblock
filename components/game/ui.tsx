import Link from "next/link";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="mb-4 flex items-stretch justify-between gap-3 border-b-[3px] border-ink pb-3">
      <Link href="/" className="group flex shrink-0 items-end gap-2">
        <h1 className="font-display -rotate-3 text-4xl leading-none uppercase sm:text-6xl">
          Kniffe<span className="text-signal">l</span>
        </h1>
        <span className="mb-0.5 hidden border-2 border-ink bg-mint px-1.5 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase sm:inline">
          5 Würfel · 13 Felder
        </span>
      </Link>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </header>
  );
}

const press =
  "transition-[transform,box-shadow] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none";

export const iconButton = `inline-flex items-center gap-1.5 border-[3px] border-ink bg-paper px-2.5 py-2 text-sm font-bold uppercase shadow-hard-sm hover:bg-pop focus:outline-none focus-visible:bg-pop disabled:opacity-40 ${press}`;

export const primaryButton = `inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-lavender px-4 py-3 text-sm font-bold tracking-widest text-ink uppercase shadow-hard hover:bg-sky focus:outline-none focus-visible:bg-sky disabled:border-mute disabled:bg-stone disabled:text-mute disabled:shadow-none ${press}`;

export const secondaryButton = `inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-paper px-4 py-3 text-sm font-bold tracking-widest uppercase shadow-hard hover:bg-pop focus:outline-none focus-visible:bg-pop disabled:opacity-40 ${press}`;

export const inputClass =
  "w-full border-[3px] border-ink bg-white/70 px-3 py-2.5 text-base text-ink outline-none placeholder:text-mute focus:bg-white focus:shadow-hard";

export function Card({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`flex flex-col gap-3 border-[3px] border-ink p-4 shadow-hard ${
        accent ? "bg-stone" : "bg-paper"
      }`}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="font-display flex items-center gap-2 text-2xl leading-none uppercase">
      {icon && <span className="border-2 border-ink bg-coral p-1">{icon}</span>}
      {children}
    </h2>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold shadow-hard-sm">
      {children}
    </p>
  );
}
