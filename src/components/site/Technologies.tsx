"use client";

import { BRANDS } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function Technologies() {
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

        {/* Tabla de marcas */}
        <div className="border-t border-background/15">
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="grid grid-cols-12 gap-4 py-6 border-b border-background/15 hover:bg-background/5 transition-colors"
            >
              <div className="col-span-12 sm:col-span-3">
                <span className="text-lg font-medium tracking-tight">
                  {brand.name}
                </span>
                <span className="block text-xs text-background/50 mt-1 font-mono">
                  {brand.origin}
                </span>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-background/20 text-[11px] text-background/80 font-mono">
                  {brand.category}
                </span>
              </div>
              <div className="col-span-6 sm:col-span-3 text-sm text-background/70 font-mono">
                {brand.lines}
              </div>
              <div className="col-span-12 sm:col-span-4 text-sm text-background/70 leading-relaxed">
                {brand.notes}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-background/50 max-w-3xl leading-relaxed">
          La selección final de marcas y modelos depende del consumo, autonomía
          requerida, presupuesto y disponibilidad de inventario en el momento
          del proyecto. Te asesoramos sin sesgo de marca.
        </p>
      </div>
    </section>
  );
}
