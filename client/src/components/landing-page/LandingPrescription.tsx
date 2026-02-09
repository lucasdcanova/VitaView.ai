import { motion } from "framer-motion";
import { FileText, Check, Zap, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function LandingPrescription() {
    return (
        <section className="py-20 md:py-28 bg-[#FAFAFA] relative overflow-hidden">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Text Content */}
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-white text-[#212121] font-bold tracking-wide text-xs uppercase mb-4 border border-[#E0E0E0] shadow-sm">
                                Prescrição Facilitada
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-6">
                                Renovação de receitas <br />
                                <span className="text-[#757575]">em segundos.</span>
                            </h2>
                            <p className="text-lg text-[#616161] mb-8 leading-relaxed">
                                Acesse um banco de medicamentos completo e atualizado.
                                Envie prescrições digitais com assinatura certificada e verificação automática de interações.
                            </p>

                            <div className="space-y-4 mb-8">
                                {[
                                    { icon: <Zap className="w-5 h-5" />, title: "Renovação em 1 clique", desc: "Repita receitas anteriores instantaneamente." },
                                    { icon: <Shield className="w-5 h-5" />, title: "Segurança Clínica", desc: "Alertas de alergias e interações medicamentosas." },
                                    { icon: <RefreshCw className="w-5 h-5" />, title: "Base Atualizada", desc: "Milhares de medicamentos com posologia sugerida." }
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm hover:border-[#212121] transition-colors"
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + (index * 0.1) }}
                                    >
                                        <div className="p-2 bg-[#F5F5F5] rounded-lg text-[#212121]">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#212121] text-sm">{item.title}</h4>
                                            <p className="text-[#757575] text-xs leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <Link href="/auth">
                                <Button className="bg-[#212121] hover:bg-[#424242] text-white font-bold py-6 px-8 rounded-lg text-lg shadow-lg transition-all">
                                    Experimentar Prescrição Digital
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Visual Mockup */}
                    <div className="lg:w-1/2 order-1 lg:order-2">
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {/* Abstract decorative elements */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#E0E0E0] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#F5F5F5] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                            {/* Prescription Card Mockup */}
                            <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-[#E0E0E0] p-6 md:p-8">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-6 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#212121] rounded-lg flex items-center justify-center">
                                            <FileText className="text-white w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#212121]">Receita Digital</h3>
                                            <p className="text-xs text-[#9E9E9E]">Assinada digitalmente</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-100 uppercase tracking-wide">
                                        Válida
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
                                    <button className="px-4 border border-[#E0E0E0] rounded-lg hover:bg-[#F5F5F5] transition-colors">
                                        <span className="sr-only">Opções</span>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 bg-[#212121] rounded-full"></div>
                                            <div className="w-1 h-1 bg-[#212121] rounded-full"></div>
                                            <div className="w-1 h-1 bg-[#212121] rounded-full"></div>
                                        </div>
                                    </button>
                                </div>

                                {/* Interactive Notification */}
                                <motion.div
                                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-[#212121] text-white p-4 rounded-xl shadow-xl max-w-[200px]"
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white/20 p-1.5 rounded-full">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium leading-tight mb-1">Interação verificada</p>
                                            <p className="text-[10px] text-white/70">Seguro para prescrição</p>
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
