import { Button } from "@/components/ui/button";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Database,
  FileText,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "wouter";

type AssetItem = {
  icon: LucideIcon;
  label: string;
  className: string;
};

type MigrationStep = {
  title: string;
  description: string;
};

type TransferPath = {
  id: string;
  d: string;
  delay: number;
  duration: number;
  endX: number;
  endY: number;
};

const assets: AssetItem[] = [
  {
    icon: Users,
    label: "Pacientes",
    className: "left-2 top-4 sm:left-4 sm:top-6",
  },
  {
    icon: CalendarDays,
    label: "Consultas",
    className: "right-2 top-4 sm:right-4 sm:top-6",
  },
  {
    icon: Clock3,
    label: "Hor\u00e1rios",
    className: "left-6 top-[6.3rem] sm:left-12 sm:top-[7.5rem]",
  },
  {
    icon: Phone,
    label: "Telefones",
    className: "right-5 top-[6.7rem] sm:right-10 sm:top-[7.7rem]",
  },
  {
    icon: FileText,
    label: "Prontu\u00e1rios",
    className: "left-1/2 top-[3.7rem] -translate-x-1/2 sm:top-[4.9rem]",
  },
];

const steps: MigrationStep[] = [
  {
    title: "Mapeamento da base atual",
    description:
      "Entendemos como seu sistema antigo organiza cadastros, agenda e hist\u00f3rico antes da virada.",
  },
  {
    title: "Importa\u00e7\u00e3o feita pela equipe",
    description:
      "Pacientes, consultas, hor\u00e1rios, telefones e informa\u00e7\u00f5es operacionais entram no VitaView sem retrabalho.",
  },
  {
    title: "Entrada em opera\u00e7\u00e3o com continuidade",
    description:
      "Sua cl\u00ednica segue atendendo enquanto a migra\u00e7\u00e3o acontece nos bastidores, com acompanhamento do in\u00edcio ao fim.",
  },
];

const transferPaths: TransferPath[] = [
  {
    id: "patients",
    d: "M82 44 C120 50 146 104 166 170",
    delay: 0,
    duration: 2.8,
    endX: 166,
    endY: 170,
  },
  {
    id: "records",
    d: "M210 92 C210 116 210 142 210 170",
    delay: 0.28,
    duration: 2.5,
    endX: 210,
    endY: 170,
  },
  {
    id: "appointments",
    d: "M338 44 C300 50 274 104 254 170",
    delay: 0.56,
    duration: 2.8,
    endX: 254,
    endY: 170,
  },
  {
    id: "availability",
    d: "M120 122 C150 128 170 148 188 170",
    delay: 0.84,
    duration: 2.4,
    endX: 188,
    endY: 170,
  },
  {
    id: "phones",
    d: "M300 122 C270 128 250 148 232 170",
    delay: 1.12,
    duration: 2.4,
    endX: 232,
    endY: 170,
  },
];

