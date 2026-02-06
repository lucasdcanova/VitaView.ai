import { motion } from "framer-motion";
import {
    Calendar,
    ChevronDown,
    FileText,
    Users,
    BarChart4,
    Sparkles,
    GraduationCap,
    LineChart,
    Bell,
    ScrollText,
    HeartPulse,
    RefreshCw,
    ChevronRight
} from "lucide-react";

export function LandingVitaTimeline() {
    return (
        <section id="demonstracoes" className="py-12 md:py-16 mt-[0] bg-transparent text-white relative overflow-hidden scroll-mt-16 min-h-screen flex flex-col justify-center">
            {/* Elementos decorativos minimalistas */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 right-10 w-56 h-56 bg-[#424242] rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#424242] rounded-full opacity-20 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 md:mb-16"
                >
                    <motion.span
                        className="inline-block px-4 py-1.5 bg-[#E0E0E0] text-[#212121] rounded-full text-sm font-heading font-bold mb-4 md:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Vita Timeline
                    </motion.span>

                    <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-4 md:mb-6">
                        Linha de <span className="text-[#9E9E9E]">Vida</span> do Paciente
                    </h2>
                    <p className="text-base md:text-lg text-[#E0E0E0] font-body max-w-3xl mx-auto px-2">
                        Tenha uma visão holística da jornada de saúde do seu paciente. Acesse exames, métricas vitais e histórico clínico em um dashboard centralizado e seguro.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
                    {/* Relatório de Exame Simulado */}
                    <div className="relative w-full max-w-[600px]">
                        {/* Dashboard mockup simulado - design mais próximo do real */}
                        <motion.div
                            className="rounded-xl shadow-2xl relative z-10 bg-white overflow-hidden w-full max-w-[600px] h-auto aspect-[16/10]"
                            whileHover={{
                                rotate: 2,
                                transition: { duration: 0.3 }
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {/* Header do dashboard - design minimalista */}
                            <div className="bg-[#212121] h-12 flex items-center px-4 text-white">
                                <Calendar className="h-5 w-5 mr-2" />
                                <span className="font-heading font-bold">Linha do Tempo - Maria Silva</span>
                                <div className="ml-auto flex space-x-2">
                                    <div className="flex items-center bg-[#424242] rounded px-2 py-1 text-xs cursor-pointer hover:bg-[#525252] transition-colors">
                                        <span className="mr-1 opacity-70">Período:</span>
                                        <span className="font-medium">Últimos 6 meses</span>
                                        <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo do dashboard - Timeline */}
                            <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-white p-6">
                                <div className="max-w-3xl mx-auto">
                                    {/* Timeline Items */}
                                    <div className="relative">
                                        {/* Vertical Line */}
                                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#212121] via-[#9E9E9E] to-[#424242]"></div>

                                        {/* Timeline Event 1 - Recent Lab Result */}
                                        <div className="relative flex gap-4 mb-8 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                                                    <FileText className="w-7 h-7 text-white" />
                                                </div>
                                                <span className="text-xs text-[#9E9E9E] mt-2 font-medium">15 Abr</span>
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-[#212121]">Hemograma Completo</h4>
                                                        <p className="text-xs text-[#9E9E9E] mt-1">Laboratório Central</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                                                        Normal
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#9E9E9E] mb-2">Todos os parâmetros dentro da normalidade</p>
                                                <div className="flex gap-2 text-xs text-[#9E9E9E]">
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#212121]"></div>
                                                        Hemoglobina: 14.2 g/dL
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#212121]"></div>
                                                        Leucócitos: 7.200/mm³
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Event 2 - Medication */}
                                        <div className="relative flex gap-4 mb-8 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                                                    <span className="text-2xl">💊</span>
                                                </div>
                                                <span className="text-xs text-[#9E9E9E] mt-2 font-medium">10 Abr</span>
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-[#212121]">Prescrição Atualizada</h4>
                                                        <p className="text-xs text-[#9E9E9E] mt-1">Dr. João Santos - Cardiologia</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                                                        Ativo
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#9E9E9E] mb-2">Ajuste na dosagem de medicação para hipertensão</p>
                                                <div className="space-y-1 text-xs text-[#9E9E9E]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Losartana 50mg</span>
                                                        <span className="text-[#9E9E9E]">•</span>
                                                        <span>1x ao dia (manhã)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Event 3 - Appointment */}
                                        <div className="relative flex gap-4 mb-8 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                                                    <span className="text-2xl">🏥</span>
                                                </div>
                                                <span className="text-xs text-[#9E9E9E] mt-2 font-medium">05 Abr</span>
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-[#212121]">Consulta de Retorno</h4>
                                                        <p className="text-xs text-[#9E9E9E] mt-1">Dr. João Santos - Cardiologia</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                                                        Concluída
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#9E9E9E]">Avaliação de controle pressórico e ajuste terapêutico</p>
                                            </div>
                                        </div>

                                        {/* Timeline Event 4 - Lab Result with Alert */}
                                        <div className="relative flex gap-4 mb-8 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9E9E9E] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                                                    <FileText className="w-7 h-7 text-white" />
                                                </div>
                                                <span className="text-xs text-[#9E9E9E] mt-2 font-medium">28 Mar</span>
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-[#212121]">Glicemia em Jejum</h4>
                                                        <p className="text-xs text-[#9E9E9E] mt-1">Laboratório Central</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                                                        Atenção
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#9E9E9E] mb-2">Valor ligeiramente elevado - acompanhamento necessário</p>
                                                <div className="flex gap-2 text-xs text-[#9E9E9E]">
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#9E9E9E]"></div>
                                                        Glicemia: 108 mg/dL
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Event 5 - Diagnosis */}
                                        <div className="relative flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                                                    <span className="text-2xl">📋</span>
                                                </div>
                                                <span className="text-xs text-[#9E9E9E] mt-2 font-medium">15 Mar</span>
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-[#212121]">Diagnóstico Registrado</h4>
                                                        <p className="text-xs text-[#9E9E9E] mt-1">Dr. João Santos - Cardiologia</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                                                        Ativo
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#9E9E9E]">Hipertensão Arterial Sistêmica (CID I10)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View More Link */}
                                    <div className="mt-8 text-center">
                                        <span className="text-sm font-medium text-[#212121] hover:text-[#212121] cursor-pointer flex items-center justify-center gap-1 transition-colors">
                                            Ver histórico completo
                                            <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Elementos decorativos flutuantes */}
                        <motion.div
                            className="absolute -top-5 -left-5 p-4 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                            animate={{
                                y: [0, 10, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        >
                            <div className="flex items-center space-x-2 text-[#212121]">
                                <Users className="w-5 h-5 text-[#212121] flex-shrink-0" />
                                <span className="text-sm font-medium text-[#212121]">Total de Pacientes: <span className="text-[#212121]">127</span></span>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute -bottom-4 -right-4 p-3 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                duration: 3.5,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: 0.5
                            }}
                        >
                            <div className="flex items-center space-x-2 text-[#212121]">
                                <BarChart4 className="w-5 h-5 text-[#212121] flex-shrink-0" />
                                <span className="text-sm font-medium text-[#212121]">Exames Pendentes: <span className="text-[#9E9E9E]">8</span></span>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute top-1/2 -right-10 p-3 bg-white rounded-full shadow-lg z-20 hidden md:flex items-center justify-center"
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        >
                            <Sparkles className="w-6 h-6 text-[#9E9E9E]" />
                        </motion.div>
                    </div>

                    <div className="space-y-4 md:space-y-6 mt-8 lg:mt-0">
                        <motion.div
                            className="text-left"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Analise exames com eficiência e precisão</h3>
                            <p className="text-base md:text-lg text-white text-opacity-90 mb-4 md:mb-6">
                                Nossos relatórios transformam dados brutos em insights clínicos, ajudando você a monitorar:
                            </p>

                            <ul className="space-y-3 md:space-y-4 hidden md:block">
                                {[
                                    {
                                        icon: <GraduationCap className="h-5 w-5 text-[#212121]" />,
                                        title: "Contexto Clínico Imediato",
                                        description: "Visualize métricas com referências automáticas e histórico do paciente."
                                    },
                                    {
                                        icon: <LineChart className="h-5 w-5 text-[#212121]" />,
                                        title: "Evolução do Paciente",
                                        description: "Acompanhe a evolução dos resultados ao longo do tempo e identifique padrões clínicos."
                                    },
                                    {
                                        icon: <Bell className="h-5 w-5 text-[#212121]" />,
                                        title: "Alertas de Risco",
                                        description: "Receba notificações automáticas sobre parâmetros críticos que necessitam de atenção."
                                    },
                                    {
                                        icon: <ScrollText className="h-5 w-5 text-[#212121]" />,
                                        title: "Registro de Anamneses",
                                        description: "Documente consultas e evoluções clínicas de forma estruturada e pesquisável."
                                    },
                                    {
                                        icon: <HeartPulse className="h-5 w-5 text-[#212121]" />,
                                        title: "Medicamentos de Uso Contínuo",
                                        description: "Gerencie prescrições ativas, acompanhe adesão e receba alertas de interações."
                                    },
                                    {
                                        icon: <RefreshCw className="h-5 w-5 text-[#212121]" />,
                                        title: "Renovação Automática de Receitas",
                                        description: "Gere receitas de medicamentos contínuos automaticamente com um clique."
                                    }
                                ].map((item, index) => (
                                    <motion.li
                                        key={index}
                                        className="flex items-start"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: 0.1 * index }}
                                    >
                                        <div className="p-2 bg-[#E0E0E0] rounded-full mr-3 mt-0.5">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{item.title}</h4>
                                            <p className="text-white text-opacity-85">{item.description}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div >
            </div >
        </section >
    );
}
