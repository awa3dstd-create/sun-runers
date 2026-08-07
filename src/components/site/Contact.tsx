"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { COMPANY, SERVICES } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().min(3, "Tu nombre completo es requerido"),
  email: z.string().email("Email no válido"),
  phone: z.string().min(6, "Teléfono de contacto requerido"),
  address: z.string().min(5, "Dirección completa requerida"),
  service: z.enum(["fotovoltaico", "residencial", "bombeo", "proyectos", "clima"]),
  message: z.string().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)"),
  preferredChannel: z.enum(["whatsapp", "email", "call"]),
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactProps {
  preselectedService?: string | null;
  onServiceConsumed: () => void;
}

export function Contact({ preselectedService, onServiceConsumed }: ContactProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      service: "fotovoltaico",
      preferredChannel: "whatsapp",
    },
  });

  // Pre-selección desde otras secciones
  useEffect(() => {
    if (
      preselectedService &&
      ["fotovoltaico", "residencial", "bombeo", "proyectos", "clima"].includes(
        preselectedService
      )
    ) {
      setValue("service", preselectedService as ContactForm["service"]);
      onServiceConsumed();
    }
  }, [preselectedService, setValue, onServiceConsumed]);

  const selectedService = watch("service");
  const selectedChannel = watch("preferredChannel");

  const onSubmit = async (data: ContactForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al enviar");
      setSubmitted(true);
      toast.success("Solicitud enviada. Te contactaremos en menos de 24h.");
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contacto"
      className="relative py-24 lg:py-32 bg-background border-t border-border"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-accent" />
              <span className="eyebrow text-muted-foreground">Contacto</span>
            </div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="display-2 text-foreground">
              Cuéntanos qué
              <br />
              <span className="italic text-accent">necesitas</span>.
            </h2>
            <p className="mt-6 max-w-2xl prose-body">
              Completa el formulario con la mayor cantidad de detalle posible.
              La dirección nos permite asignarte el ingeniero más cercano a tu
              zona. Recibirás respuesta en menos de 24 horas hábiles.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Info de contacto */}
          <div className="lg:col-span-4 space-y-8">
            <ContactInfoBlock
              icon={Mail}
              label="Email"
              value={COMPANY.email}
              href={`mailto:${COMPANY.email}`}
            />
            <ContactInfoBlock
              icon={Phone}
              label="Teléfono"
              value={COMPANY.phone}
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
            />
            <ContactInfoBlock
              icon={MapPin}
              label="Cobertura"
              value={COMPANY.coverage}
            />
            <ContactInfoBlock
              icon={Clock}
              label="Horario"
              value={COMPANY.hours}
            />

            <div className="pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tu información se procesa de forma confidencial. La dirección
                se usa exclusivamente para asignarte el ingeniero más cercano y
                planificar la visita técnica.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center p-12 lg:p-16 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent/15 text-accent mb-6">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="display-3 text-foreground mb-3">
                  Solicitud recibida
                </h3>
                <p className="prose-body max-w-md mb-8">
                  Gracias por contactarnos. Hemos asignado tu solicitud al
                  equipo técnico. Te contactaremos en menos de 24 horas hábiles
                  por el canal que indicaste.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="rounded-full"
                >
                  Enviar otra solicitud
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 p-6 lg:p-10 rounded-2xl border border-border bg-card"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <Field label="Nombre completo" error={errors.name?.message}>
                    <Input
                      {...register("name")}
                      placeholder="Ej. Roberto Suárez"
                      className="rounded-lg"
                    />
                  </Field>
                  <Field label="Email" error={errors.email?.message}>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="tucorreo@dominio.cu"
                      className="rounded-lg"
                    />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <Field label="Teléfono" error={errors.phone?.message}>
                    <Input
                      {...register("phone")}
                      placeholder="+53 5 000 0000"
                      className="rounded-lg"
                    />
                  </Field>
                  <Field
                    label="Dirección completa"
                    error={errors.address?.message}
                    hint="Calle, número, municipio, provincia"
                  >
                    <Input
                      {...register("address")}
                      placeholder="Ej. Calle 23 #456, Vedado, La Habana"
                      className="rounded-lg"
                    />
                  </Field>
                </div>

                <Field label="Servicio solicitado" error={errors.service?.message}>
                  <Select
                    value={selectedService}
                    onValueChange={(v) =>
                      setValue("service", v as ContactForm["service"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-lg w-full">
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Mensaje"
                  error={errors.message?.message}
                  hint="Describe tu necesidad, consumo eléctrico aproximado, horario de contacto preferido, etc."
                >
                  <Textarea
                    {...register("message")}
                    rows={5}
                    placeholder="Ej. Necesito un sistema fotovoltaico de 5 kW con respaldo de batería para una vivienda de 4 personas en Vedado. Actualmente consumo aproximadamente 350 kWh/mes..."
                    className="rounded-lg resize-none"
                  />
                </Field>

                <Field
                  label="Canal preferido de respuesta"
                  error={errors.preferredChannel?.message}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "whatsapp", l: "WhatsApp" },
                        { v: "email", l: "Email" },
                        { v: "call", l: "Llamada" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() =>
                          setValue("preferredChannel", opt.v, {
                            shouldValidate: true,
                          })
                        }
                        className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                          selectedChannel === opt.v
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Respuesta garantizada en menos de 24 horas hábiles.
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-7"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar solicitud
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactInfoBlock({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center h-10 w-10 rounded-full border border-border text-foreground shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className="text-sm text-foreground leading-relaxed">{value}</div>
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block hover:opacity-70 transition-opacity">
      {content}
    </a>
  ) : (
    content
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
