import { motion } from "framer-motion";
import { ArrowUpRight, Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platformDownloadLinks } from "./download-links";

const platforms = [
  {
    key: "windows",
    title: "Windows",
    label: "Baixar",
    href: platformDownloadLinks.windows.href,
    icon: Monitor,
  },
  {
    key: "mac",
    title: "macOS",
    label: platformDownloadLinks.mac.isDirect ? "Baixar .dmg" : "Buscar",
    href: platformDownloadLinks.mac.href,
    icon: Laptop,
  },
  {
    key: "ios",
    title: "iPhone",
    label: platformDownloadLinks.ios.isDirect ? "App Store" : "Buscar",
    href: platformDownloadLinks.ios.href,
    icon: Smartphone,
  },
  {
    key: "ipad",
    title: "iPad",
    label: platformDownloadLinks.ipad.isDirect ? "App Store" : "Buscar",
    href: platformDownloadLinks.ipad.href,
    icon: Tablet,
  },
  {
    key: "android",
    title: "Android",
    label: platformDownloadLinks.android.isDirect ? "Google Play" : "Buscar",
    href: platformDownloadLinks.android.href,
    icon: Smartphone,
  },
  {
    key: "web",
    title: "Web",
    label: "Acessar",
    href: platformDownloadLinks.web.href,
    icon: ArrowUpRight,
  },
] as const;

export function LandingDownloads() {
  return (
    <section
      id="downloads"
      className="relative overflow-hidden bg-[#0B0B0B] py-14 text-white md:py-24 scroll-mt-20"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(158,158,158,0.18),transparent_34%)]" />
        <div className="absolute left-[-5%] top-20 h-52 w-52 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute right-[-8%] bottom-0 h-64 w-64 rounded-full bg-[#8D8D8D]/18 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="mx-auto mb-12 max-w-xl text-center md:mb-16"
        >
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            Downloads
          </span>
          <h2 className="mt-5 text-3xl font-heading font-bold tracking-tight text-white md:text-5xl">
            Disponivel em todas as plataformas.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <motion.a
                key={platform.key}
                href={platform.href}
                target={platform.key === "web" ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group flex flex-col items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.055] p-6 transition-colors hover:bg-white/[0.09]"
              >
                <div className="rounded-2xl border border-white/10 bg-black/28 p-3">
                  <Icon className="h-5 w-5 text-white/88" />
                </div>
                <span className="text-sm font-semibold text-white">{platform.title}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-white/50 group-hover:text-white/80 transition-colors">
                  {platform.label}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
