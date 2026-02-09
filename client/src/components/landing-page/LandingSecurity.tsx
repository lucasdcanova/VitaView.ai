import { motion } from "framer-motion";
import { ShieldCheck, Cloud, Lock, Database, FileKey, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingSecurity() {
    return (
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">
            {/* Minimalist Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none"></div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

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
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-6">
                                Segurança <span className="text-gray-500 line-through decoration-gray-400 decoration-2">Inegociável</span> para Seus Pacientes
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
                                <Lock className="w-32 h-32 text-white/90 drop-shadow-2xl" />

                                {/* Floating Cards */}
                                <div className="absolute -right-8 top-8 space-y-3">
                                    {[
                                        { icon: <Database className="w-4 h-4 text-[#212121]" />, text: "Backups Redundantes" },
                                        { icon: <FileKey className="w-4 h-4 text-[#212121]" />, text: "Criptografia AES-256" },
                                        { icon: <Cloud className="w-4 h-4 text-[#212121]" />, text: "Nuvem Certificada" },
                                        { icon: <ShieldCheck className="w-4 h-4 text-[#212121]" />, text: "Compliance Legal" },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={index}
                                            className="bg-white p-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-gray-100 min-w-[210px]"
                                            initial={{ x: 50, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + (index * 0.1) }}
                                            whileHover={{ x: -4 }}
                                        >
                                            <div className="p-1.5 bg-gray-100 rounded-md">
                                                {item.icon}
                                            </div>
                                            <span className="font-semibold text-xs text-gray-800 uppercase tracking-tight">{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Minimalist Decor */}
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
