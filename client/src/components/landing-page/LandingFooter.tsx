import { motion } from "framer-motion";
import { ChevronRight, Globe2 } from "lucide-react";
import { FaAndroid, FaApple, FaWindows } from "react-icons/fa";
import { platformDownloadLinks } from "./download-links";

const footerPlatforms = [
    { key: "windows", title: "Windows", href: platformDownloadLinks.windows.href, icon: FaWindows, iconColor: "#00A4EF" },
    { key: "mac", title: "macOS", href: platformDownloadLinks.mac.href, icon: FaApple, iconColor: "#F5F5F5" },
    { key: "ios", title: "iPhone", href: platformDownloadLinks.ios.href, icon: FaApple, iconColor: "#F5F5F5" },
    { key: "ipad", title: "iPad", href: platformDownloadLinks.ipad.href, icon: FaApple, iconColor: "#F5F5F5" },
    { key: "android", title: "Android", href: platformDownloadLinks.android.href, icon: FaAndroid, iconColor: "#3DDC84" },
    { key: "web", title: "Web", href: platformDownloadLinks.web.href, icon: Globe2, iconColor: "#E7C88D", target: "_blank" as const }
];

export function LandingFooter() {
    return (
        <footer className="bg-[#212121] text-[#9E9E9E] py-10 md:py-12 relative overflow-hidden">
            {/* Elementos decorativos do footer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute top-0 left-0 w-96 h-96 bg-[#424242] rounded-full opacity-5 blur-3xl"
                    animate={{
                        x: [0, 10, 0],
                        y: [0, -10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-96 h-96 bg-[#212121] rounded-full opacity-5 blur-3xl"
                    animate={{
                        x: [0, -10, 0],
                        y: [0, 10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    id="downloads"
                    className="mb-10 rounded-[30px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm md:mb-12 md:p-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:items-center">
                        <div className="max-w-sm">
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                                Downloads
                            </span>
                            <h2 className="mt-4 text-2xl font-heading font-bold tracking-tight text-white md:text-[2.1rem]">
                                Baixe o VitaView.
                            </h2>
                            <p className="mt-2 text-[13px] leading-6 text-white/55 md:text-[14px]">
                                Acesse no desktop, no celular ou direto pelo navegador.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {footerPlatforms.map((platform, index) => {
                                const Icon = platform.icon;

                                return (
                                    <motion.a
                                        key={platform.key}
                                        href={platform.href}
                                        target={platform.target}
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/78 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white"
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.35, delay: index * 0.04 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/[0.05]">
                                                <Icon className="h-4.5 w-4.5" style={{ color: platform.iconColor }} />
                                            </span>
                                            <div>
                                                <p className="text-[14px] font-semibold text-white">{platform.title}</p>
                                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                                                    {platform.key === "web" ? "abrir" : "baixar"}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-white/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white/60" />
                                    </motion.a>
                                );
                            })}
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
                        className="mb-6 md:mb-0"
                        whileHover={{ y: -2, scale: 1.01 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="flex items-center mb-4">
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

                        {/* Inscrição na newsletter */}
                        <div className="mt-6 hidden md:block">
                            <p className="text-sm mb-2 font-medium text-[#9E9E9E]">Fique atualizado:</p>
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="Seu e-mail"
                                    className="bg-[#212121] border border-[#424242] px-3 py-2 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-[#212121] text-white w-full max-w-[200px]"
                                />
                                <motion.button
                                    className="bg-[#212121] hover:bg-[#424242] px-3 py-2 rounded-r-md text-white text-sm"
                                    whileHover={{ y: -1, scale: 1.015 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-[1.2fr_0.8fr] gap-6 md:gap-8 md:ml-auto md:w-fit md:self-start">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.08 }}
                        >
                            <h3 className="text-white font-semibold mb-4">Explorar</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
                                {[
                                    { label: "Visualização Clínica", href: "#como-funciona" },
                                    { label: "Anamnese com IA", href: "#anamnese-ia" },
                                    { label: "Dose Inteligente", href: "#dose-inteligente" },
                                    { label: "Prescrição Digital", href: "#prescricao-digital" },
                                    { label: "Solicitação de Exames", href: "#protocolos-exames" },
                                    { label: "Agenda com IA", href: "#agenda" },
                                    { label: "Vita Assist", href: "#recursos" },
                                    { label: "Migração", href: "#migracao" },
                                    { label: "Segurança", href: "#seguranca" },
                                    { label: "Depoimentos", href: "#depoimentos" },
                                    { label: "Planos", href: "#precos" },
                                    { label: "Downloads", href: "#downloads" },
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
                                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
                                        </motion.a>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="text-white font-semibold mb-4">Legal</h3>
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
                                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
                                        </motion.a>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
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
