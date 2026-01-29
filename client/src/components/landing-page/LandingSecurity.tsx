import { motion } from "framer-motion";
import { ShieldCheck, Cloud, Lock, Database, FileKey, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingSecurity() {
    return (
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 opacity-50 pointer-events-none"></div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Text Content */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="text-purple-600 font-bold tracking-wider text-sm uppercase mb-2 block">
                                Segurança de Nível Bancário
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-6">
                                Nós <span className="text-purple-600">protegemos</span> os dados do seu paciente
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Informações tão importantes não podem ser armazenadas de qualquer jeito.
                                A sua segurança e a do seu paciente é nossa prioridade absoluta.
                            </p>

                            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 px-8 rounded-lg text-lg shadow-lg hover:shadow-purple-200/50 transition-all">
                                Conhecer todos os recursos
                            </Button>
                        </motion.div>
                    </div>

                    {/* Visual / Features */}
                    <div className="lg:w-1/2 relative">
                        {/* Abstract Lock Illustration Area */}
                        <motion.div
                            className="relative z-10"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="relative w-full max-w-md mx-auto aspect-square bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl shadow-2xl flex items-center justify-center p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <Lock className="w-32 h-32 text-white/90" />

                                {/* Floating Cards */}
                                <div className="absolute -right-12 top-10 space-y-4">
                                    {[
                                        { icon: <Database className="w-5 h-5 text-purple-600" />, text: "Backup diário" },
                                        { icon: <FileKey className="w-5 h-5 text-purple-600" />, text: "Criptografia" },
                                        { icon: <Cloud className="w-5 h-5 text-purple-600" />, text: "Em nuvem" },
                                        { icon: <ShieldCheck className="w-5 h-5 text-purple-600" />, text: "LGPD" },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={index}
                                            className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3 border border-purple-100 min-w-[200px]"
                                            initial={{ x: 50, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + (index * 0.1) }}
                                            whileHover={{ x: -5 }}
                                        >
                                            <div className="p-2 bg-purple-50 rounded-lg">
                                                {item.icon}
                                            </div>
                                            <span className="font-bold text-gray-800">{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Decorative Blur */}
                        <div className="absolute -inset-4 bg-purple-200 blur-3xl opacity-30 rounded-full z-0"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
