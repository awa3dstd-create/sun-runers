"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  variant?: "default" | "light";
}

/**
 * Logo HELORA — monograma H formado por líneas sólidas.
 * Concepto: dos trazos verticales (rectitud ingenieril)
 * unidos por un trazo horizontal (conexión, nodo) con
 * dos acentos en chevron ascendente/descendente que sugieren
 * flujo de energía en ambas direcciones (carga/descarga).
 *
 * Vectorial, escalable, monocromático con un único acento.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M9 7 L9 25 M23 7 L23 25 M9 16 L23 16"
        stroke="var(--background, #F7F5EF)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M13 11 L16 8 L19 11"
        stroke="#B8702E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13 21 L16 24 L19 21"
        stroke="#B8702E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  variant = "default",
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        variant === "light" ? "text-foreground" : "text-foreground",
        className
      )}
    >
      <LogoMark className="h-8 w-8" />
      {showWordmark && (
        <span className="text-lg font-medium uppercase" style={{ letterSpacing: "0.18em" }}>
          HELORA
        </span>
      )}
    </span>
  );
}
