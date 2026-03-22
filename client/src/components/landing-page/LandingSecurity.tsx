import { motion } from "framer-motion";
import { ShieldCheck, Cloud, Lock, Database, FileKey, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingSecurity() {
    return (
        <section id="seguranca" className="py-12 md:py-20 bg-white relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
            {/* Minimalist Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none"></div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-24">

                    {/* Text Content */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-gray-100 text-gray-900 font-bold tracking-wide text-xs uppercase mb-4 border border-gray-200">
                                Blindagem Digital
                            </span>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-[#212121] leading-[1.1] mb-8 tracking-tight">
                                Segurança <br />
                                <span className="text-gray-400">Inegociável.</span>
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Utilizamos criptografia de ponta a ponta e infraestrutura certificada para garantir a confidencialidade e integridade dos prontuários.
                                <br className="hidden md:block" /> Foco total em conformidade com LGPD.
                            </p>

                            <Button className="bg-[#212121] hover:bg-[#424242] text-white font-bold py-6 px-8 rounded-lg text-lg shadow-lg transition-all">
                                Ver Protocolos de Segurança
                            </Button>
                        </motion.div>
                    </div>

                    {/* Visual / Features */}
                    <div className="lg:w-1/2 relative">
                        {/* Abstract Lock Illustration Area */}
                        <motion.div
                            className="relative z-10"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="relative w-full max-w-md mx-auto aspect-square bg-[#111111] rounded-3xl shadow-2xl flex items-center justify-center p-8 border border-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none" />
                                <Lock className="w-24 h-24 md:w-32 md:h-32 text-white/90 drop-shadow-2xl" />

                                {/* Floating Cards - hidden on mobile, positioned outside on desktop */}
                                <div className="hidden lg:block absolute -right-12 top-12 space-y-4">
                                    {[
                                        {
                                            icon: <Database className="w-5 h-5 text-blue-600" />,
                                            text: "Backups Redundantes",
                                            detail: "Sincronização em tempo real",
                                        },
                                        {
                                            icon: <FileKey className="w-5 h-5 text-emerald-600" />,
                                            text: "Criptografia AES-256",
                                            detail: "Padrão bancário de proteção",
                                        },
                                        {
                                            icon: <Cloud className="w-5 h-5 text-purple-600" />,
                                            text: "Nuvem Certificada",
                                            detail: "Infraestrutura AWS Health",
                                        },
                                        {
                                            icon: <ShieldCheck className="w-5 h-5 text-gray-900" />,
                                            text: "Compliance Legal",
                                            detail: "100% aderente à LGPD",
                                        },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={index}
                                            className="bg-white p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 border border-gray-100 min-w-[280px]"
                                            initial={{ x: 50, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + (index * 0.1) }}
                                            whileHover={{ x: -4 }}
                                        >
                                            <div className="p-2 bg-gray-50 rounded-xl">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <span className="block font-bold text-[13px] text-gray-900 uppercase tracking-tight">{item.text}</span>
                                                <span className="block text-[10px] text-gray-400 font-medium">{item.detail}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Security Features Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-6 lg:hidden">
                                {[
                                    { icon: <Database className="w-4 h-4 text-[#212121]" />, text: "Backups Redundantes" },
                                    { icon: <FileKey className="w-4 h-4 text-[#212121]" />, text: "Criptografia AES-256" },
                                    { icon: <Cloud className="w-4 h-4 text-[#212121]" />, text: "Nuvem Certificada" },
                                    { icon: <ShieldCheck className="w-4 h-4 text-[#212121]" />, text: "Compliance Legal" },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-white p-3 rounded-xl shadow-md flex items-center gap-2.5 border border-gray-100"
                                    >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                            {item.icon}
                                        </div>
                                        <span className="font-semibold text-xs text-gray-800 uppercase tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Minimalist Decor */}
                        <div className="hidden md:block absolute -bottom-10 -left-10 w-64 h-64 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="hidden md:block absolute -top-10 -right-10 w-64 h-64 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
