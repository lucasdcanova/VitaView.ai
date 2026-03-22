import { motion } from "framer-motion";
import { ArrowUpRight, Download, Laptop, Monitor, RefreshCw, ShieldCheck, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platformDownloadLinks } from "./download-links";

const platformCards = [
  {
    key: "windows",
    eyebrow: "Disponivel agora",
    title: "Windows",
    description: "Instalador .exe com atualizacoes automaticas para abrir o VitaView como app desktop.",
    href: platformDownloadLinks.windows.href,
    buttonLabel: "Baixar para Windows",
    helper: "Windows 10 ou 11 · 64-bit · instalacao imediata",
    icon: Monitor,
    isPrimary: true,
    isDirect: true,
  },
  {
    key: "mac",
    eyebrow: platformDownloadLinks.mac.isDirect ? "Mac App Store" : "Mac App Store em publicacao",
    title: "macOS",
    description: "Abra a listagem da App Store para Mac assim que a publicacao estiver disponivel.",
    href: platformDownloadLinks.mac.href,
    buttonLabel: platformDownloadLinks.mac.isDirect ? "Abrir na App Store" : "Buscar na App Store",
    helper: platformDownloadLinks.mac.isDirect
      ? "Mac App Store · link oficial publicado"
      : "Fallback atual: busca da App Store ate o link oficial entrar no ambiente",
    icon: Laptop,
    isDirect: platformDownloadLinks.mac.isDirect,
  },
  {
    key: "ios",
    eyebrow: platformDownloadLinks.ios.isDirect ? "iPhone" : "iPhone em publicacao",
    title: "iPhone",
    description: "Leve o VitaView no bolso com o fluxo otimizado para iOS.",
    href: platformDownloadLinks.ios.href,
    buttonLabel: platformDownloadLinks.ios.isDirect ? "Abrir no App Store" : "Buscar no App Store",
    helper: platformDownloadLinks.ios.isDirect
      ? "iOS · link oficial publicado"
      : "Fallback atual: busca da App Store ate o link oficial entrar no ambiente",
    icon: Smartphone,
    isDirect: platformDownloadLinks.ios.isDirect,
  },
  {
    key: "ipad",
    eyebrow: platformDownloadLinks.ipad.isDirect ? "iPad" : "iPad em publicacao",
    title: "iPad",
    description: "Experiencia de consulta em tela maior, pensada para atendimento e prontuario.",
    href: platformDownloadLinks.ipad.href,
    buttonLabel: platformDownloadLinks.ipad.isDirect ? "Abrir no App Store" : "Buscar no App Store",
    helper: platformDownloadLinks.ipad.isDirect
      ? "iPadOS · link oficial publicado"
      : "Fallback atual: busca da App Store ate o link oficial entrar no ambiente",
    icon: Tablet,
    isDirect: platformDownloadLinks.ipad.isDirect,
  },
  {
    key: "android",
    eyebrow: platformDownloadLinks.android.isDirect ? "Google Play" : "Android em publicacao",
    title: "Android",
    description: "Abra a pagina do VitaView na Google Play assim que a distribuicao publica estiver ativa.",
    href: platformDownloadLinks.android.href,
    buttonLabel: platformDownloadLinks.android.isDirect ? "Abrir no Google Play" : "Buscar no Google Play",
    helper: platformDownloadLinks.android.isDirect
      ? "Android · link oficial publicado"
      : "Fallback atual: busca da Google Play ate o link oficial entrar no ambiente",
    icon: Smartphone,
    isDirect: platformDownloadLinks.android.isDirect,
  },
] as const;

const operationalHighlights = [
  {
    title: "Mesmo login, mesma conta",
    description: "A autenticacao e os dados continuam centralizados na sua conta VitaView existente.",
    icon: ShieldCheck,
  },
  {
    title: "Atualizacao continua",
    description: "O app Windows verifica novas versoes automaticamente e atualiza o shell desktop quando necessario.",
    icon: RefreshCw,
  },
  {
    title: "Acesso imediato na web",
    description: "Enquanto App Store e Google Play entram no ar, qualquer dispositivo pode usar o VitaView no navegador.",
    icon: Download,
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
          className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
        >
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            Downloads
          </span>
          <h2 className="mt-5 text-3xl font-heading font-bold tracking-tight text-white md:text-5xl">
            Escolha a plataforma e entre no VitaView sem desvio.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
            O Windows ja pode baixar o instalador direto. Mac, iPhone, iPad e Android ficam prontos nesta mesma area, com busca nas lojas e fallback imediato para a versao web.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.48 }}
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))] p-6 shadow-[0_24px_70px_-32px_rgba(0,0,0,0.65)] md:p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_35%)] pointer-events-none" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                    {platformCards[0].eyebrow}
                  </span>
                  <h3 className="mt-4 text-2xl font-heading font-bold text-white md:text-[2rem]">
                    VitaView para Windows
                  </h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <Monitor className="h-7 w-7 text-white" />
                </div>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 md:text-base">
                Instalador direto em `.exe`, com shell desktop dedicado e caminho de atualizacao preparado para as proximas releases.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {operationalHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-black/24 p-4"
                    >
                      <Icon className="h-5 w-5 text-white/86" />
                      <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-xs leading-6 text-white/62">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-auto rounded-2xl bg-white px-6 py-4 font-heading text-sm font-bold text-[#111111] hover:bg-white/90"
                >
                  <a href={platformCards[0].href} rel="noopener noreferrer">
                    Baixar para Windows
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>

                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs text-white/64">
                  VitaView-Setup.exe
                  <span className="mx-2 text-white/28">•</span>
                  atualizacao automatica pronta
                </div>
              </div>
            </div>
          </motion.article>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {platformCards.slice(1).map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.42, delay: index * 0.04 }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.7)] backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/48">
                        {card.eyebrow}
                      </span>
                      <h3 className="mt-3 text-xl font-heading font-bold text-white">
                        {card.title}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/28 p-3">
                      <Icon className="h-5 w-5 text-white/88" />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/68">
                    {card.description}
                  </p>

                  <div className="mt-5 flex flex-col gap-3">
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-auto rounded-2xl border-white/16 bg-white/[0.04] px-4 py-3 font-heading text-sm font-bold text-white hover:bg-white/[0.09]"
                    >
                      <a href={card.href} target="_blank" rel="noopener noreferrer">
                        {card.buttonLabel}
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>

                    <div className="text-xs leading-6 text-white/50">
                      {card.helper}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-sm text-white/70 md:mt-8 md:flex md:items-center md:justify-between md:gap-6 md:p-6"
        >
          <div>
            <p className="font-semibold uppercase tracking-[0.22em] text-white/50">
              Enquanto as lojas entram no ar
            </p>
            <p className="mt-2 max-w-2xl leading-7">
              Mac, iPhone, iPad e Android ja podem abrir a versao web agora. Assim que os links oficiais forem publicados, basta preencher as variaveis `VITE_MAC_APP_STORE_URL`, `VITE_IOS_APP_STORE_URL`, `VITE_IPAD_APP_STORE_URL` e `VITE_ANDROID_STORE_URL`.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="mt-4 h-auto rounded-2xl border-white/14 bg-transparent px-5 py-3 font-heading text-sm font-bold text-white hover:bg-white/[0.08] md:mt-0"
          >
            <a href={platformDownloadLinks.web.href}>
              Abrir versao web
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
