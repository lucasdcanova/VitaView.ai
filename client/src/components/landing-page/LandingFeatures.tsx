import { motion } from "framer-motion";
import { FileText, Stethoscope, Brain, Upload, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingFeatures() {
    const features = [
        {
            id: "anamnese",
            title: "Anamnese Objetiva",
            description: "Esqueça formulários infinitos. Registre o essencial em uma interface limpa e focada.",
            icon: <Stethoscope className="w-6 h-6 text-[#212121]" />,
            color: "bg-[#212121]", // Black
            lightColor: "bg-[#F5F5F5]",
            items: ["Histórico unificado", "Modelos ágeis", "Navegação rápida"]
        },
        {
            id: "prescricao",
            title: "Prescrição Ágil",
            description: "Prescreva em segundos com verificação automática de interações e banco atualizado.",
            icon: <FileText className="w-6 h-6 text-[#212121]" />,
            color: "bg-[#E0E0E0]", // Light Grey
            lightColor: "bg-white",
            items: ["Base BR atualizada", "Alertas de segurança", "Assinatura digital"]
        },
        {
            id: "vita-assist",
            title: "Vita Assist AI",
            description: "Seu copiloto clínico. Resumos, dúvidas de protocolos e rascunhos no chat.",
            icon: <Brain className="w-6 h-6 text-[#212121]" />,
            color: "bg-[#424242]", // Dark Grey
            lightColor: "bg-[#FAFAFA]",
            items: ["Resumo de caso", "Segunda opinião", "Busca inteligente"]
        },
        {
            id: "exames",
            title: "Central de Exames",
            description: "Extração automática de dados de PDFs e imagens para gráficos de evolução.",
            icon: <Upload className="w-6 h-6 text-[#212121]" />,
            color: "bg-[#F5F5F5]", // Very Light Grey
            lightColor: "bg-white",
            items: ["OCR preciso", "Gráficos evolutivos", "Upload fácil"]
        }
    ];

    return (
        <section id="recursos" className="py-16 md:py-24 bg-[#0A0A0A] relative min-h-[100dvh] flex flex-col justify-center">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-4 block">
                        Diferencial Estratégico
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-[1.1] tracking-tight">
                        Quatro pilares. <br />
                        <span className="text-white/40 font-medium">Tudo o que você precisa.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
                        Removemos o excesso para focar na essência. Ferramentas desenhadas sob medida para economizar o recurso mais precioso do médico: o tempo.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 cursor-default flex flex-col bg-white/[0.03] backdrop-blur-md`}
                        >
                            <div className={`p-8 flex-1 flex flex-col`}>
                                <div className={`w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500`}>
                                    {feature.icon}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3 group-hover:translate-x-1 transition-transform">{feature.title}</h3>

                                <p className="text-white/50 mb-8 leading-relaxed text-sm lg:text-[15px]">
                                    {feature.description}
                                </p>

                                <ul className="mt-auto space-y-3">
                                    {feature.items.map((item, i) => (
                                        <li key={i} className="flex items-center text-white/70 text-xs sm:text-sm font-medium">
                                            <div className="mr-3 p-1 rounded-full bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Button variant="outline" size="lg" className="border border-white/30 text-white hover:bg-white hover:text-black px-6 py-5 text-base rounded-lg transition-all">
                        Explorar todas as funcionalidades <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
