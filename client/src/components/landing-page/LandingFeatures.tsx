import { motion } from "framer-motion";
import { FileText, Stethoscope, Brain, Upload, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingFeatures() {
    const features = [
        {
            id: "anamnese",
            title: "Anamnese Objetiva",
            description: "Esqueça formulários infinitos. Registre o essencial em uma interface limpa e focada.",
            icon: <Stethoscope className="w-6 h-6 text-white" />,
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
            icon: <Brain className="w-6 h-6 text-white" />,
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
        <section id="recursos" className="py-16 md:py-20 bg-[#0A0A0A] relative">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2 block">
                        Por que VitaView?
                    </span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4 leading-tight">
                        Quatro pilares. <span className="text-white/60">Tudo o que precisa.</span>
                    </h2>
                    <p className="text-base text-white/80 leading-relaxed max-w-2xl mx-auto">
                        Removemos o excesso para focar na essência. Ferramentas desenhadas para economizar seu tempo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className={`group relative rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 cursor-default flex flex-col bg-white/5 backdrop-blur-sm`}
                        >
                            <div className={`p-6 flex-1 flex flex-col`}>
                                <div className={`w-12 h-12 rounded-xl bg-white text-[#212121] flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                    <div className="text-black">
                                        {feature.icon.props.className.includes("text-white") ? <feature.icon.type {...feature.icon.props} className="w-6 h-6 text-[#212121]" /> : feature.icon}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">{feature.title}</h3>

                                <p className="text-white/70 mb-6 leading-snug text-sm">
                                    {feature.description}
                                </p>

                                <ul className="mt-auto space-y-2">
                                    {feature.items.map((item, i) => (
                                        <li key={i} className="flex items-center text-white/80 text-xs font-medium">
                                            <div className="mr-2 p-0.5 rounded-full bg-white/10 text-white">
                                                <Check className="w-2.5 h-2.5" />
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
