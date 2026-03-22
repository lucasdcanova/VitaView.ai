import { motion } from "framer-motion";
import { ArrowUpRight, Globe2 } from "lucide-react";
import type { ComponentType } from "react";
import { FaAndroid, FaApple, FaWindows } from "react-icons/fa";
import { platformDownloadLinks } from "./download-links";

type PlatformKey = "windows" | "mac" | "ios" | "ipad" | "android" | "web";

type Platform = {
  key: PlatformKey;
  title: string;
  label: string;
  href: string;
  logo: ComponentType<{ className?: string }>;
  logoColor: string;
  logoBackground: string;
  target?: "_blank";
};

const platforms: Platform[] = [
  {
    key: "windows",
    title: "Windows",
    label: "Baixar",
    href: platformDownloadLinks.windows.href,
    logo: FaWindows,
    logoColor: "#00A4EF",
    logoBackground: "rgba(0, 164, 239, 0.12)",
  },
  {
    key: "mac",
    title: "macOS",
    label: platformDownloadLinks.mac.isDirect ? "Baixar .dmg" : "Baixar",
    href: platformDownloadLinks.mac.href,
    logo: FaApple,
    logoColor: "#111111",
    logoBackground: "rgba(17, 17, 17, 0.08)",
  },
  {
    key: "ios",
    title: "iPhone",
    label: platformDownloadLinks.ios.isDirect ? "App Store" : "Buscar",
    href: platformDownloadLinks.ios.href,
    logo: FaApple,
    logoColor: "#111111",
    logoBackground: "rgba(17, 17, 17, 0.08)",
  },
  {
    key: "ipad",
    title: "iPad",
    label: platformDownloadLinks.ipad.isDirect ? "App Store" : "Buscar",
    href: platformDownloadLinks.ipad.href,
    logo: FaApple,
    logoColor: "#111111",
    logoBackground: "rgba(17, 17, 17, 0.08)",
  },
  {
    key: "android",
    title: "Android",
    label: platformDownloadLinks.android.isDirect ? "Google Play" : "Buscar",
    href: platformDownloadLinks.android.href,
    logo: FaAndroid,
    logoColor: "#3DDC84",
    logoBackground: "rgba(61, 220, 132, 0.12)",
  },
  {
    key: "web",
    title: "Web",
    label: "Abrir",
    href: platformDownloadLinks.web.href,
    logo: Globe2,
    logoColor: "#8A5C2D",
    logoBackground: "rgba(231, 200, 141, 0.2)",
    target: "_blank",
  },
];

export function LandingDownloads() {
  return (
    <section
      id="downloads"
      className="relative overflow-hidden bg-[#f5f1ea] py-14 text-[#111111] md:py-16 xl:py-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-black/8" />
        <div className="absolute left-[8%] top-14 h-44 w-44 rounded-full bg-white/80 blur-3xl" />
        <div className="absolute right-[10%] top-1/3 h-52 w-52 rounded-full bg-[#dff5e7] blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
            className="max-w-md"
          >
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-black/50">
              Downloads
            </span>
            <h2 className="mt-4 text-3xl font-heading font-bold leading-[0.98] tracking-tight text-[#111111] md:text-5xl">
              Baixe o VitaView.
            </h2>
            <p className="mt-4 max-w-sm font-body text-sm leading-6 text-black/58 md:text-base">
              Windows, macOS, iPhone, iPad, Android ou navegador.
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {platforms.map((platform, index) => {
              const Logo = platform.logo;

              return (
                <motion.a
                  key={platform.key}
                  href={platform.href}
                  target={platform.target}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="group rounded-[28px] border border-black/10 bg-white/88 p-5 shadow-[0_18px_60px_rgba(17,17,17,0.05)] backdrop-blur-sm transition-[border-color,background-color] duration-300 hover:border-black/18 hover:bg-white md:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-[18px]"
                      style={{
                        color: platform.logoColor,
                        backgroundColor: platform.logoBackground,
                      }}
                    >
                      <Logo className="h-5 w-5" />
                    </span>

                    <ArrowUpRight className="h-4 w-4 text-black/35 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-black/60" />
                  </div>

                  <div className="mt-12">
                    <h3 className="text-[1.15rem] font-heading font-bold tracking-tight text-[#111111]">
                      {platform.title}
                    </h3>

                    <div className="mt-4 flex items-center justify-between border-t border-black/8 pt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/50">
                        {platform.label}
                      </span>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
