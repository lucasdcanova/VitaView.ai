import { motion } from "framer-motion";
import { FileText, Stethoscope, Brain, Upload, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingFeatures() {
    const features = [
        {
            id: "anamnese",
            title: "Anamnese Objetiva",
            description: "Esqueça os formulários infinitos. Registre o que importa em uma interface limpa, focada na queixa principal e histórico, sem cliques desnecessários.",
            icon: <Stethoscope className="w-8 h-8 text-white" />,
            color: "bg-[#212121]", // Black
            lightColor: "bg-[#F5F5F5]",
            items: ["Histórico unificado", "Modelos personalizáveis", "Navegação por teclado"]
        },
        {
            id: "prescricao",
            title: "Prescrição Inteligente",
            description: "Prescreva em segundos com um banco de medicamentos sempre atualizado e verificação automática de interações medicamentosas e alergias.",
            icon: <FileText className="w-8 h-8 text-[#212121]" />,
            color: "bg-[#E0E0E0]", // Light Grey
            lightColor: "bg-white",
            items: ["Base de medicamentos BR", "Alertas de interação", "Assinatura digital (CFM)"]
        },
        {
            id: "vita-assist",
            title: "Vita Assist AI",
            description: "Seu copiloto clínico. Peça resumos de casos, esclareça dúvidas sobre protocolos ou solicite rascunhos de atestados diretamente no chat.",
            icon: <Brain className="w-8 h-8 text-white" />,
            color: "bg-[#424242]", // Dark Grey
            lightColor: "bg-[#FAFAFA]",
            items: ["Resumo de prontuário", "Segunda opinião (IA)", "Busca rápida"]
        },
        {
            id: "exames",
            title: "Central de Exames",
            description: "Analisa, classifica e extrai dados de PDFs e imagens automaticamente. Transforme uma pilha de exames em gráficos de tendência de saúde.",
            icon: <Upload className="w-8 h-8 text-[#212121]" />,
            color: "bg-[#F5F5F5]", // Very Light Grey
            lightColor: "bg-white",
            items: ["OCR de alta precisão", "Gráficos de evolução", "Upload 'arrasta e solta'"]
        }
    ];

    return (
        <section id="recursos" className="py-20 md:py-32 bg-transparent relative">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="text-sm font-bold tracking-widest text-white/60 uppercase mb-3 block">
                        Por que VitaView?
                    </span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                        Quatro pilares. <br />
                        <span className="text-white/60">Tudo o que você precisa.</span>
                    </h2>
                    <p className="text-lg text-white/80 leading-relaxed">
                        Removemos o excesso para focar na essência do atendimento médico.
                        Cada ferramenta foi desenhada para economizar seu tempo, não ocupá-lo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`group relative rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-colors duration-500 cursor-default flex flex-col bg-white/5 backdrop-blur-sm`}
                        >
                            <div className={`p-8 md:p-10 flex-1 flex flex-col`}>
                                <div className={`w-16 h-16 rounded-2xl bg-white text-[#212121] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                    <div className="text-black">
                                        {feature.icon.props.className.includes("text-white") ? <feature.icon.type {...feature.icon.props} className="w-8 h-8 text-[#212121]" /> : feature.icon}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-4 group-hover:translate-x-1 transition-transform">{feature.title}</h3>

                                <p className="text-white/80 mb-8 leading-relaxed text-lg">
                                    {feature.description}
                                </p>

                                <ul className="mt-auto space-y-3">
                                    {feature.items.map((item, i) => (
                                        <li key={i} className="flex items-center text-white/90 font-medium">
                                            <div className="mr-3 p-0.5 rounded-full bg-white/20 text-white">
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

                <div className="mt-20 text-center">
                    <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-6 text-lg rounded-xl transition-all">
                        Explorar todas as funcionalidades <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
