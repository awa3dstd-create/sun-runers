"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { PORTFOLIO } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Todos",
  ...Array.from(new Set(PORTFOLIO.map((p) => p.category))),
];

interface PortfolioProps {
  onContactClick: () => void;
}

export function Portfolio({ onContactClick }: PortfolioProps) {
  const [active, setActive] = useState("Todos");

  const items =
    active === "Todos"
      ? PORTFOLIO
      : PORTFOLIO.filter((p) => p.category === active);

  return (
    <section
      id="trabajos"
      className="relative py-24 lg:py-32 bg-background border-t border-border"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12 lg:mb-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-accent" />
              <span className="eyebrow text-muted-foreground">Trabajos</span>
            </div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="display-2 text-foreground">
              Ejecución real,
              <br />
              documentada y sin
              <br />
              <span className="italic text-accent">atribución individual</span>.
            </h2>
            <p className="mt-6 max-w-2xl prose-body">
              Todos los trabajos pertenecen a la compañía. Mostramos el resultado
              de la ejecución, no a quién lo hizo — porque la calidad es colectiva
              y la responsabilidad también. Cada proyecto queda respaldado por
              memoria técnica y garantía.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                active === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {items.map((item, idx) => (
            <article
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-card border border-border transition-all hover:border-foreground/30",
                idx % 3 === 0 && "md:col-span-2"
              )}
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-mono text-accent uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="mt-2 text-xl lg:text-2xl font-medium tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:rotate-45 transition-all" />
                </div>
                <p className="prose-body mb-4">{item.description}</p>
                <span className="text-xs font-mono text-muted-foreground">
                  📍 {item.location}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA inferior */}
        <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8 lg:p-10 rounded-2xl bg-foreground text-background">
          <div>
            <h3 className="display-3 text-background">
              ¿Tu próximo proyecto?
            </h3>
            <p className="mt-2 text-background/70">
              Cuéntanos qué necesitas y te enviamos una propuesta técnica y
              económica en menos de 24 horas hábiles.
            </p>
          </div>
          <button
            onClick={onContactClick}
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-background/90 transition-all"
          >
            Iniciar proyecto
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
