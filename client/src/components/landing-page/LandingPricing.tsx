import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function LandingPricing() {
    return (
        <section id="precos" className="py-20 md:py-28 bg-[#F4F4F4] relative overflow-hidden">
            {/* Elementos decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#E0E0E0] rounded-full opacity-30 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E0E0E0] rounded-full opacity-30 blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] mb-6">
                            Simples, Completo e <span className="text-[#212121] underline decoration-4 decoration-[#E0E0E0]">Acessível</span>.
                        </h2>
                        <p className="text-lg text-[#757575] font-body">
                            Nosso diferencial é entregar tudo o que você precisa sem cobrar mais por isso.
                            Enquanto outras plataformas cobram R$ 89 ou R$ 99 por recursos limitados,
                            nós oferecemos a experiência completa por um valor justo.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {/* Plano Básico (Comparativo) */}
                    <motion.div
                        className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E0E0E0] opacity-75 scale-95"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-[#757575]">Outras Plataformas</h3>
                            <div className="flex items-baseline mt-4">
                                <span className="text-3xl font-bold text-[#9E9E9E]">R$ 89-99</span>
                                <span className="text-[#9E9E9E] ml-1">/mês</span>
                            </div>
                            <p className="text-sm text-[#9E9E9E] mt-2">Média de mercado para planos iniciais</p>
                        </div>
                        <ul className="space-y-4 mb-8 border-t border-[#E0E0E0] pt-6">
                            <li className="flex items-center text-[#9E9E9E]">
                                <HelpCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                <span>Interface complexa</span>
                            </li>
                            <li className="flex items-center text-[#9E9E9E]">
                                <HelpCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                <span>IA vendida à parte</span>
                            </li>
                            <li className="flex items-center text-[#9E9E9E]">
                                <HelpCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                <span>Limite de pacientes</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Plano Vita - Destaque */}
                    <motion.div
                        className="bg-white rounded-2xl p-8 md:p-10 border-2 border-[#212121] shadow-xl relative z-20 scale-105"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="absolute top-0 right-0 bg-[#212121] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            MELHOR ESCOLHA
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-[#212121]">Plano Vita</h3>
                            <p className="text-[#757575] mt-2">Para quem busca eficiência máxima.</p>

                            <div className="flex items-baseline mt-6">
                                <span className="text-5xl font-extrabold text-[#212121]">R$ 69</span>
                                <span className="text-[#757575] font-medium ml-2">/mês</span>
                            </div>
                            <p className="text-sm text-green-600 font-medium mt-2 bg-green-50 inline-block px-2 py-1 rounded">
                                Economia de ~30% vs concorrentes
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {[
                                "Acesso completo à plataforma",
                                "IA Ilimitada para transcrições",
                                "Armazenamento seguro",
                                "Agenda Inteligente",
                                "Prescrição Digital",
                                "Suporte Prioritário"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center">
                                    <div className="bg-[#212121] rounded-full p-1 mr-3 flex-shrink-0">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-[#212121] font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Link href="/auth">
                            <Button className="w-full bg-[#212121] hover:bg-[#424242] text-white h-12 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                                Começar Teste Grátis
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="text-xs text-center text-[#9E9E9E] mt-4">
                            7 dias grátis. Cancele quando quiser.
                        </p>
                    </motion.div>

                    {/* Plano Enterprise */}
                    <motion.div
                        className="bg-white rounded-2xl p-8 border border-[#E0E0E0] relative z-10"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-[#212121]">Enterprise</h3>
                            <div className="flex items-baseline mt-4">
                                <span className="text-3xl font-bold text-[#212121]">Sob Consulta</span>
                            </div>
                            <p className="text-sm text-[#757575] mt-2">Para clínicas e hospitais</p>
                        </div>
                        <ul className="space-y-4 mb-8 border-t border-[#E0E0E0] pt-6">
                            {[
                                "Múltiplos profissionais",
                                "Gestão de permissões",
                                "API dedicada",
                                "Onboarding personalizado",
                                "SLA de suporte 24/7"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-[#616161]">
                                    <CheckCircle2 className="h-5 w-5 text-[#9E9E9E] mr-3 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Button variant="outline" className="w-full border-2 border-[#E0E0E0] text-[#616161] hover:bg-[#F5F5F5]">
                            Falar com Consultor
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
