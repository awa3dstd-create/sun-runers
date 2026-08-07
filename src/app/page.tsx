"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { Technologies } from "@/components/site/Technologies";
import { Portfolio } from "@/components/site/Portfolio";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  const [preselectedService, setPreselectedService] = useState<string | null>(
    null
  );

  const handleSelectService = useCallback((serviceId: string) => {
    setPreselectedService(serviceId);
    // Scroll al formulario
    setTimeout(() => {
      document
        .querySelector("#contacto")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const handleContactClick = useCallback(() => {
    document
      .querySelector("#contacto")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleServiceConsumed = useCallback(() => {
    setPreselectedService(null);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Services onSelectService={handleSelectService} />
        <Technologies />
        <Portfolio onContactClick={handleContactClick} />
        <About onContactClick={handleContactClick} />
        <Contact
          preselectedService={preselectedService}
          onServiceConsumed={handleServiceConsumed}
        />
      </main>
      <Footer onNavClick={handleNavClick} />
    </div>
  );
}