function AssetPill({
  icon: Icon,
  label,
  className,
  isInView,
  prefersReducedMotion,
}: AssetItem & { isInView: boolean; prefersReducedMotion: boolean }) {
  return (
    <motion.div
      className={`absolute z-20 ${className} inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-2 text-[11px] font-semibold text-white shadow-[0_16px_30px_-18px_rgba(0,0,0,0.85)] backdrop-blur-md`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={
        isInView
          ? prefersReducedMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                y: [0, -4, 0],
                scale: 1,
              }
          : { opacity: 0, y: 12, scale: 0.96 }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              opacity: { duration: 0.42 },
              scale: { duration: 0.42 },
              y: {
                duration: 4.2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
      }
    >
      <Icon className="h-3.5 w-3.5 text-white/90" />
      <span className="text-white/90">{label}</span>
    </motion.div>
  );
}

export function LandingMigration() {
  const visualRef = useRef<HTMLDivElement | null>(null);
  const isVisualInView = useInView(visualRef, {
    once: true,
    amount: 0.25,
    margin: "0px 0px -12% 0px",
  });
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <section
      id="migracao"
      className="relative overflow-hidden bg-[#F4F2EE] py-14 text-[#212121] md:py-24 scroll-mt-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#D9D4CC]/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#E9E4DB] blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4CEC4] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#424242] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#212121]" />
              {"Migra\u00e7\u00e3o assistida de outro sistema"}
            </div>

            <h2 className="max-w-2xl text-3xl font-heading font-bold leading-[1.06] tracking-tight text-[#212121] sm:text-4xl md:text-5xl">
              {"Troque de sistema"}
              <span className="block text-[#8A8A8A]">{"sem come\u00e7ar do zero."}</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#555555] md:text-lg">
              {"Se hoje seus dados est\u00e3o em outro prontu\u00e1rio, a mudan\u00e7a n\u00e3o cai no colo da sua equipe. "}
              {"O time do VitaView cuida da migra\u00e7\u00e3o completa para voc\u00ea."}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#6A6A6A] md:text-base">
              {"Pacientes, consultas, hor\u00e1rios, telefones, prontu\u00e1rios e informa\u00e7\u00f5es do sistema antigo "}
              {"entram organizados no VitaView, para sua cl\u00ednica continuar operando com continuidade, "}
              {"n\u00e3o com retrabalho."}
            </p>

            <div className="mt-8 space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-[#DDD7CE] bg-white/72 p-4 shadow-[0_18px_40px_-32px_rgba(33,33,33,0.55)] backdrop-blur-sm"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#212121] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#212121] md:text-base">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#616161]">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start gap-4">
              <Link href="/auth">
                <Button className="group h-auto rounded-xl bg-[#212121] px-6 py-4 font-heading text-sm font-bold text-white shadow-lg transition-all hover:bg-[#3A3A3A] hover:shadow-xl sm:px-7 sm:text-base">
                  {"Quero migrar com a equipe"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <p className="text-sm text-[#666666]">
                {"Sem planilha, sem copiar e colar, sem parar a rotina do consult\u00f3rio."}
              </p>
            </div>
          </motion.div>

          <motion.div
            ref={visualRef}
            className="relative"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, y: 18 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-[#101010] p-5 shadow-[0_36px_90px_-44px_rgba(0,0,0,0.72)] sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.08),transparent_30%)]" />

              <div className="relative z-20 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white/90 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                        {"Sistema atual"}
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-white sm:text-base">
                        {"Extra\u00edmos a base sem travar a opera\u00e7\u00e3o"}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white/90 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                        Time VitaView
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-white sm:text-base">
                        {"Nossa equipe faz a migra\u00e7\u00e3o por voc\u00ea"}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-5 h-[23rem] sm:h-[25rem]">
                {assets.map((asset) => (
                  <AssetPill
                    key={asset.label}
                    {...asset}
                    isInView={isVisualInView}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}

                <motion.svg
                  viewBox="0 0 420 320"
                  className="absolute inset-0 z-10 h-full w-full"
                  initial={false}
                  animate={isVisualInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="migration-line" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                      <stop offset="48%" stopColor="rgba(255,255,255,0.52)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                    </linearGradient>
                    <linearGradient id="migration-rail" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.72)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                    </linearGradient>
                  </defs>

                  {transferPaths.map((path) => (
                    <motion.path
                      key={path.id}
                      d={path.d}
                      fill="none"
                      stroke="url(#migration-line)"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                      strokeDasharray="4 8"
                      initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.2 }}
                      animate={
                        isVisualInView
                          ? prefersReducedMotion
                            ? { pathLength: 1, opacity: 0.78 }
                            : { pathLength: 1, opacity: 0.9 }
                          : { pathLength: 0, opacity: 0.2 }
                      }
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.82,
                        delay: path.delay * 0.14,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  ))}

                  <motion.rect
                    x="180"
                    y="156"
                    width="60"
                    height="28"
                    rx="14"
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1"
                    initial={prefersReducedMotion ? false : { opacity: 0.35, scale: 0.96 }}
                    animate={
                      isVisualInView
                        ? prefersReducedMotion
                          ? { opacity: 0.9, scale: 1 }
                          : { opacity: [0.4, 0.95, 0.4], scale: [0.98, 1.02, 0.98] }
                        : { opacity: 0.35, scale: 0.96 }
                    }
                    transition={{
                      duration: prefersReducedMotion ? 0 : 2.8,
                      repeat: prefersReducedMotion ? 0 : Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <motion.path
                    d="M166 170 H254"
                    fill="none"
                    stroke="url(#migration-rail)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.24 }}
                    animate={
                      isVisualInView
                        ? prefersReducedMotion
                          ? { pathLength: 1, opacity: 0.72 }
                          : { pathLength: 1, opacity: 0.94 }
                        : { pathLength: 0, opacity: 0.24 }
                    }
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.68,
                      delay: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />

                  <motion.path
                    d="M210 184 C210 194 210 202 210 208"
                    fill="none"
                    stroke="url(#migration-line)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="4 8"
                    initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.22 }}
                    animate={
                      isVisualInView
                        ? prefersReducedMotion
                          ? { pathLength: 1, opacity: 0.74 }
                          : { pathLength: 1, opacity: 0.88 }
                        : { pathLength: 0, opacity: 0.22 }
                    }
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.55,
                      delay: 0.88,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />

                  {transferPaths.map((path) => (
                    <motion.circle
                      key={`${path.id}-node`}
                      cx={path.endX}
                      cy={path.endY}
                      r="4.2"
                      fill="rgba(255,255,255,0.92)"
                      initial={prefersReducedMotion ? false : { opacity: 0.22, scale: 0.92 }}
                      animate={
                        isVisualInView
                          ? prefersReducedMotion
                            ? { opacity: 0.92, scale: 1 }
                            : { opacity: [0.28, 0.96, 0.28], scale: [0.94, 1.08, 0.94] }
                          : { opacity: 0.22, scale: 0.92 }
                      }
                      transition={{
                        duration: prefersReducedMotion ? 0 : 2.5,
                        delay: path.delay * 0.18,
                        repeat: prefersReducedMotion ? 0 : Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                  {!prefersReducedMotion &&
                    transferPaths.map((path) => (
                      <circle key={`${path.id}-dot`} r="3.5" fill="#FFFFFF" opacity="0">
                        {isVisualInView && (
                          <>
                            <animateMotion
                              dur={`${path.duration}s`}
                              begin={`${path.delay}s`}
                              repeatCount="indefinite"
                              path={path.d}
                            />
                            <animate
                              attributeName="opacity"
                              values="0;1;1;0"
                              dur={`${path.duration}s`}
                              begin={`${path.delay}s`}
                              repeatCount="indefinite"
                            />
                          </>
                        )}
                      </circle>
                    ))}

                  {!prefersReducedMotion && (
                    <>
                      <circle r="3.5" fill="#FFFFFF" opacity="0">
                        {isVisualInView && (
                          <>
                            <animateMotion
                              dur="1.4s"
                              begin="1.18s"
                              repeatCount="indefinite"
                              path="M166 170 H254"
                            />
                            <animate
                              attributeName="opacity"
                              values="0;1;1;0"
                              dur="1.4s"
                              begin="1.18s"
                              repeatCount="indefinite"
                            />
                          </>
                        )}
                      </circle>
                      <circle r="3.5" fill="#FFFFFF" opacity="0">
                        {isVisualInView && (
                          <>
                            <animateMotion
                              dur="1.05s"
                              begin="1.95s"
                              repeatCount="indefinite"
                              path="M210 184 C210 194 210 202 210 208"
                            />
                            <animate
                              attributeName="opacity"
                              values="0;1;1;0"
                              dur="1.05s"
                              begin="1.95s"
                              repeatCount="indefinite"
                            />
                          </>
                        )}
                      </circle>
                    </>
                  )}
                </motion.svg>

                <motion.div
                  className="absolute bottom-2 left-0 right-0 z-30 rounded-[26px] border border-white/20 bg-white/[0.05] p-5 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={
                    isVisualInView
                      ? { opacity: 1, y: 0 }
                      : prefersReducedMotion
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 18 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.52,
                    delay: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                        VitaView pronto
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white sm:text-xl">
                        {"Sua base chega organizada para a equipe entrar e atender."}
                      </h3>
                    </div>
                    <div className="hidden rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-white/80 sm:block">
                      {"Virada acompanhada"}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      "Pacientes e contatos importados",
                      "Agenda e hor\u00e1rios preservados",
                      "Hist\u00f3rico cl\u00ednico pronto para consulta",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/80"
                      >
                        <div className="mb-2 h-2 w-2 rounded-full bg-white" />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
