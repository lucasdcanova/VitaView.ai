import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const supportWhatsAppUrl =
    "https://wa.me/555597032546?text=Ol%C3%A1%2C%20quero%20falar%20com%20a%20equipe%20da%20VitaView%20AI.";

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
                            Prontuário eletrônico inteligente com IA para médicos e clínicas. Simples, objetivo e completo.
                        </p>

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
                            href={supportWhatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#9E9E9E] hover:text-white transition-colors group"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.49 }}
                            whileHover={{ y: -2, scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                        d="M8.5 18.5l-3 .8.8-3A7 7 0 1119 12a7 7 0 01-10.5 6.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M9.8 10.1c.2-.5.5-.6.8-.6h.7c.2 0 .5.1.6.4l.6 1.4c.1.2.1.5-.1.7l-.6.8a5.7 5.7 0 002.7 2.7l.8-.6c.2-.2.5-.2.7-.1l1.4.6c.3.1.4.4.4.6v.7c0 .3-.2.6-.6.8-.6.2-1.9.3-3.9-.7-1.6-.8-3.3-2.5-4.1-4.1-1-2-.9-3.3-.7-3.9z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span className="text-sm font-medium group-hover:text-[#E0E0E0] transition-colors">
                                    WhatsApp
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
