"use client";

import { ArrowUpRight, ArrowDown } from "lucide-react";
import { COMPANY } from "@/lib/site-data";

export function Hero() {
  const scrollToServices = () => {
    document
      .querySelector("#servicios")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document
      .querySelector("#contacto")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="inicio"
      className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-foreground text-background"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <img
          src="/assets/hero.jpg"
          alt="Instalación fotovoltaica SUN-RUNERS al atardecer"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/70 to-foreground/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-transparent to-transparent" />
      </div>

      {/* Contenido */}
      <div className="relative mx-auto max-w-7xl w-full px-5 sm:px-8 lg:px-12 pb-16 pt-32 lg:pb-24">
        <div className="max-w-4xl fade-up">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 bg-accent" />
            <span className="eyebrow text-background/70">
              {COMPANY.city}
            </span>
          </div>

          <h1 className="display-1 text-background">
            Ingeniería
            <br />
            que <span className="italic text-accent">perdura</span>.
          </h1>

          <p className="mt-8 max-w-2xl text-lg sm:text-xl text-background/75 leading-relaxed">
            {COMPANY.description}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={scrollToContact}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-medium text-foreground hover:bg-background/90 transition-all"
            >
              Solicitar cotización
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button
              onClick={scrollToServices}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-background/30 px-7 py-3.5 text-sm font-medium text-background hover:bg-background/10 transition-all"
            >
              Ver servicios
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <button
        onClick={scrollToServices}
        className="absolute bottom-6 right-6 lg:right-12 hidden sm:flex flex-col items-center gap-2 text-background/60 hover:text-background transition-colors"
        aria-label="Desplazar hacia abajo"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </button>
    </section>
  );
}
