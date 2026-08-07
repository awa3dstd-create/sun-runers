"use client";

import {
  Sun,
  Zap,
  Droplets,
  ClipboardList,
  Wind,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { SERVICES } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Sun,
  Zap,
  Droplets,
  ClipboardList,
  Wind,
};

interface ServicesProps {
  onSelectService: (serviceId: string) => void;
}

export function Services({ onSelectService }: ServicesProps) {
  return (
    <section
      id="servicios"
      className="relative py-24 lg:py-32 bg-background border-t border-border"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16 lg:mb-24">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-accent" />
              <span className="eyebrow text-muted-foreground">Servicios</span>
            </div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="display-2 text-foreground">
              Cinco líneas de
              <br />
              ingeniería, un solo
              <br />
              estándar de ejecución.
            </h2>
            <p className="mt-6 max-w-2xl prose-body">
              Cada servicio se entrega con la misma disciplina: levantamiento
              riguroso, materiales certificados, documentación completa y
              acompañamiento posterior a la puesta en servicio. No hacemos
              instalaciones improvisadas — ejecutamos proyectos.
            </p>
          </div>
        </div>

        {/* Lista de servicios */}
        <div className="border-t border-border">
          {SERVICES.map((service, idx) => {
            const Icon = ICONS[service.icon] ?? Sun;
            return (
              <article
                key={service.id}
                className="group grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 py-10 lg:py-14 border-b border-border hover:bg-muted/40 transition-colors -mx-4 px-4 lg:-mx-8 lg:px-8 rounded-lg"
              >
                {/* Número + ícono */}
                <div className="lg:col-span-3 flex items-start gap-5">
                  <span className="font-mono text-xs text-muted-foreground pt-1.5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center justify-center h-12 w-12 rounded-full border border-border bg-background group-hover:border-accent group-hover:text-accent transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {/* Contenido */}
                <div className="lg:col-span-7">
                  <h3 className="text-xl lg:text-2xl font-medium tracking-tight text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="prose-body mb-6 max-w-2xl">
                    {service.description}
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    {service.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="lg:col-span-2 flex lg:justify-end items-start">
                  <button
                    onClick={() => onSelectService(service.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors group/btn"
                  >
                    Cotizar
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
