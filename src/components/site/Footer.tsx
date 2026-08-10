"use client";

import { Logo } from "./Logo";
import { COMPANY, NAV_ITEMS, SERVICES } from "@/lib/site-data";

interface FooterProps {
  onNavClick: (href: string) => void;
}

export function Footer({ onNavClick }: FooterProps) {
  return (
    <footer className="bg-foreground text-background border-t border-foreground">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Marca */}
          <div className="md:col-span-5">
            <div className="flex flex-col items-start gap-3">
              <Logo className="h-12 sm:h-14 w-auto" showWordmark={false} variant="light" />
              <span className="text-lg sm:text-xl font-semibold tracking-[0.14em] uppercase text-background">
                SUN<span className="text-accent">-</span>RUNERS
              </span>
            </div>
            <p className="mt-6 max-w-sm text-sm text-background/60 leading-relaxed">
              {COMPANY.tagline} {COMPANY.description.split(".")[0]}.
            </p>
            <p className="mt-6 text-xs text-background/40">
              {COMPANY.legalName}
              <br />
              {COMPANY.city}
            </p>
          </div>

          {/* Navegación */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-background/50 mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavClick(item.href);
                    }}
                    className="text-sm text-background/80 hover:text-background transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-background/50 mb-4">
              Servicios
            </h4>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <a
                    href="#servicios"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavClick("#servicios");
                    }}
                    className="text-sm text-background/80 hover:text-background transition-colors"
                  >
                    {s.short}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-16 pt-8 border-t border-background/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} {COMPANY.name}. Todos los derechos
            reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-background/40">
            <span>{COMPANY.hours}</span>
            <span className="hidden sm:inline">·</span>
            <a
              href={`mailto:${COMPANY.email}`}
              className="hover:text-background transition-colors"
            >
              {COMPANY.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
