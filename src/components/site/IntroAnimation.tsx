"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

/**
 * Animación de intro de SUN-RUNERS.
 *
 * Secuencia total: 3 segundos.
 *   0.0s – 0.6s : fade-in del fondo negro
 *   0.4s – 1.4s : dibujo del icono (sol + rayos) con scale + fade
 *   1.2s – 2.0s : fade-in del wordmark "SUN-RUNERS"
 *   2.4s – 3.0s : fade-out completo (descubre el sitio)
 *
 * El logo se renderiza en blanco sobre fondo negro puro,
 * idéntico a la imagen original del cliente.
 *
 * La animación se muestra solo en la primera visita de cada sesión
 * (controlado por sessionStorage). En recargas dentro de la misma
 * sesión, se omite para no molestar al usuario.
 *
 * Respeta `prefers-reduced-motion` (se omite totalmente si el
 * usuario tiene reducción de movimiento activada).
 */
export function IntroAnimation() {
  const [show, setShow] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // No mostrar si el usuario prefiere movimiento reducido
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // No mostrar si ya se vio en esta sesión
    try {
      const seen = window.sessionStorage.getItem("sun-runers-intro-seen");
      if (seen === "1") return;
    } catch {
      // sessionStorage puede fallar en modo privado; continuar
    }

    setShow(true);

    // Marcar como vista
    try {
      window.sessionStorage.setItem("sun-runers-intro-seen", "1");
    } catch {
      // ignore
    }

    // Ocultar después de 3 segundos
    const t = window.setTimeout(() => {
      setHidden(true);
    }, 3000);

    return () => window.clearTimeout(t);
  }, []);

  if (!show || hidden) return null;

  return (
    <div
      className="intro-overlay"
      aria-hidden="true"
      onTransitionEnd={() => setHidden(true)}
    >
      <div className="intro-logo" style={{ color: "#FFFFFF" }}>
        <LogoMark className="intro-icon" />
        <span className="intro-wordmark">SUN-RUNERS</span>
      </div>
    </div>
  );
}
