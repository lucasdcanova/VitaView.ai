import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { platformDownloadLinks } from "./download-links";

type PlatformKey = "windows" | "mac" | "ios" | "ipad" | "android" | "web";

type Platform = {
  key: PlatformKey;
  title: string;
  label: string;
  href: string;
  accent: string;
  eyebrow: string;
  detail: string;
};

const platforms: Platform[] = [
  {
    key: "windows",
    title: "Windows",
    label: "Baixar",
    href: platformDownloadLinks.windows.href,
    accent: "#8FD3FF",
    eyebrow: "Shell nativo",
    detail: "Instalador direto com atualizacao automatica.",
  },
  {
    key: "mac",
    title: "macOS",
    label: platformDownloadLinks.mac.isDirect ? "Baixar .dmg" : "Buscar",
    href: platformDownloadLinks.mac.href,
    accent: "#D7DCE2",
    eyebrow: "Desktop refinado",
    detail: "Build .dmg com experiencia de app dedicada.",
  },
  {
    key: "ios",
    title: "iPhone",
    label: platformDownloadLinks.ios.isDirect ? "App Store" : "Buscar",
    href: platformDownloadLinks.ios.href,
    accent: "#F4F5F7",
    eyebrow: "Bolso clinico",
    detail: "Acesse consultas, exames e resumos onde estiver.",
  },
  {
    key: "ipad",
    title: "iPad",
    label: platformDownloadLinks.ipad.isDirect ? "App Store" : "Buscar",
    href: platformDownloadLinks.ipad.href,
    accent: "#C8CDD5",
    eyebrow: "Tela expandida",
    detail: "Mais area para leitura, prescricao e revisao.",
  },
  {
    key: "android",
    title: "Android",
    label: platformDownloadLinks.android.isDirect ? "Google Play" : "Buscar",
    href: platformDownloadLinks.android.href,
    accent: "#8CE07A",
    eyebrow: "Mobilidade aberta",
    detail: "Fluxo rapido para rotina de plantao e consultorio.",
  },
  {
    key: "web",
    title: "Web",
    label: "Acessar",
    href: platformDownloadLinks.web.href,
    accent: "#E7C88D",
    eyebrow: "Sempre disponivel",
    detail: "Entre pelo navegador sem instalar nada.",
  },
];

