import { Button } from "@/components/ui/button";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────

type AssetDef = {
  icon: LucideIcon;
  label: string;
  pillCls: string;
  fallbackPoint: { x: number; y: number };
  delay: number;
  dur: number;
};

type MigrationStep = {
  title: string;
  description: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────

type Point = {
  x: number;
  y: number;
};

const FALLBACK_ZONE = {
  width: 400,
  height: 210,
};

const HUB_Y_RATIO = 0.72;

const ASSETS: AssetDef[] = [
  {
    icon: Users,
    label: "Pacientes",
    pillCls: "left-[5%] top-[6%]",
    fallbackPoint: { x: 86, y: 42 },
    delay: 0,
    dur: 2.6,
  },
  {
    icon: CalendarDays,
    label: "Consultas",
    pillCls: "right-[5%] top-[6%]",
    fallbackPoint: { x: 314, y: 42 },
    delay: 0.22,
    dur: 2.6,
  },
  {
    icon: FileText,
    label: "Prontuários",
    pillCls: "left-1/2 -translate-x-1/2 top-[1%]",
    fallbackPoint: { x: 200, y: 30 },
    delay: 0.44,
    dur: 2.4,
  },
  {
    icon: Clock3,
    label: "Horários",
    pillCls: "left-[10%] top-[38%]",
    fallbackPoint: { x: 104, y: 106 },
    delay: 0.66,
    dur: 2.2,
  },
  {
    icon: Phone,
    label: "Telefones",
    pillCls: "right-[10%] top-[38%]",
    fallbackPoint: { x: 296, y: 106 },
    delay: 0.88,
    dur: 2.2,
  },
];

const STEPS: MigrationStep[] = [
  {
    title: "Mapeamento da base atual",
    description:
      "Entendemos como seu sistema antigo organiza cadastros, agenda e histórico antes da virada.",
  },
  {
    title: "Importação feita pela equipe",
    description:
      "Pacientes, consultas, horários, telefones e informações operacionais entram no VitaView sem retrabalho.",
  },
  {
    title: "Entrada em operação com continuidade",
    description:
      "Sua clínica segue atendendo enquanto a migração acontece nos bastidores, com acompanhamento do início ao fim.",
  },
];

const RESULT_ITEMS = [
  "Pacientes e contatos",
  "Agenda e horários",
  "Histórico clínico",
];

function getHubPoint(zone: { width: number; height: number }): Point {
  return {
    x: zone.width / 2,
    y: zone.height * HUB_Y_RATIO,
  };
}

function getAnchorPoint(
  pillRect: DOMRect,
  zoneRect: DOMRect,
  hub: Point,
): Point {
  const centerX = pillRect.left - zoneRect.left + pillRect.width / 2;
  const centerY = pillRect.top - zoneRect.top + pillRect.height / 2;
  const dx = hub.x - centerX;
  const dy = hub.y - centerY;
  const halfW = pillRect.width / 2;
  const halfH = pillRect.height / 2;
  const scale =
    1 / Math.max(Math.abs(dx) / Math.max(halfW, 1), Math.abs(dy) / Math.max(halfH, 1), 1);

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale,
  };
}

