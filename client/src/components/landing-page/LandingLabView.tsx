import { motion } from "framer-motion";
import { Link } from "wouter";
import { LineChart, ArrowRight } from "lucide-react";

export function LandingLabView() {
    return (
        <section id="como-funciona" className="py-12 md:py-24 bg-gradient-to-b from-[#E0E0E0] to-[#F4F4F4] relative overflow-hidden">
            {/* Elementos decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute left-0 top-20 w-72 h-72 bg-[#F4F4F4] rounded-full opacity-40 blur-3xl"></div>
                <div className="absolute right-0 bottom-20 w-80 h-80 bg-[#F4F4F4] rounded-full opacity-40 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8 md:mb-16"
                >
                    <motion.span
                        className="inline-block px-4 py-1.5 bg-[#F4F4F4] text-[#212121] rounded-full text-sm font-medium mb-4 md:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Análise Inteligente
                    </motion.span>

                    <h2 className="text-2xl md:text-4xl font-bold text-[#212121] mb-4 md:mb-6">
                        <span className="text-[#212121]">View Laboratorial</span>
                    </h2>
                    <p className="text-base md:text-lg text-[#9E9E9E] mb-6 md:mb-8 max-w-2xl mx-auto px-2">
                        Compare valores ao longo do tempo, identifique tendências e visualize resultados em relação aos valores de referência.
                    </p>
                </motion.div>

                {/* Lab Results Analyzer Interface */}
                <motion.div
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {/* Analyzer Header */}
                    <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <LineChart className="w-8 h-8" />
                                <div>
                                    <h3 className="text-2xl font-bold">Análise Comparativa</h3>
                                    <p className="text-sm text-[#E0E0E0]">Paciente: Maria Silva - Últimos 6 meses</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-[#212121] hover:bg-[#9E9E9E] rounded-lg text-sm font-medium transition-colors">
                                    Exportar PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lab Results Grid */}
                    <div className="p-4 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Hemoglobina Chart */}
                            <motion.div
                                className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0]"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-[#212121]">Hemoglobina</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: 12.0 - 16.0 g/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                                        Normal
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <div className="flex-1 bg-red-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "75%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            >
                                                <span className="text-xs font-semibold text-white">13.2</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <div className="flex-1 bg-red-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "80%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.3 }}
                                            >
                                                <span className="text-xs font-semibold text-white">14.2</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-green-600">
                                        <span className="text-lg">↗</span>
                                        <span className="font-semibold">+7.6%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>

                            {/* Glicemia Chart */}
                            <motion.div
                                className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0]"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-[#212121]">Glicemia em Jejum</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: 70 - 100 mg/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                                        Atenção
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <div className="flex-1 bg-amber-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "85%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            >
                                                <span className="text-xs font-semibold text-white">102</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <div className="flex-1 bg-amber-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "90%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.3 }}
                                            >
                                                <span className="text-xs font-semibold text-white">108</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-amber-600">
                                        <span className="text-lg">↗</span>
                                        <span className="font-semibold">+5.9%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>

                            {/* Colesterol Total Chart */}
                            <motion.div
                                className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0] hidden md:block"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-[#212121]">Colesterol Total</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: {'<'} 200 mg/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                                        Normal
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "78%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            >
                                                <span className="text-xs font-semibold text-white">195</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "72%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.3 }}
                                            >
                                                <span className="text-xs font-semibold text-white">180</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-green-600">
                                        <span className="text-lg">↘</span>
                                        <span className="font-semibold">-7.7%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>

                            {/* Creatinina Chart */}
                            <motion.div
                                className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0] hidden md:block"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-[#212121]">Creatinina</h4>
                                        <p className="text-sm text-[#9E9E9E]">Referência: 0.6 - 1.2 mg/dL</p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                                        Normal
                                    </span>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                                        <div className="flex-1 bg-emerald-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "65%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            >
                                                <span className="text-xs font-semibold text-white">0.9</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                                        <div className="flex-1 bg-emerald-100 rounded-full h-6 relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full flex items-center justify-end pr-2"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "67%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.3 }}
                                            >
                                                <span className="text-xs font-semibold text-white">0.92</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <span className="text-lg">→</span>
                                        <span className="font-semibold">+2.2%</span>
                                    </div>
                                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Summary Section */}
                        <motion.div
                            className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-[#E0E0E0]"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[#E0E0E0] rounded-lg">
                                    <LineChart className="w-6 h-6 text-[#9E9E9E]" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-[#212121] mb-2">Resumo da Análise</h4>
                                    <p className="text-[#212121] text-sm mb-3">
                                        Visualização comparativa dos últimos 2 meses. Os dados apresentados são apenas informativos e não substituem a avaliação clínica profissional.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#212121] border border-[#E0E0E0]">
                                            3 valores normais
                                        </span>
                                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#212121] border border-[#E0E0E0]">
                                            1 requer atenção
                                        </span>
                                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#212121] border border-[#E0E0E0]">
                                            Período: Mar-Abr 2025
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* CTA após análise */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                >
                    <Link href="/auth?tab=register">
                        <button
                            className="bg-[#212121] hover:bg-[#212121] text-white font-bold py-4 px-8 rounded-lg shadow-lg text-lg"
                        >
                            Comece agora gratuitamente
                            <ArrowRight className="ml-2 h-5 w-5 inline" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
