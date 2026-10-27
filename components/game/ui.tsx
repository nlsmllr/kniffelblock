import Link from "next/link";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="mb-3 flex items-center justify-between gap-3">
      <Link href="/" className="shrink-0">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-lime-800 sm:text-4xl">
          KNIFFE<span className="text-red-700">L</span>
        </h1>
      </Link>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </header>
  );
}

export const iconButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-lime-300 bg-orange-50 px-3 py-2 text-sm font-medium text-lime-800 transition-colors hover:bg-lime-800 hover:text-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-800 disabled:opacity-50";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-lime-800 px-4 py-3 text-sm font-bold text-orange-50 transition-colors hover:bg-lime-900 disabled:bg-lime-800/30";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-lime-800 bg-orange-50 px-4 py-3 text-sm font-bold text-lime-800 transition-colors hover:bg-lime-100 disabled:opacity-50";

export const inputClass =
  "w-full rounded-xl border-2 border-lime-300 bg-white px-3 py-2.5 text-base text-lime-900 outline-none placeholder:text-lime-800/40 focus:border-lime-800";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-red-700 bg-orange-50 p-4">
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
    <h2 className="flex items-center gap-2 text-lg font-bold text-red-700">
      {icon}
      {children}
    </h2>
  );
}