function buildMigrationPath(start: Point, hub: Point) {
  const dx = hub.x - start.x;
  const dy = hub.y - start.y;
  const spread = Math.abs(dx);
  const arcLift = Math.max(28, Math.min(74, spread * 0.18 + Math.abs(dy) * 0.16));
  const control1 = {
    x: start.x + dx * 0.2,
    y: start.y + dy * 0.14,
  };
  const control2 = {
    x: start.x + dx * 0.78,
    y: hub.y - arcLift,
  };

  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${hub.x} ${hub.y}`;
}

// ─── Pill ───────────────────────────────────────────────────────────────────

function Pill({
  icon: Icon,
  label,
  pillCls,
  isInView,
  reduced,
  index,
  pillRef,
}: {
  icon: LucideIcon;
  label: string;
  pillCls: string;
  isInView: boolean;
  reduced: boolean;
  index: number;
  pillRef?: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={pillRef} className={`absolute z-20 ${pillCls}`}>
      <motion.div
        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold text-white/85 shadow-lg backdrop-blur-sm"
        initial={reduced ? false : { opacity: 0, y: 10, scale: 0.9 }}
        animate={
          isInView
            ? {
                opacity: 1,
                scale: 1,
                y: reduced ? 0 : [0, -3.5, 0],
              }
            : { opacity: 0, y: 10, scale: 0.9 }
        }
        transition={
          reduced
            ? { duration: 0 }
            : {
                opacity: { duration: 0.38, delay: index * 0.08 },
                scale: { duration: 0.38, delay: index * 0.08 },
                y: {
                  duration: 3.6 + index * 0.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5,
                },
              }
        }
      >
        <Icon className="h-3.5 w-3.5 text-white/60" />
        {label}
      </motion.div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LandingMigration() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [zoneSize, setZoneSize] = useState(FALLBACK_ZONE);
  const [anchors, setAnchors] = useState<Point[]>(() => ASSETS.map((asset) => asset.fallbackPoint));
  const isInView = useInView(cardRef, {
    once: true,
    amount: 0.25,
    margin: "0px 0px -10% 0px",
  });
  const reduced = useReducedMotion() ?? false;
  const hub = useMemo(() => getHubPoint(zoneSize), [zoneSize]);
  const animatedAssets = useMemo(
    () =>
      ASSETS.map((asset, index) => {
        const anchor = anchors[index] ?? asset.fallbackPoint;
        return {
          ...asset,
          anchor,
          svgPath: buildMigrationPath(anchor, hub),
        };
      }),
    [anchors, hub],
  );

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) {
      return;
    }

    const measure = () => {
      const zoneRect = zone.getBoundingClientRect();
      if (!zoneRect.width || !zoneRect.height) {
        return;
      }

      const nextZone = {
        width: zoneRect.width,
        height: zoneRect.height,
      };
      const nextHub = getHubPoint(nextZone);
      const nextAnchors = ASSETS.map((asset, index) => {
        const pillNode = pillRefs.current[index];
        if (!pillNode) {
          return asset.fallbackPoint;
        }
        return getAnchorPoint(pillNode.getBoundingClientRect(), zoneRect, nextHub);
      });

      setZoneSize(nextZone);
      setAnchors(nextAnchors);
    };

    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(zone);
    pillRefs.current.forEach((pill) => {
      if (pill) {
        observer.observe(pill);
      }
    });
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section
      id="migracao"
      className="relative overflow-hidden bg-[#F4F2EE] py-14 text-[#212121] md:py-24 scroll-mt-20"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#D9D4CC]/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#E9E4DB] blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:gap-16">

          {/* ── LEFT: Text column ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4CEC4] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#424242] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#212121]" />
              {"Migração assistida de outro sistema"}
            </div>

            <h2 className="max-w-2xl text-3xl font-heading font-bold leading-[1.06] tracking-tight text-[#212121] sm:text-4xl md:text-5xl">
              {"Troque de sistema"}
              <span className="block text-[#8A8A8A]">{"sem começar do zero."}</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#555555] md:text-lg">
              {"Se hoje seus dados estão em outro prontuário, a mudança não cai no colo da sua equipe. "}
              {"O time do VitaView cuida da migração completa para você."}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#6A6A6A] md:text-base">
              {"Pacientes, consultas, horários, telefones, prontuários e informações do sistema antigo "}
              {"entram organizados no VitaView, para sua clínica continuar operando com continuidade, "}
              {"não com retrabalho."}
            </p>

            <div className="mt-8 space-y-4">
              {STEPS.map((step, index) => (
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
                {"Sem planilha, sem copiar e colar, sem parar a rotina do consultório."}
              </p>
            </div>
          </motion.div>

          {/* ── RIGHT: Animation card ── */}
          <motion.div
            ref={cardRef}
            initial={reduced ? false : { opacity: 0, scale: 0.98, y: 18 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#101010] p-5 shadow-[0_36px_90px_-44px_rgba(0,0,0,0.72)] sm:p-6">
              {/* Radial inner highlight */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.08),transparent_45%)]" />

              {/* ① Header: two compact info cards */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5">
                {[
                  { icon: Database, label: "Sistema atual", sub: "Extraímos sem travar" },
                  { icon: ShieldCheck, label: "Time VitaView", sub: "Migração por nós" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.05] p-3.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                      <Icon className="h-[15px] w-[15px] text-white/55" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-tight text-white/75">
                        {sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ② Animation zone — dedicated, nothing overlaps it */}
              <div
                ref={zoneRef}
                className="relative mt-4 h-[210px] overflow-hidden rounded-2xl bg-white/[0.02]"
              >
                {/* Subtle depth gradient */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_72%,rgba(255,255,255,0.05),transparent_55%)]" />

                {/* Floating data pills */}
                {animatedAssets.map((a, i) => (
                  <Pill
                    key={a.label}
                    icon={a.icon}
                    label={a.label}
                    pillCls={a.pillCls}
                    isInView={isInView}
                    reduced={reduced}
                    index={i}
                    pillRef={(node) => {
                      pillRefs.current[i] = node;
                    }}
                  />
                ))}

                {/* SVG: paths + hub — fills full zone */}
                <motion.svg
                  viewBox={`0 0 ${zoneSize.width} ${zoneSize.height}`}
                  className="absolute inset-0 z-10 h-full w-full"
                  initial={false}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="migLine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.48)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
                    </linearGradient>
                    <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                  </defs>

                  {/* Transfer paths */}
                  {animatedAssets.map((a, i) => (
                    <g key={a.label}>
                      <motion.path
                        d={a.svgPath}
                        fill="none"
                        stroke="url(#migLine)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeDasharray="3 8"
                        initial={reduced ? false : { pathLength: 0, opacity: 0.1 }}
                        animate={
                          isInView
                            ? { pathLength: 1, opacity: 0.88 }
                            : { pathLength: 0, opacity: 0.1 }
                        }
                        transition={{
                          duration: reduced ? 0 : 0.7,
                          delay: reduced ? 0 : i * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                      <motion.circle
                        cx={a.anchor.x}
                        cy={a.anchor.y}
                        r="2.6"
                        fill="rgba(255,255,255,0.9)"
                        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                        animate={isInView ? { opacity: 0.96, scale: 1 } : { opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.28, delay: reduced ? 0 : i * 0.06 }}
                      />
                    </g>
                  ))}

                  {/* Hub: outer glow */}
                  <motion.circle
                    cx={hub.x}
                    cy={hub.y}
                    r="40"
                    fill="url(#hubGlow)"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={
                      isInView
                        ? reduced
                          ? { opacity: 1 }
                          : { opacity: [0.3, 0.8, 0.3] }
                        : { opacity: 0 }
                    }
                    transition={{
                      duration: 2.6,
                      repeat: reduced ? 0 : Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />

                  {/* Hub: outer ring */}
                  <motion.circle
                    cx={hub.x}
                    cy={hub.y}
                    r="25"
                    fill="none"
                    stroke="rgba(255,255,255,0.09)"
                    strokeWidth="1"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.55 }}
                  />

                  {/* Hub: main circle — pulses */}
                  <motion.circle
                    cx={hub.x}
                    cy={hub.y}
                    r="18"
                    fill="rgba(255,255,255,0.07)"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="1.2"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={
                      isInView
                        ? reduced
                          ? { opacity: 1 }
                          : { opacity: [0.6, 1, 0.6] }
                        : { opacity: 0 }
                    }
                    transition={{
                      duration: 2.4,
                      repeat: reduced ? 0 : Infinity,
                      ease: "easeInOut",
                      delay: 0.6,
                    }}
                  />

                  {/* Hub: inner dot */}
                  <motion.circle
                    cx={hub.x}
                    cy={hub.y}
                    r="8.5"
                    fill="rgba(255,255,255,0.18)"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  />

                  {/* Traveling dots — animate along each path */}
                  {!reduced &&
                    animatedAssets.map((a) => (
                      <circle key={`dot-${a.label}`} r="2.8" fill="white" opacity="0">
                        {isInView && (
                          <>
                            <animateMotion
                              dur={`${a.dur}s`}
                              begin={`${a.delay}s`}
                              repeatCount="indefinite"
                              path={a.svgPath}
                            />
                            <animate
                              attributeName="opacity"
                              values="0;0;0.92;0.92;0"
                              keyTimes="0;0.06;0.18;0.86;1"
                              dur={`${a.dur}s`}
                              begin={`${a.delay}s`}
                              repeatCount="indefinite"
                            />
                          </>
                        )}
                      </circle>
                    ))}
                </motion.svg>

                <motion.div
                  className="pointer-events-none absolute z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.14] bg-[#171717]/90 shadow-[0_0_32px_rgba(255,255,255,0.12)] backdrop-blur-md"
                  style={{
                    left: hub.x,
                    top: hub.y,
                  }}
                  initial={reduced ? false : { opacity: 0, scale: 0.86 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.86 }}
                  transition={{ duration: 0.38, delay: 0.78, ease: [0.22, 1, 0.36, 1] }}
                >
                  <img
                    src="/logo-icon-transparent.png"
                    alt="VitaView"
                    className="h-5 w-5 object-contain opacity-95"
                    draggable={false}
                  />
                </motion.div>
              </div>

              {/* ③ Divider */}
              <div className="my-4 border-t border-white/[0.06]" />

              {/* ④ Result strip — compact, below animation */}
              <div className="relative z-10">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
                    VitaView pronto
                  </p>
                  <span className="rounded-full border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/55">
                    Virada acompanhada
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {RESULT_ITEMS.map((item, i) => (
                    <motion.div
                      key={item}
                      className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-3"
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                      transition={{
                        duration: 0.38,
                        delay: 0.28 + i * 0.07,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-white/45" />
                      <p className="text-[11px] leading-snug text-white/60">{item}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
