import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function LandingPricing() {
    return (
        <section id="precos" className="relative flex flex-col justify-center overflow-hidden bg-[#F4F4F4] py-10 md:py-12 xl:py-14">
            {/* Elementos decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#E0E0E0] rounded-full opacity-30 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E0E0E0] rounded-full opacity-30 blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="mb-4 text-3xl font-heading font-bold leading-[1.05] tracking-tight text-[#212121] sm:text-4xl md:text-5xl lg:text-6xl">
                            Simples, Completo e <br />
                            <span className="text-[#9E9E9E] font-medium">Acessível.</span>
                        </h2>
                        <p className="mx-auto max-w-2xl font-body text-sm text-[#757575] md:text-base">
                            Nosso diferencial é entregar tudo o que você precisa sem cobrar mais por isso.
                            Enquanto outras plataformas cobram R$ 89 ou R$ 99 por recursos limitados,
                            nós oferecemos a experiência completa por um valor justo.
                        </p>
                    </motion.div>
                </div>

                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 md:grid-cols-3 md:gap-5">
                    {/* Plano Básico (Comparativo) */}
                    <motion.div
                        className="rounded-2xl border border-[#E0E0E0] bg-white/50 p-5 opacity-75 backdrop-blur-sm md:scale-95 md:p-6"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-3">
                            <h3 className="text-lg font-bold text-[#757575] md:text-xl">Outras Plataformas</h3>
                            <div className="mt-3 flex items-baseline">
                                <span className="text-2xl font-bold text-[#9E9E9E] md:text-3xl">R$ 89-99</span>
                                <span className="text-[#9E9E9E] ml-1">/mês</span>
                            </div>
                            <p className="mt-1.5 text-xs text-[#9E9E9E] md:text-sm">Média de mercado para planos iniciais</p>
                        </div>
                        <ul className="mb-2 space-y-2.5 border-t border-[#E0E0E0] pt-4 md:space-y-3">
                            {[
                                "IA cobrada como extra",
                                "Limite de pacientes",
                                "Agenda sem integração",
                                "Prescrição limitada",
                                "Prontuário engessado",
                                "Suporte apenas por e-mail"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-sm text-[#9E9E9E] md:text-[15px]">
                                    <HelpCircle className="mr-2.5 h-4 w-4 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Plano Vita - Destaque */}
                    <motion.div
                        className="relative z-20 rounded-2xl border-2 border-[#212121] bg-white p-5 shadow-xl md:scale-105 md:p-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-[#212121] px-3 py-1 text-[10px] font-bold text-white md:text-xs">
                            MELHOR ESCOLHA
                        </div>

                        <div className="mb-5">
                            <h3 className="text-xl font-bold text-[#212121] md:text-2xl">Vita Pro</h3>
                            <p className="mt-1.5 text-sm text-[#757575] md:mt-2 md:text-base">Para quem busca eficiência máxima.</p>

                            <div className="mt-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2.5 text-center">
                                <span className="text-xs font-bold uppercase tracking-wide text-green-700 md:text-sm">1º Mês Grátis</span>
                            </div>

                            <div className="mt-3 text-center">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9E9E9E] md:text-xs">a partir de</p>
                                <div className="flex items-end justify-center">
                                    <span className="mr-0.5 text-xl font-bold leading-none text-[#212121] md:text-2xl">R$</span>
                                    <span className="text-5xl font-black leading-none text-[#212121] md:text-6xl">63</span>
                                    <span className="ml-0.5 text-xl font-bold leading-none text-[#212121] md:text-2xl">,20</span>
                                    <span className="mb-1 ml-1 text-base font-medium text-[#757575] md:text-lg">/mês</span>
                                </div>
                                <p className="mt-1.5 text-[11px] text-[#9E9E9E] md:text-xs">no plano anual · <span className="line-through">R$ 79/mês</span> avulso</p>
                            </div>
                        </div>

                        <ul className="mb-5 space-y-2.5 md:space-y-3">
                            {[
                                "Anamnese com <strong>IA</strong> e Gravação de Voz",
                                "Prescrição <strong>Ilimitada</strong> com Alerta de Interações",
                                "Protocolos de Exames <strong>Personalizáveis</strong>",
                                "Análise de Exames com <strong>IA</strong>",
                                "Gráficos de <strong>Evolução</strong> de Exames",
                                "Upload de Exames <strong>Ilimitados</strong>",
                                "<strong>Vita Assist</strong> – Assistente Inteligente",
                                "Relatórios <strong>Completos</strong>"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-sm md:text-[15px]">
                                    <div className="mr-2.5 flex-shrink-0 rounded-full bg-[#212121] p-1">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-[#212121] font-medium" dangerouslySetInnerHTML={{ __html: feature }} />
                                </li>
                            ))}
                        </ul>

                        <Link href="/auth">
                            <Button className="h-11 w-full rounded-xl bg-[#212121] text-base font-bold text-white shadow-lg transition-all hover:bg-[#424242] hover:shadow-xl md:h-12 md:text-lg">
                                Começar Teste de 30 Dias
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-center text-[11px] text-[#9E9E9E] md:text-xs">
                            30 dias grátis. Cancele quando quiser.
                        </p>
                    </motion.div>

                    {/* Plano Enterprise */}
                    <motion.div
                        className="relative z-10 rounded-2xl border border-[#E0E0E0] bg-white p-5 md:p-6"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className="mb-3">
                            <h3 className="text-lg font-bold text-[#212121] md:text-xl">Enterprise</h3>
                            <div className="mt-3 flex items-baseline">
                                <span className="text-2xl font-bold text-[#212121] md:text-3xl">Sob Consulta</span>
                            </div>
                            <p className="mt-1.5 text-xs text-[#757575] md:text-sm">Para clínicas e hospitais</p>
                        </div>
                        <ul className="mb-5 space-y-2.5 border-t border-[#E0E0E0] pt-4 md:space-y-3">
                            {[
                                "Profissionais ilimitados",
                                "Integração HL7/FHIR",
                                "Análise de dados populacional",
                                "Gestor de conta dedicado",
                                "SLA de suporte 24/7"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-sm text-[#616161] md:text-[15px]">
                                    <CheckCircle2 className="mr-2.5 h-4 w-4 flex-shrink-0 text-[#9E9E9E]" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Button variant="outline" className="h-11 w-full border-2 border-[#E0E0E0] text-sm text-[#616161] hover:bg-[#F5F5F5] md:text-base">
                            Falar com Consultor
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