function PlatformPreview({ platform }: { platform: Platform }) {
  const glowStyle = {
    boxShadow: `0 0 0 1px ${platform.accent}20, 0 18px 48px ${platform.accent}18`,
  } as const;

  if (platform.key === "windows") {
    return (
      <motion.div
        variants={{
          rest: { rotate: 0, y: 0 },
          hover: { rotate: -4, y: -2 },
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-32 w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5"
        style={glowStyle}
      >
        <motion.div
          variants={{
            rest: { scale: 1, opacity: 0.88 },
            hover: { scale: 1.03, opacity: 1 },
          }}
          className="grid h-full grid-cols-2 gap-2"
        >
          {[0, 1, 2, 3].map((pane) => (
            <motion.span
              key={pane}
              variants={{
                rest: { y: 0 },
                hover: { y: pane % 2 === 0 ? -2 : 2 },
              }}
              className="rounded-[14px] border border-white/10 bg-[#8FD3FF]/18"
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (platform.key === "mac") {
    return (
      <motion.div
        variants={{
          rest: { y: 0, rotate: 0 },
          hover: { y: -2, rotate: 1.5 },
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-32 w-full overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4"
        style={glowStyle}
      >
        <div className="rounded-[20px] border border-white/12 bg-black/22 p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <motion.div
            variants={{
              rest: { scaleX: 0.72, opacity: 0.68 },
              hover: { scaleX: 1, opacity: 1 },
            }}
            className="h-12 rounded-[14px] border border-white/10 bg-white/8"
          />
        </div>
        <motion.div
          variants={{
            rest: { y: 0, opacity: 0.5 },
            hover: { y: -3, opacity: 0.88 },
          }}
          className="absolute bottom-3 left-1/2 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/28"
        />
      </motion.div>
    );
  }

  if (platform.key === "ios") {
    return (
      <motion.div
        variants={{
          rest: { y: 0, rotate: 0 },
          hover: { y: -3, rotate: -3 },
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto h-32 w-[6.4rem] rounded-[28px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] p-2.5"
        style={glowStyle}
      >
        <div className="relative h-full rounded-[22px] border border-white/10 bg-black/30">
          <div className="absolute left-1/2 top-2.5 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/24" />
          <motion.div
            variants={{
              rest: { y: 0, opacity: 0.75 },
              hover: { y: 3, opacity: 1 },
            }}
            className="absolute inset-x-3 bottom-3 top-8 rounded-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]"
          />
        </div>
      </motion.div>
    );
  }

  if (platform.key === "ipad") {
    return (
      <motion.div
        variants={{
          rest: { y: 0, rotate: 0 },
          hover: { y: -2, rotate: 2 },
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-32 w-full rounded-[28px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-2.5"
        style={glowStyle}
      >
        <div className="relative h-full rounded-[22px] border border-white/10 bg-black/26 p-3">
          <span className="absolute left-1/2 top-2.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/28" />
          <motion.div
            variants={{
              rest: { scale: 0.96, opacity: 0.74 },
              hover: { scale: 1, opacity: 1 },
            }}
            className="grid h-full grid-cols-[1.15fr_0.85fr] gap-2 pt-2"
          >
            <span className="rounded-[14px] bg-white/10" />
            <span className="rounded-[14px] bg-white/5" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (platform.key === "android") {
    return (
      <motion.div
        variants={{
          rest: { y: 0, rotate: 0 },
          hover: { y: -3, rotate: -2 },
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto h-32 w-28"
      >
        <motion.span
          variants={{
            rest: { rotate: -20, y: 0 },
            hover: { rotate: -12, y: -2 },
          }}
          className="absolute left-[1.15rem] top-[0.9rem] h-6 w-[2px] origin-bottom rounded-full bg-[#8CE07A]"
        />
        <motion.span
          variants={{
            rest: { rotate: 20, y: 0 },
            hover: { rotate: 12, y: -2 },
          }}
          className="absolute right-[1.15rem] top-[0.9rem] h-6 w-[2px] origin-bottom rounded-full bg-[#8CE07A]"
        />
        <div
          className="absolute inset-x-4 top-5 h-12 rounded-t-[24px] border border-white/10 bg-[#8CE07A]/20"
          style={glowStyle}
        >
          <div className="absolute left-5 top-4 h-2.5 w-2.5 rounded-full bg-[#8CE07A]" />
          <div className="absolute right-5 top-4 h-2.5 w-2.5 rounded-full bg-[#8CE07A]" />
        </div>
        <motion.div
          variants={{
            rest: { y: 0, opacity: 0.86 },
            hover: { y: -2, opacity: 1 },
          }}
          className="absolute inset-x-3 bottom-2 top-[4.3rem] rounded-[22px] border border-white/10 bg-white/6"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={{
        rest: { y: 0, rotate: 0 },
        hover: { y: -2, rotate: 1.5 },
      }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-32 w-full overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4"
      style={glowStyle}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF7B72]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E7C88D]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7EE787]" />
      </div>
      <motion.div
        variants={{
          rest: { opacity: 0.7, y: 0 },
          hover: { opacity: 1, y: -1 },
        }}
        className="grid h-[4.7rem] grid-cols-[1.1fr_0.9fr] gap-2"
      >
        <span className="rounded-[14px] bg-white/10" />
        <div className="grid gap-2">
          <span className="rounded-[12px] bg-white/8" />
          <span className="rounded-[12px] bg-white/6" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LandingDownloads() {
  return (
    <section
      id="downloads"
      className="relative overflow-hidden bg-[#090909] py-18 text-white md:py-24 scroll-mt-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="absolute left-[8%] top-20 h-44 w-44 rounded-full bg-[#8FD3FF]/8 blur-3xl" />
        <div className="absolute right-[10%] bottom-10 h-48 w-48 rounded-full bg-[#8CE07A]/6 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="mx-auto mb-12 max-w-3xl text-center md:mb-16"
        >
          <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
            Downloads
          </span>
          <h2 className="mt-5 text-3xl font-heading font-bold tracking-tight text-white md:text-5xl">
            O mesmo fluxo clinico, com leitura nativa em cada sistema.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-6 text-white/58 md:text-base">
            Uma grade mais clara, com marcadores visuais de cada ecossistema e interacoes suaves ao passar o cursor.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platforms.map((platform, index) => (
            <motion.a
              key={platform.key}
              href={platform.href}
              target={platform.key === "web" ? "_blank" : undefined}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover="hover"
              animate="rest"
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-[8px] transition-[border-color,background-color] duration-500 hover:border-white/16 hover:bg-white/[0.075] md:p-6"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div
                  className="absolute inset-x-8 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${platform.accent}, transparent)` }}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    {platform.eyebrow}
                  </span>
                  <h3 className="mt-2 text-2xl font-heading font-bold tracking-tight text-white">
                    {platform.title}
                  </h3>
                </div>
                <motion.div
                  variants={{
                    rest: { x: 0, y: 0, opacity: 0.58 },
                    hover: { x: 4, y: -4, opacity: 1 },
                  }}
                  transition={{ duration: 0.35 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </motion.div>
              </div>

              <div className="mt-6">
                <PlatformPreview platform={platform} />
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <p className="max-w-[18rem] font-body text-sm leading-6 text-white/58">
                  {platform.detail}
                </p>
                <motion.span
                  variants={{
                    rest: { x: 0, opacity: 0.64 },
                    hover: { x: 6, opacity: 1 },
                  }}
                  transition={{ duration: 0.35 }}
                  className="shrink-0 text-xs font-semibold uppercase tracking-[0.22em] text-white/75"
                >
                  {platform.label}
                </motion.span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
