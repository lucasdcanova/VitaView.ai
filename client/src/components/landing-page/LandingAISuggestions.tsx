import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function LandingAISuggestions() {
    return (
        <section className="py-20 md:py-28 bg-[#0A0A0A] relative overflow-hidden text-white">
            {/* Background Effects - Subtle Monochrome */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] opacity-20"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    {/* Visual Mockup - Prescription Input with AI Suggestion */}
                    <div className="lg:w-1/2 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            {/* Glow behind the mockup */}
                            <div className="absolute -inset-1 bg-white/10 rounded-xl blur-xl opacity-50"></div>

                            <div className="bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-8 relative overflow-hidden">
                                <div className="space-y-6">
                                    {/* Mock Label */}
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-white/80">Medicamento / Substância</label>
                                        <span className="text-xs text-white/40">Busca inteligente</span>
                                    </div>

                                    {/* Mock Input Field */}
                                    <div className="relative">
                                        <div className="flex items-center bg-[#1A1A1A] border border-white/20 rounded-lg p-4 shadow-inner">
                                            <div className="w-px h-6 bg-white/20 mr-4 animate-pulse"></div>
                                            <span className="text-lg text-white font-medium">Amoxicili</span>
                                        </div>

                                        {/* AI Suggestion Dropdown/Tooltip */}
                                        <motion.div
                                            className="absolute top-full left-0 mt-2 w-full bg-[#1A1A1A] border border-white/20 rounded-lg shadow-xl overflow-hidden z-20"
                                            initial={{ opacity: 0, y: -10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6, duration: 0.4 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className="p-1">
                                                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded">
                                                    <span className="text-white font-medium">Amoxicilina 500mg</span>
                                                    <span className="text-xs bg-white text-black px-1.5 py-0.5 rounded font-bold">IA</span>
                                                </div>
                                            </div>

                                            <div className="p-3 border-t border-white/10 bg-[#111111]">
                                                <div className="flex items-start gap-3">
                                                    <Sparkles className="w-4 h-4 text-white mt-1 shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-white/90 font-medium mb-1">
                                                            Sugestão para Infecção Respiratória:
                                                        </p>
                                                        <p className="text-xs text-white/60">
                                                            Tomar 1 cápsula (500mg) a cada 8 horas por 7 dias.
                                                        </p>
                                                        <div className="mt-2 flex gap-2">
                                                            <span className="text-[10px] border border-white/20 rounded px-1.5 py-0.5 text-white/50">Baseado no histórico</span>
                                                            <span className="text-[10px] border border-white/20 rounded px-1.5 py-0.5 text-white/50">Peso: 70kg</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Context info to fill space */}
                                    <div className="pt-16 opacity-50 blur-[1px]">
                                        <div className="h-4 bg-white/10 rounded w-1/3 mb-3"></div>
                                        <div className="h-10 bg-[#1A1A1A] border border-white/10 rounded-lg w-full"></div>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Text Content */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white font-bold tracking-wide text-xs uppercase mb-4 border border-white/20">
                                Diferencial VitaView
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white leading-tight mb-6">
                                Sugestão Inteligente <br />
                                <span className="text-white/50">
                                    de Dose.
                                </span>
                            </h2>
                            <p className="text-lg text-white/70 mb-8 leading-relaxed">
                                Esqueça a busca manual por posologias. Nossa IA analisa o contexto do paciente e sugere a posologia mais provável diretamente no campo de prescrição. O controle e a decisão final são sempre seus.
                            </p>

                            <div className="grid grid-cols-1 gap-6 mb-8">
                                {[
                                    {
                                        icon: <Brain className="w-5 h-5" />,
                                        title: "Contexto Clínico",
                                        desc: "Ajusta a sugestão baseada no peso, idade e histórico do paciente."
                                    },
                                    {
                                        icon: <Zap className="w-5 h-5" />,
                                        title: "Preenchimento Instantâneo",
                                        desc: "Aceite a sugestão com um clique ou tecla de atalho."
                                    },
                                    {
                                        icon: <ShieldCheck className="w-5 h-5" />,
                                        title: "Redução de Erros",
                                        desc: "Padronização que evita erros de digitação e dosagem."
                                    }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg text-white border border-white/10">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{feature.title}</h4>
                                            <p className="text-sm text-white/50">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/auth">
                                <Button className="bg-white text-[#0A0A0A] hover:bg-gray-200 font-bold py-6 px-8 rounded-lg text-lg shadow-lg hover:shadow-white/10 transition-all border border-transparent">
                                    Ver na Prática
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
