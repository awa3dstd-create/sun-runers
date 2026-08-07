"use client";

import { ENGINEERS_PUBLIC, COMPANY } from "@/lib/site-data";
import { cn } from "@/lib/utils";

interface AboutProps {
  onContactClick: () => void;
}

export function About({ onContactClick }: AboutProps) {
  return (
    <section
      id="conocenos"
      className="relative py-24 lg:py-32 bg-background border-t border-border"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16 lg:mb-24">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-accent" />
              <span className="eyebrow text-muted-foreground">Conócenos</span>
            </div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="display-2 text-foreground">
              Ingenieros que
              <br />
              <span className="italic text-accent">firman</span> su trabajo.
            </h2>
            <p className="mt-6 max-w-2xl prose-body">
              Somos un equipo de ingenieros electricistas y automáticos con
              experiencia comprobada en el sector energético cubano. Cada
              instalación lleva la firma técnica de quien la ejecutó y la
              garantía colectiva de la compañía.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-6">
              <Stat value="+15" label="Años de experiencia combinada" />
              <Stat value="+200" label="Proyectos ejecutados" />
              <Stat value="6" label="Provincias cubiertas" />
            </div>
          </div>
        </div>

        {/* Grid de ingenieros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {ENGINEERS_PUBLIC.map((eng) => (
            <article
              key={eng.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all"
            >
              {/* Foto o monograma */}
              <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                {eng.photo ? (
                  <img
                    src={eng.photo}
                    alt={eng.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-foreground text-background">
                    <span className="text-7xl font-medium tracking-tight">
                      {eng.initials}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-xs font-mono text-background/80 uppercase tracking-wider">
                    {eng.role}
                  </span>
                  <h3 className="mt-1 text-lg font-medium text-background">
                    {eng.name}
                  </h3>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col flex-1">
                {eng.experienceYears > 0 && (
                  <div className="mb-3 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {eng.experienceYears} años de experiencia
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {eng.bio}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {eng.specialties.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Manifiesto */}
        <div className="mt-16 lg:mt-24 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <span className="eyebrow text-muted-foreground">Manifiesto</span>
            <h3 className="mt-4 display-3 text-foreground">
              Cómo trabajamos.
            </h3>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <ManifestoItem
              num="01"
              title="Levantamiento antes que presupuesto"
              text="No cotizamos a ciegas. Antes de cualquier propuesta económica hacemos levantamiento en sitio, medición de cargas y diagnóstico de la instalación existente. La precisión del diagnóstico determina la calidad de la instalación."
            />
            <ManifestoItem
              num="02"
              title="Materiales certificados, no improvisados"
              text="Trabajamos exclusivamente con marcas y modelos cuya trazabilidad y certificación conocemos. Si una tecnología no la conocemos a fondo, no la instalamos. La transparencia con el cliente es innegociable."
            />
            <ManifestoItem
              num="03"
              title="Documentación entregable"
              text="Cada proyecto entrega memoria técnica, planos eléctricos, manual de operación y certificado de instalación. El cliente queda con todo lo necesario para futuras ampliaciones o reclamos de garantía."
            />
            <ManifestoItem
              num="04"
              title="Acompañamiento posterior"
              text="La puesta en servicio no es el final. Monitoreamos la generación las primeras semanas, damos capacitación al cliente y programamos mantenimiento preventivo. La relación no termina con la factura."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Quieres conocer al equipo que ejecutará tu proyecto?
          </p>
          <button
            onClick={onContactClick}
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-7 py-3.5 text-sm font-medium hover:bg-foreground/90 transition-all"
          >
            Agenda una visita técnica
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl lg:text-4xl font-medium tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
        {label}
      </div>
    </div>
  );
}

function ManifestoItem({
  num,
  title,
  text,
}: {
  num: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-4 pb-6 border-b border-border last:border-0">
      <div className="col-span-2 sm:col-span-1 font-mono text-xs text-accent pt-1">
        {num}
      </div>
      <div className="col-span-10 sm:col-span-11">
        <h4 className="text-base font-medium text-foreground mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
