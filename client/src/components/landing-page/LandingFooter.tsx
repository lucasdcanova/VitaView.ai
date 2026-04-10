import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { FaAndroid, FaApple, FaWindows } from "react-icons/fa";
import { platformDownloadLinks } from "./download-links";
import { useIsMobile } from "@/hooks/use-mobile";

const desktopPlatforms = [
    { key: "windows", title: "Windows", href: platformDownloadLinks.windows.href, icon: FaWindows, iconColor: "#00A4EF" },
    { key: "mac", title: "macOS", href: platformDownloadLinks.mac.href, icon: FaApple, iconColor: "#F5F5F5" }
];

const mobilePlatforms = [
    { key: "ios", title: "iOS", href: platformDownloadLinks.ios.href, icon: FaApple, iconColor: "#F5F5F5" },
    { key: "android", title: "Android", href: platformDownloadLinks.android.href, icon: FaAndroid, iconColor: "#3DDC84" }
];

export function LandingFooter() {
    const isMobile = useIsMobile();

    return (
        <footer className="bg-[#212121] text-[#9E9E9E] py-8 md:py-9 relative overflow-hidden">
            {/* Elementos decorativos do footer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute top-0 left-0 w-96 h-96 bg-[#424242] rounded-full opacity-5 blur-3xl"
                    animate={isMobile ? { x: 0, y: 0, scale: 1 } : {
                        x: [0, 10, 0],
                        y: [0, -10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: isMobile ? 0 : 15,
                        repeat: isMobile ? 0 : Infinity,
                        repeatType: "reverse"
                    }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-96 h-96 bg-[#212121] rounded-full opacity-5 blur-3xl"
                    animate={isMobile ? { x: 0, y: 0, scale: 1 } : {
                        x: [0, -10, 0],
                        y: [0, 10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: isMobile ? 0 : 12,
                        repeat: isMobile ? 0 : Infinity,
                        repeatType: "reverse"
                    }}
                />
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    id="downloads"
                    className="mb-8 rounded-[30px] border border-white/10 bg-white/[0.04] p-4 md:p-5 backdrop-blur-sm md:mb-9"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between w-full">
                        <div className="min-w-0 flex-1 space-y-4 md:space-y-5">
                            <div className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45 md:whitespace-nowrap">
                                <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-white/35" />
                                <span>Disponível em toda a rotina</span>
                                <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-white/35" />
                            </div>

                            <div>
                                <h2 className="text-[1.8rem] font-heading font-bold tracking-tight text-white md:text-[2rem] xl:text-[2.2rem]">
                                    Baixe o VitaView AI.
                                </h2>
                                <p className="mt-1.5 max-w-[34rem] text-[13px] leading-relaxed text-white/55 xl:text-[14.5px]">
                                    No desktop e no celular, com continuidade no mesmo fluxo clínico.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 xl:gap-10 xl:items-center xl:justify-end">
                            {/* Desktop Platforms */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[11px] xl:text-[12px] font-semibold text-white/40 uppercase tracking-wider">Computador</h3>
                                    <span className="hidden sm:block h-[1px] w-12 bg-white/10"></span>
                                </div>
                                <div className="grid gap-3 grid-cols-2 sm:flex sm:flex-nowrap">
                                    {desktopPlatforms.map((platform, index) => {
                                        const Icon = platform.icon;
                                        return (
                                            <motion.a
                                                key={platform.key}
                                                href={platform.href}
                                                className="group flex w-full items-center justify-between border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:bg-white/[0.06] hover:text-white h-[3.5rem] rounded-[18px] pl-2.5 pr-3.5 sm:h-[3.6rem] md:h-[3.8rem] md:w-auto md:min-w-[11rem] xl:h-[4.2rem] xl:min-w-[12rem] xl:rounded-[20px] xl:pl-3 xl:pr-4"
                                                initial={{ opacity: 0, y: 16 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.35, delay: index * 0.04 }}
                                            >
                                                <div className="flex items-center gap-2.5 xl:gap-3.5">
                                                    <span className="inline-flex items-center justify-center bg-white/[0.055] ring-1 ring-white/[0.045] h-10 w-10 text-white/80 rounded-[14px] sm:h-11 sm:w-11 md:h-12 md:w-12 md:rounded-[15px] xl:h-[3.2rem] xl:w-[3.2rem] xl:rounded-[16px]">
                                                        <Icon className="-translate-y-[1px] -translate-x-[1px] h-[1.8rem] w-[1.8rem] sm:h-[2rem] sm:w-[2rem] md:h-[2.1rem] md:w-[2.1rem] xl:h-[2.3rem] xl:w-[2.3rem]" style={{ color: platform.iconColor }} />
                                                    </span>
                                                    <p className="text-[14px] font-semibold leading-none text-white/90 sm:text-[14.5px] md:text-[15px] xl:text-[16px]">{platform.title}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white/60 md:h-4.5 md:w-4.5 xl:h-5 xl:w-5" />
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="hidden sm:block w-px bg-white/10 self-stretch mt-8 mb-2"></div>

                            {/* Mobile Platforms */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[11px] xl:text-[12px] font-semibold text-white/40 uppercase tracking-wider">Dispositivos Móveis</h3>
                                    <span className="hidden sm:block h-[1px] w-12 bg-white/10"></span>
                                </div>
                                <div className="grid gap-3 grid-cols-2 sm:flex sm:flex-nowrap">
                                    {mobilePlatforms.map((platform, index) => {
                                        const Icon = platform.icon;
                                        return (
                                            <motion.a
                                                key={platform.key}
                                                href={platform.href}
                                                className="group flex w-full items-center justify-between border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:bg-white/[0.06] hover:text-white h-[3.5rem] rounded-[18px] pl-2.5 pr-3.5 sm:h-[3.6rem] md:h-[3.8rem] md:w-auto md:min-w-[11rem] xl:h-[4.2rem] xl:min-w-[12rem] xl:rounded-[20px] xl:pl-3 xl:pr-4"
                                                initial={{ opacity: 0, y: 16 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.35, delay: 0.1 + index * 0.04 }}
                                            >
                                                <div className="flex items-center gap-2.5 xl:gap-3.5">
                                                    <span className="inline-flex items-center justify-center bg-white/[0.055] ring-1 ring-white/[0.045] h-10 w-10 text-white/80 rounded-[14px] sm:h-11 sm:w-11 md:h-12 md:w-12 md:rounded-[15px] xl:h-[3.2rem] xl:w-[3.2rem] xl:rounded-[16px]">
                                                        <Icon className="-translate-y-[1px] -translate-x-[1px] h-[1.8rem] w-[1.8rem] sm:h-[2rem] sm:w-[2rem] md:h-[2.1rem] md:w-[2.1rem] xl:h-[2.3rem] xl:w-[2.3rem]" style={{ color: platform.iconColor }} />
                                                    </span>
                                                    <p className="text-[14px] font-semibold leading-none text-white/90 sm:text-[14.5px] md:text-[15px] xl:text-[16px]">{platform.title}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white/60 md:h-4.5 md:w-4.5 xl:h-5 xl:w-5" />
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="flex flex-col md:flex-row md:items-start"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <motion.div
                        className="mb-5 md:mb-0"
                        whileHover={{ y: -2, scale: 1.01 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="flex items-center mb-3">
                            <img
                                src="/icon-192x192-dark.png"
                                alt="VitaView AI"
                                className="mr-3 h-8 w-8 rounded-md object-contain bg-[#171A20] ring-1 ring-white/10"
                            />
                            <span className="text-xl font-bold text-white">VitaView AI</span>
                        </div>
                        <p className="max-w-xs">
                            O Prontuário que pensa com você. Simples, objetivo e completo.
                        </p>

                        <div className="mt-4 hidden md:block">
                            <motion.a
                                href="mailto:contato@vitaview.ai"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                                whileHover={{ y: -1, scale: 1.015 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span>contato@vitaview.ai</span>
                                <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06]">
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            </motion.a>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-5 md:ml-auto md:w-[min(100%,48rem)] md:grid-cols-[1fr_auto] md:gap-10 md:self-start">
                        <motion.div
                            className="md:min-w-0"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.08 }}
                        >
                            <h3 className="text-white font-semibold mb-3">Explorar</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
                                {[
                                    { label: "Visualização Clínica", href: "#como-funciona" },
                                    { label: "Anamnese", href: "#anamnese-ia" },
                                    { label: "Sugestão de dose", href: "#dose-inteligente" },
                                    { label: "Prescrição Digital", href: "#prescricao-digital" },
                                    { label: "Solicitação de Exames", href: "#protocolos-exames" },
                                    { label: "Agenda clínica", href: "#agenda" },
                                    { label: "Vita Assist", href: "#recursos" },
                                    { label: "Migração", href: "#migracao" },
                                    { label: "Segurança", href: "#seguranca" },
                                    { label: "Depoimentos", href: "#depoimentos" },
                                    { label: "Planos", href: "#precos" },
                                    { label: "Perguntas Frequentes", href: "#faq" }
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: 0.08 + (i * 0.04) }}
                                    >
                                        <motion.a
                                            href={item.href}
                                            className="hover:text-white transition-colors relative group inline-block"
                                            whileHover={{ x: 3 }}
                                        >
                                            {item.label}
                                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white/60 group-hover:w-full transition-all duration-300"></span>
                                        </motion.a>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            className="md:justify-self-end"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="text-white font-semibold mb-3">Legal</h3>
                            <ul className="space-y-2">
                                {[
                                    { label: "Termos de Uso", href: "/termos" },
                                    { label: "Privacidade", href: "/privacidade" },
                                    { label: "Segurança", href: "#seguranca" }
                                ].map((item, i) => (
                                    <motion.li
                                        key={item.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: 0.3 + (i * 0.05) }}
                                    >
                                        <motion.a
                                            href={item.href}
                                            className="hover:text-white transition-colors relative group inline-block"
                                            whileHover={{ x: 3 }}
                                        >
                                            {item.label}
                                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white/60 group-hover:w-full transition-all duration-300"></span>
                                        </motion.a>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                >
                    <p>&copy; {new Date().getFullYear()} VitaView AI. Todos os direitos reservados.</p>
                    <div className="flex justify-center mt-4 md:mt-0 items-center gap-5">
                        <motion.a
                            href="mailto:contato@vitaview.ai"
                            className="text-[#9E9E9E] hover:text-white transition-colors group"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.48 }}
                            whileHover={{ y: -2, scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                        d="M4 6.75h16A1.25 1.25 0 0 1 21.25 8v8A1.25 1.25 0 0 1 20 17.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="m3.5 8 7.41 5.19a1.9 1.9 0 0 0 2.18 0L20.5 8"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span className="text-sm font-medium group-hover:text-[#E0E0E0] transition-colors">
                                    contato@vitaview.ai
                                </span>
                            </div>
                        </motion.a>

                        <motion.a
                            href="https://instagram.com/vitaview.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9E9E9E] hover:text-white transition-colors group"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            whileHover={{ y: -2, scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                                <span className="text-sm font-medium group-hover:text-[#E0E0E0] transition-colors">
                                    @vitaview.ai
                                </span>
                            </div>
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
