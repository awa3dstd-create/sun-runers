"use client";

import Image from "next/image";
import { BRANDS } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function Technologies() {
  // Separar marcas con imagen de las que no tienen
  const withImage = BRANDS.filter((b) => b.image);
  const withoutImage = BRANDS.filter((b) => !b.image);

  return (
    <section
      id="tecnologias"
      className="relative py-24 lg:py-32 bg-foreground text-background"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-accent" />
              <span className="eyebrow text-background/60">Tecnologías</span>
            </div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="display-2 text-background">
              Trabajamos con las marcas
              <br />
              que <span className="italic text-accent">realmente</span> circulan
              en Cuba.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-background/70 leading-relaxed">
              Conocemos en profundidad cada plataforma: sus puntos fuertes, sus
              limitaciones y cómo sacarles el máximo en el contexto cubano —
              voltajes 110/220 V, sistemas split-phase 120/240 V, química
              LiFePO4 y los apagones recurrentes del sistema nacional.
            </p>
          </div>
        </div>

        {/* Grid de tarjetas con imagen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {withImage.map((brand) => (
            <article
              key={brand.name}
              className="group relative bg-background/5 border border-background/15 rounded-lg overflow-hidden hover:bg-background/10 hover:border-accent/40 transition-all"
            >
              {/* Imagen del equipo */}
              <div className="relative aspect-square bg-background/10 overflow-hidden">
                <Image
                  src={brand.image!}
                  alt={`${brand.name} — ${brand.lines}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="text-base font-medium tracking-tight text-background">
                    {brand.name}
                  </h3>
                  <span className="text-[10px] text-background/50 font-mono uppercase tracking-wider shrink-0">
                    {brand.origin}
                  </span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-background/20 text-[10px] text-background/80 font-mono mb-3">
                  {brand.category}
                </span>
                <p className="text-xs text-background/70 font-mono mb-2 leading-relaxed">
                  {brand.lines}
                </p>
                <p className="text-xs text-background/60 leading-relaxed">
                  {brand.notes}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Marcas sin imagen — lista compacta */}
        {withoutImage.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-6 bg-background/30" />
              <span className="text-xs font-mono uppercase tracking-wider text-background/50">
                Otras marcas disponibles
              </span>
              <span className="h-px flex-1 bg-background/15" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {withoutImage.map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-baseline justify-between gap-3 py-2 px-3 border border-background/10 rounded text-sm"
                >
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-medium text-background/90">
                      {brand.name}
                    </span>
                    <span className="text-[10px] text-background/40 font-mono shrink-0">
                      {brand.origin}
                    </span>
                  </div>
                  <span className="text-[10px] text-background/50 font-mono shrink-0">
                    {brand.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-12 text-sm text-background/50 max-w-3xl leading-relaxed">
          La selección final de marcas y modelos depende del consumo, autonomía
          requerida, presupuesto y disponibilidad de inventario en el momento
          del proyecto. Te asesoramos sin sesgo de marca.
        </p>
      </div>
    </section>
  );
}
