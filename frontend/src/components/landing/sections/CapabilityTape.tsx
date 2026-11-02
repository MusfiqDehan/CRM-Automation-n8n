import { tapeItems } from "../data";

export function CapabilityTape() {
  const items = [...tapeItems, ...tapeItems];
  return (
    <section aria-label="Capabilities" className="relative z-10 -mt-6 -rotate-1 bg-stone-950 py-0.5 shadow-2xl">
      <div className="caution-tape h-2.5" aria-hidden="true" />
      <div className="group flex overflow-hidden bg-amber-400 py-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <ul className="animate-marquee flex w-max shrink-0 items-center">
          {items.map(({ label, icon: Icon }, index) => (
            <li
              key={`${label}-${index}`}
              aria-hidden={index >= tapeItems.length}
              className="flex items-center gap-3 px-6 text-sm font-black uppercase tracking-[0.14em] text-stone-950 sm:text-base"
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
              <span className="ml-6 size-1.5 rotate-45 bg-stone-950" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
      <div className="caution-tape h-2.5" aria-hidden="true" />
    </section>
  );
}
