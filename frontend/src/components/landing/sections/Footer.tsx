import Link from "next/link";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";

const columns = [
  { title: "Product", links: [["Platform", "#platform"], ["Integrations", "#integrations"], ["Multi-tenant", "#tenants"], ["Pricing", "#pricing"]] },
  { title: "Company", links: [["How it works", "#process"], ["Growth", "#growth"], ["FAQ", "#faq"]] },
  { title: "Workspace", links: [["Open workspace", "/admin"], ["Sign in", "/admin"]] },
];

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div className="max-w-sm">
          <BeamLineLogo href="/" tone="amber" markClassName="size-11" wordmarkClassName="text-xl text-white" accentClassName="text-amber-400" />
          <p className="mt-5 text-sm leading-6">
            The multi-tenant construction operating system for builders who want to sell smarter, build calmer, and grow on purpose.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-black text-white">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm transition hover:text-amber-400">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} BeamLine. Construction operations, connected.</p>
          <p className="font-mono">Built for builders.</p>
        </div>
      </div>
    </footer>
  );
}
