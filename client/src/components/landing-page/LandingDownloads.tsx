import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Globe } from "lucide-react";
import { FaApple, FaWindows, FaAndroid } from "react-icons/fa";
import { platformDownloadLinks } from "./download-links";

type Platform = {
    name: string;
    subtitle: string;
    meta: string;
    icon: React.ComponentType<any>;
    href: string;
    external: boolean;
};

const platforms: Platform[] = [
    {
        name: "macOS",
        subtitle: "Apple Silicon & Intel",
        meta: "Universal · .dmg",
        icon: FaApple,
        href: platformDownloadLinks.mac.href,
        external: false,
    },
    {
        name: "Windows",
        subtitle: "Windows 10 ou superior",
        meta: "Instalador · .exe",
        icon: FaWindows,
        href: platformDownloadLinks.windows.href,
        external: false,
    },
    {
        name: "iPhone",
        subtitle: "iOS 15 ou superior",
        meta: "App Store",
        icon: FaApple,
        href: platformDownloadLinks.ios.href,
        external: true,
    },
    {
        name: "iPad",
        subtitle: "iPadOS 15 ou superior",
        meta: "App Store",
        icon: FaApple,
        href: platformDownloadLinks.ipad.href,
        external: true,
    },
    {
        name: "Android",
        subtitle: "Android 8 ou superior",
        meta: "Google Play",
        icon: FaAndroid,
        href: platformDownloadLinks.android.href,
        external: true,
    },
    {
        name: "Web",
        subtitle: "Acesso direto pelo navegador",
        meta: "vitaview.ai",
        icon: Globe,
        href: platformDownloadLinks.web.href,
        external: true,
    },
];

export function LandingDownloads() {
    return (
        <section
            id="downloads"
            className="relative bg-[#FAFAFA] overflow-hidden py-20 md:py-28 lg:py-32"
        >
            {/* Grão sutil para textura editorial */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
                aria-hidden
            />

            {/* Fio superior */}
            <div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#212121]/15 to-transparent"
                aria-hidden
            />

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20">
                    {/* COLUNA ESQUERDA — COPY EDITORIAL */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-5"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <span className="h-px w-10 bg-[#212121]" />
                            <span className="font-heading text-[11px] tracking-[0.22em] uppercase text-[#212121]">
                                Downloads
                            </span>
                        </div>

                        <h2 className="font-heading text-4xl sm:text-5xl lg:text-[3.6rem] xl:text-6xl font-bold text-[#212121] leading-[0.98] tracking-[-0.02em] mb-6">
                            Onde você
                            <br />
                            atende,{" "}
                            <span className="text-[#9E9E9E] italic font-light">
                                o VitaView
                                <br />
                                está.
                            </span>
                        </h2>

                        <p className="font-body text-[15px] md:text-base text-[#616161] leading-relaxed max-w-md mb-10">
                            Um prontuário, todos os dispositivos. Instale o VitaView no computador,
                            celular ou tablet — ou use direto pelo navegador. Sincronização
                            automática, sem complicação.
                        </p>

                        <div className="flex items-start gap-10 pt-6 border-t border-[#212121]/10">
                            <div>
                                <div className="font-heading text-[10px] tracking-[0.18em] uppercase text-[#9E9E9E]">
                                    Versão
                                </div>
                                <div className="font-heading text-sm font-semibold text-[#212121] mt-1.5">
                                    1.3 · build 254
                                </div>
                            </div>
                            <div>
                                <div className="font-heading text-[10px] tracking-[0.18em] uppercase text-[#9E9E9E]">
                                    Atualizado
                                </div>
                                <div className="font-heading text-sm font-semibold text-[#212121] mt-1.5">
                                    Abril · 2026
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* COLUNA DIREITA — GRID DE PLATAFORMAS */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#212121]/10 border border-[#212121]/10 rounded-[3px] overflow-hidden">
                            {platforms.map((p, i) => {
                                const Icon = p.icon;
                                const Arrow = p.external ? ArrowUpRight : ArrowDown;
                                return (
                                    <motion.a
                                        key={p.name}
                                        href={p.href}
                                        target={p.external ? "_blank" : undefined}
                                        rel={p.external ? "noopener noreferrer" : undefined}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-60px" }}
                                        transition={{
                                            duration: 0.55,
                                            delay: 0.05 + i * 0.06,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="group relative bg-[#FAFAFA] hover:bg-white p-7 md:p-8 flex flex-col justify-between min-h-[220px] transition-colors duration-500"
                                    >
                                        {/* Cabeçalho: ícone + índice */}
                                        <div className="flex items-start justify-between">
                                            <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-[#212121]/[0.04] group-hover:bg-[#212121] transition-colors duration-500">
                                                <Icon
                                                    className="w-[22px] h-[22px] text-[#212121] group-hover:text-white transition-colors duration-500"
                                                    strokeWidth={1.8}
                                                />
                                            </div>
                                            <span className="font-heading text-[10px] tracking-[0.18em] uppercase text-[#9E9E9E]">
                                                0{i + 1}
                                            </span>
                                        </div>

                                        {/* Conteúdo */}
                                        <div className="mt-10">
                                            <h3 className="font-heading text-[22px] font-bold text-[#212121] leading-none mb-2 tracking-tight">
                                                {p.name}
                                            </h3>
                                            <p className="font-body text-[13px] text-[#757575] leading-snug">
                                                {p.subtitle}
                                            </p>

                                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#212121]/8">
                                                <span className="font-heading text-[10px] tracking-[0.18em] uppercase text-[#9E9E9E]">
                                                    {p.meta}
                                                </span>
                                                <div className="flex items-center gap-2 text-[#212121]">
                                                    <span className="font-heading text-[10px] font-bold tracking-[0.18em] uppercase opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                                                        Baixar
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full border border-[#212121]/15 group-hover:border-[#212121] group-hover:bg-[#212121] flex items-center justify-center transition-all duration-500">
                                                        <Arrow
                                                            className="w-[14px] h-[14px] text-[#212121] group-hover:text-white transition-colors duration-500"
                                                            strokeWidth={2.2}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Rodapé da seção */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-16 lg:mt-20 pt-8 border-t border-[#212121]/10 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                    <p className="font-body text-[13px] text-[#757575] max-w-md leading-relaxed">
                        Builds assinados digitalmente e notarizados pela Apple. Conformidade com
                        LGPD e criptografia de ponta a ponta para dados clínicos.
                    </p>
                    <a
                        href="mailto:contato@vitaview.ai"
                        className="group inline-flex items-center gap-2 font-heading text-[11px] tracking-[0.18em] uppercase text-[#212121] self-start md:self-auto"
                    >
                        <span className="text-[#9E9E9E] group-hover:text-[#212121] transition-colors">
                            Problemas com o download?
                        </span>
                        <span className="underline underline-offset-[6px] decoration-[#212121]/30 group-hover:decoration-[#212121] transition-all">
                            contato@vitaview.ai
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.2} />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
