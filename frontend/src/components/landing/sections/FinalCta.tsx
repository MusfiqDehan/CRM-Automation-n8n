import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../Reveal";

const craneImage =
  "https://images.unsplash.com/photo-1760187430223-6c89130fa7a8?auto=format&fit=crop&w=2000&q=85";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-stone-950 py-28 text-white sm:py-36">
      <Image src={craneImage} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-50" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/30" />
      <div aria-hidden="true" className="caution-tape absolute inset-x-0 top-0 h-2" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Ready when you are</p>
          <h2 className="mt-5 text-balance text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
            Build the business with the same care you build the work.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
            Launch your branded BeamLine workspace and give your team one place to sell, build, and grow.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-black text-stone-950 shadow-xl shadow-amber-500/25 transition hover:bg-amber-300"
            >
              Open your workspace
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
            >
              Compare plans
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
