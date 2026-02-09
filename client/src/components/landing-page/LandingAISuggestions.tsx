import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Wand2, BrainCircuit, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function LandingAISuggestions() {
    return (
        <section className="py-20 md:py-28 bg-[#0A0A0A] relative overflow-hidden text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] opacity-30"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px] opacity-30"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Visual Mockup - Chat/Suggestion Interface */}
                    <div className="lg:w-1/2 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-lg opacity-70"></div>

                            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                                {/* Chat Header */}
                                <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Bot className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Vita Copiloto</h3>
                                        <p className="text-xs text-white/50">IA Clínica Ativa</p>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="space-y-4 font-mono text-sm mb-6">
                                    {/* User Input Mock */}
                                    <div className="flex justify-end">
                                        <div className="bg-white/10 text-white/90 px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%]">
                                            Prescrever Amoxicilina para infecção respiratória
                                        </div>
                                    </div>

                                    {/* AI Response Mock */}
                                    <div className="flex justify-start">
                                        <div className="bg-purple-500/10 border border-purple-500/20 text-purple-100 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%]">
                                            <p className="mb-2">Entendido. Sugestão de posologia baseada no perfil do paciente (70kg, histórico sem alergias):</p>

                                            <div className="bg-black/40 rounded p-2 mb-2 border-l-2 border-purple-400">
                                                <p className="font-bold">Amoxicilina 500mg</p>
                                                <p className="text-white/70 text-xs">Tomar 1 cápsula a cada 8 horas por 7 dias.</p>
                                            </div>

                                            <div className="flex gap-2 mt-2">
                                                <button className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition-colors">
                                                    Aceitar
                                                </button>
                                                <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-colors">
                                                    Ajustar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Alert Mock */}
                                    <motion.div
                                        className="flex justify-start"
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-100 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] flex items-start gap-3">
                                            <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs">
                                                    Notei que o paciente relatou desconforto gástrico recente. Gostaria de adicionar um protetor gástrico?
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
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
                            <span className="inline-block py-1 px-3 rounded-full bg-purple-500/10 text-purple-300 font-bold tracking-wide text-xs uppercase mb-4 border border-purple-500/20">
                                Inteligência Clínica
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white leading-tight mb-6">
                                Seu Copiloto na <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                                    hora da prescrição.
                                </span>
                            </h2>
                            <p className="text-lg text-white/60 mb-8 leading-relaxed">
                                A IA do VitaView não apenas digitaliza, ela auxilia. Receba sugestões de dosagem, calculadas para o paciente, e alertas proativos que evitam erros em tempo real.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                {[
                                    { title: "Sugestão de Dose", desc: "Cálculos automáticos baseados em peso e idade." },
                                    { title: "Protocolos Ágeis", desc: "Autocomplete para tratamentos complexos." },
                                    { title: "Memória Clínica", desc: "Aprende seus padrões de prescrição." },
                                    { title: "Segurança Total", desc: "Verificação cruzada de interações." }
                                ].map((feature, i) => (
                                    <div key={i} className="border-l border-white/10 pl-4 hover:border-purple-500 transition-colors duration-300">
                                        <h4 className="font-bold text-white text-lg">{feature.title}</h4>
                                        <p className="text-sm text-white/50">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <Link href="/auth">
                                <Button className="bg-white text-[#0A0A0A] hover:bg-gray-200 font-bold py-6 px-8 rounded-lg text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                                    Ver IA em Ação
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
