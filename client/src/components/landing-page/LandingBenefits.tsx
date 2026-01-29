import { motion } from "framer-motion";
import { Link } from "wouter";
import { Clock, Eye, UserCircle, TrendingUp, Lightbulb, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingBenefits() {
    const benefits = [
        {
            icon: <Clock className="w-6 h-6 text-[#212121]" />,
            title: "Visão Cronológica",
            description: "Visualize toda a jornada de saúde do paciente em uma linha do tempo intuitiva e unificada.",
            delay: 0
        },
        {
            icon: <Eye className="w-6 h-6 text-[#9E9E9E]" />,
            title: "Olhar Preventivo",
            description: "Identifique tendências sutis e riscos potenciais antes que se tornem problemas críticos.",
            delay: 0.1
        },
        {
            icon: <UserCircle className="w-6 h-6 text-[#212121]" />,
            title: "Foco no Paciente",
            description: "Reduza o tempo em telas e burocracia para dedicar mais atenção visual e humana ao seu paciente.",
            delay: 0.2
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-[#424242]" />,
            title: "Panorama Evolutivo",
            description: "Compreenda a evolução clínica com gráficos comparativos que revelam o progresso do tratamento.",
            delay: 0.3
        },
        {
            icon: <Lightbulb className="w-6 h-6 text-[#212121]" />,
            title: "Clareza Visual",
            description: "Transforme diagnósticos complexos em visualizações claras que facilitam o entendimento do paciente.",
            delay: 0.4
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-[#212121]" />,
            title: "Segurança Total",
            description: "Seus dados protegidos com os mais altos padrões de segurança, garantindo confidencialidade absoluta.",
            delay: 0.5
        },
    ];

    return (
        <section id="beneficios" className="pt-10 md:pt-12 pb-16 md:pb-24 bg-gradient-to-b from-[#F4F4F4] to-[#E0E0E0] text-[#212121] relative overflow-hidden scroll-mt-16 min-h-screen flex flex-col justify-center">
            {/* Elementos decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -right-10 -bottom-20 w-96 h-96 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute left-1/3 -top-48 w-64 h-64 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 md:mb-16"
                >
                    <motion.span
                        className="inline-block px-4 py-1.5 bg-[#E0E0E0] text-[#212121] border border-[#9E9E9E] shadow-sm rounded-full text-sm font-medium mb-4 md:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Visão Completa
                    </motion.span>

                    <h2 className="text-2xl md:text-4xl font-bold text-[#212121] mb-4 md:mb-6">
                        Uma Nova <span className="text-[#424242]">Visão</span> para a Saúde
                    </h2>
                    <p className="text-base md:text-lg text-[#212121] text-opacity-90 mb-8 md:mb-12 max-w-2xl mx-auto px-2">
                        O VitaView AI amplia sua capacidade de análise, transformando dados complexos em uma visão clara e acionável da vida do paciente.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            className={`relative bg-white p-5 md:p-7 rounded-xl shadow-lg overflow-hidden border border-[#E0E0E0] hover:border-[#E0E0E0]300 group ${index > 2 ? 'hidden md:block' : ''}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: benefit.delay }}
                            whileHover={{
                                y: -8,
                                boxShadow: "0 20px 30px rgba(0,0,0,0.07)",
                                transition: { duration: 0.3 }
                            }}
                        >
                            {/* Ícone estilizado */}
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-[#E0E0E0] flex items-center justify-center mb-5 group-hover:from-[#212121] group-hover:to-[#424242] group-hover:border-[#E0E0E0]200 transition-colors duration-300">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm">
                                    {benefit.icon}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-[#212121] mb-3 group-hover:text-[#212121] transition-colors duration-300">
                                {benefit.title}
                            </h3>

                            <p className="text-[#9E9E9E] mb-4 text-sm">
                                {benefit.description}
                            </p>

                            {/* Indicador de hover */}
                            <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#212121] to-[#424242] group-hover:w-full transition-all duration-300 ease-out"></div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA dentro da seção de benefícios */}
                <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                >
                    <Link href="/auth?tab=register">
                        <Button
                            className="bg-[#212121] hover:bg-[#424242] text-white border-2 border-[#212121] px-8 py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                            size="lg"
                        >
                            Otimize seu Atendimento
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
