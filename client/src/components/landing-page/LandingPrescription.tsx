import { motion } from "framer-motion";
import { FileText, Zap, Shield, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { tokens } from "./landing-tokens";

export function LandingPrescription() {
    return (
        <section id="prescricao-digital" aria-labelledby="prescricao-digital-heading" className={`${tokens.section.light} ${tokens.section.paddingFull} relative overflow-hidden`}>
            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Text Content */}
                    <div className="lg:w-1/2 order-1 lg:order-1 w-full max-w-md lg:max-w-none">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className={tokens.eyebrow.lineLight} />
                                <span className={tokens.eyebrow.light}>Revisão de prescrição em fluxo</span>
                            </div>
                            <h2 id="prescricao-digital-heading" className={`${tokens.h2.light} mb-6`}>
                                Renovação de receitas <br />
                                <span className={tokens.h2.splitLight}>em segundos.</span>
                            </h2>
                            <p className={`${tokens.body.light} max-w-xl mb-10`}>
                                Renove tratamentos contínuos com velocidade e segurança.
                                O VitaView cruza medicamentos, histórico e alergias antes de gerar a prescrição, destacando interações relevantes no momento da revisão.
                            </p>

                            <div className="grid grid-cols-1 gap-3 mb-8 md:hidden">
                                <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9E9E9E]">Interações relevantes</p>
                                    <p className="mt-2 text-sm text-[#616161] leading-relaxed">Cruza histórico, alergias e medicações antes de emitir a receita.</p>
                                </div>
                                <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9E9E9E]">Renovação em fluxo</p>
                                    <p className="mt-2 text-sm text-[#616161] leading-relaxed">Repete tratamentos contínuos com menos cliques e mais clareza na revisão.</p>
                                </div>
                            </div>

                            <div className="hidden md:block space-y-4 mb-8">
                                {[
                                    {
                                        icon: <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />,
                                        title: "Revisão de Interações",
                                        desc: "Cruza medicamentos, alergias e histórico do paciente antes de imprimir.",
                                        featured: true
                                    },
                                    { icon: <Zap className="w-5 h-5" />, title: "Renovação em 1 clique", desc: "Repita receitas anteriores instantaneamente." },
                                    { icon: <Sparkles className="w-5 h-5" />, title: "Dose sugerida", desc: "Posologia sugerida com base no contexto da prescrição." },
                                    { icon: <Shield className="w-5 h-5" />, title: "Segurança Clínica", desc: "Alertas de alergias e interações medicamentosas." },
                                    { icon: <RefreshCw className="w-5 h-5" />, title: "Base Atualizada", desc: "Milhares de medicamentos com posologia sugerida." }
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${item.featured
                                            ? "bg-[#212121] border-[#212121] shadow-lg shadow-black/10"
                                            : "bg-white border-[#E0E0E0] shadow-sm hover:border-[#212121]"
                                            }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + (index * 0.1) }}
                                    >
                                        <div className={`p-2 rounded-lg ${item.featured ? "bg-white/10 text-white" : "bg-[#F5F5F5] text-[#212121]"}`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${item.featured ? "text-white" : "text-[#212121]"}`}>{item.title}</h3>
                                            <p className={`text-xs leading-relaxed ${item.featured ? "text-white/70" : "text-[#757575]"}`}>{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <Link href="/auth">
                                <Button className="bg-[#212121] hover:bg-[#424242] text-white font-bold w-full sm:w-auto py-6 px-8 rounded-lg text-lg shadow-lg transition-all">
                                    Experimentar Prescrição Digital
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Visual Mockup */}
                    <div className="lg:w-1/2 order-2 lg:order-2">
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {/* Abstract decorative elements */}
                            <div className="hidden md:block absolute -top-10 -right-10 w-64 h-64 bg-[#E0E0E0] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                            <div className="hidden md:block absolute -bottom-10 -left-10 w-64 h-64 bg-[#F5F5F5] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                            {/* Prescription Card Mockup */}
                            <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-[#E0E0E0] p-6 md:p-8">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-6 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#212121] rounded-lg flex items-center justify-center">
                                            <FileText className="text-white w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#212121]">Prescrição Médica</h3>
                                            <p className="text-xs text-[#9E9E9E]">Pronta para imprimir</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded border border-slate-200 uppercase tracking-wide">
                                        Revisada
                                    </div>
                                </div>

                                {/* Medication List */}
                                <div className="space-y-4 mb-6">
                                    {[
                                        { name: "Sertralina 50mg", dosage: "Tomar 1 comprimido pela manhã", qtd: "30 caps" },
                                        { name: "Zolpidem 10mg", dosage: "Tomar 1 comprimido ao deitar se necessário", qtd: "10 caps" },
                                    ].map((med, i) => (
                                        <div key={i} className="flex justify-between items-start pb-4 border-b border-[#F5F5F5] last:border-0 last:pb-0">
                                            <div>
                                                <h4 className="font-bold text-[#212121]">{med.name}</h4>
                                                <p className="text-sm text-[#757575] mt-1">{med.dosage}</p>
                                            </div>
                                            <span className="text-xs font-medium bg-[#F5F5F5] text-[#616161] px-2 py-1 rounded">
                                                {med.qtd}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons Mock */}
                                <div className="flex gap-3 pt-2">
                                    <button className="flex-1 bg-[#212121] text-white py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:bg-[#424242] transition-colors">
                                        <RefreshCw className="w-4 h-4" />
                                        Renovar Receita
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <button className="w-full bg-[#161616] border border-[#212121] text-white py-3 rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-black transition-colors">
                                        <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        Revisar interações
                                    </button>
                                </div>

                                <motion.div
                                    className="mt-4 rounded-2xl bg-[#161616] text-white p-4 md:p-5 shadow-2xl border border-[#2B2B2B] overflow-hidden relative"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                >
                                    <div className="absolute -top-8 right-4 h-24 w-24 rounded-full bg-yellow-400/10 blur-3xl"></div>
                                    <div className="relative flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white/8 border border-white/10 p-2.5 rounded-xl shrink-0">
                                                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 mb-1">Interações relevantes</p>
                                                <p className="text-sm font-semibold leading-tight">Varredura clínica automática antes da impressão</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
                                            Essencial
                                        </div>
                                    </div>

                                    <div className="relative grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                                                <div>
                                                    <p className="text-xs font-semibold text-white">Sertralina 50mg + Zolpidem 10mg</p>
                                                    <p className="text-[11px] text-white/50 mt-1">Risco moderado de sedação e piora de atenção no dia seguinte.</p>
                                                </div>
                                                <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                                                    Moderado
                                                </span>
                                            </div>

                                            <div className="pt-3 space-y-2">
                                                <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white/70">
                                                    <span>Histórico cruzado automaticamente</span>
                                                    <span className="font-semibold text-white">Alergias + uso contínuo</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white/70">
                                                    <span>Orientação sugerida</span>
                                                    <span className="font-semibold text-yellow-300">Orientar uso noturno</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden md:block space-y-3">
                                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-2">Paciente</p>
                                                <div className="space-y-2 text-[11px] text-white/70">
                                                    <div className="flex items-center justify-between">
                                                        <span>Alergia registrada</span>
                                                        <span className="font-semibold text-white">AINEs</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Medicamentos ativos</span>
                                                        <span className="font-semibold text-white">2 em uso</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Status</span>
                                                        <span className="font-semibold text-emerald-300">Pronto para revisar</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-200/80 mb-2">Resumo clínico</p>
                                                <p className="text-[11px] leading-relaxed text-yellow-50/90">
                                                    A plataforma sinaliza interações relevantes antes de emitir a receita, com contexto clínico e recomendação objetiva para a revisão final.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
