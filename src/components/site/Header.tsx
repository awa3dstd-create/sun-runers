"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background border-b border-border/70 text-foreground shadow-sm"
          : "bg-transparent border-b border-transparent text-background"
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              handleNav("#inicio");
            }}
            className="flex items-center gap-2.5"
            aria-label="SUN-RUNERS — Inicio"
          >
            <Logo className="h-7 sm:h-8" showWordmark={false} />
            <span className="text-[15px] sm:text-base font-semibold tracking-[0.12em] uppercase">
              SUN<span className="text-accent">-</span>RUNERS
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.href);
                }}
                className={cn(
                  "px-3.5 py-2 text-sm transition-colors rounded-md",
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-background/70 hover:text-background"
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button
              size="sm"
              onClick={() => handleNav("#contacto")}
              className={cn(
                "rounded-full px-5 transition-colors",
                scrolled
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-background text-foreground hover:bg-background/90"
              )}
            >
              Solicitar cotización
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -mr-2 mobile-menu-toggle"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — always in DOM, visibility via CSS for standalone HTML compat */}
      <div
        className={cn(
          "lg:hidden bg-background border-b border-border mobile-menu-panel",
          open ? "mobile-menu-open" : "mobile-menu-closed"
        )}
      >
        <nav className="mx-auto max-w-7xl px-5 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className="px-3 py-3 text-base text-foreground hover:bg-muted rounded-md transition-colors mobile-nav-link"
            >
              {item.label}
            </a>
          ))}
          <Button
            className="mt-2 bg-foreground text-background hover:bg-foreground/90 rounded-full mobile-nav-link"
            onClick={() => handleNav("#contacto")}
          >
            Solicitar cotización
          </Button>
        </nav>
      </div>
    </header>
  );
}
