"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { navLinks } from "../data";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view.
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border px-3 py-2.5 transition-all duration-500 sm:px-4 ${
          solid
            ? "border-stone-200/80 bg-white/80 shadow-lg shadow-stone-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/75"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" aria-label="BeamLine home" className="rounded-xl focus-visible:outline-2 focus-visible:outline-amber-400">
          <BeamLineLogo
            markClassName="size-9"
            wordmarkClassName={`text-base transition-colors ${solid ? "text-stone-950 dark:text-white" : "text-white"}`}
            accentClassName={solid ? "text-amber-600 dark:text-amber-400" : "text-amber-400"}
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = active === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  solid
                    ? isActive
                      ? "text-stone-950 dark:text-white"
                      : "text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white"
                    : isActive
                      ? "text-white"
                      : "text-stone-300 hover:text-white"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left rounded-full bg-amber-400 transition-transform duration-300 ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Link
            href="/admin"
            className="group hidden items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 sm:inline-flex"
          >
            Open workspace
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={`inline-flex size-10 items-center justify-center rounded-xl border transition lg:hidden ${
              solid
                ? "border-stone-200 text-stone-800 dark:border-white/10 dark:text-white"
                : "border-white/20 text-white"
            }`}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-stone-200 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-500 lg:hidden dark:border-white/10 dark:bg-stone-950/95 ${
          open ? "max-h-[32rem] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="grid gap-1 p-3">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-bold text-stone-800 transition hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-white/5 ${
                open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
            >
              {link.label}
              <ArrowRight className="size-4 text-amber-500" aria-hidden="true" />
            </Link>
          ))}
          <Link
            href="/admin"
            tabIndex={open ? 0 : -1}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3.5 text-base font-black text-stone-950"
          >
            Open workspace
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
