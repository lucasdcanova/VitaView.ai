import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Globe } from "lucide-react";
import { FaApple, FaWindows, FaAndroid } from "react-icons/fa";
import { platformDownloadLinks } from "./download-links";
import { tokens } from "./landing-tokens";

type Platform = {
    name: string;
    icon: React.ComponentType<any>;
    href: string;
    external: boolean;
};

const platforms: Platform[] = [
    { name: "macOS", icon: FaApple, href: platformDownloadLinks.mac.href, external: false },
    { name: "Windows", icon: FaWindows, href: platformDownloadLinks.windows.href, external: false },
    { name: "iPhone", icon: FaApple, href: platformDownloadLinks.ios.href, external: true },
    { name: "iPad", icon: FaApple, href: platformDownloadLinks.ipad.href, external: true },
    { name: "Android", icon: FaAndroid, href: platformDownloadLinks.android.href, external: true },
    { name: "Web", icon: Globe, href: platformDownloadLinks.web.href, external: true },
];

export function LandingDownloads() {
    return (
        <section
            id="downloads"
            className={`relative ${tokens.section.light} overflow-hidden ${tokens.section.padding}`}
        >
            {/* Grão sutil */}
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-center">
                    {/* COLUNA ESQUERDA — COPY EDITORIAL */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-5"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className={tokens.eyebrow.lineLight} />
                            <span className={tokens.eyebrow.light}>Downloads</span>
                        </div>

                        <h2 className={`${tokens.h2.light} mb-6`}>
                            Onde você
                            <br />
                            atende,{" "}
                            <span className={tokens.h2.splitLight}>
                                o VitaView está.
                            </span>
                        </h2>

                        <p className={`${tokens.body.light} max-w-md`}>
                            Um prontuário, todos os dispositivos. Sincronização automática, sem
                            complicação.
                        </p>
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
                                        className="group relative bg-[#FAFAFA] hover:bg-white px-7 py-8 md:px-8 md:py-9 flex items-center justify-between transition-colors duration-500"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#212121]/[0.04] group-hover:bg-[#212121] transition-colors duration-500">
                                                <Icon
                                                    className="w-[22px] h-[22px] text-[#212121] group-hover:text-white transition-colors duration-500"
                                                    strokeWidth={1.8}
                                                />
                                            </div>
                                            <h3 className="font-heading text-[22px] font-bold text-[#212121] leading-none tracking-tight">
                                                {p.name}
                                            </h3>
                                        </div>

                                        <div className="w-9 h-9 rounded-full border border-[#212121]/15 group-hover:border-[#212121] group-hover:bg-[#212121] flex items-center justify-center transition-all duration-500">
                                            <Arrow
                                                className="w-[14px] h-[14px] text-[#212121] group-hover:text-white transition-colors duration-500"
                                                strokeWidth={2.2}
                                            />
                                        </div>
                                    </motion.a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
