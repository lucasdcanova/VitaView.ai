import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Wand2, FileText, CheckCircle2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingAnamnesis() {
    const [step, setStep] = useState(0); // 0: Recording, 1: Processando, 2: Finalizado

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 3);
        }, 4000); // 4 segundos por estado

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-12 md:py-24 bg-[#0A0A0A] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-pulse"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20">

                    {/* Lado Esquerdo: Texto */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white/90 mb-6 tracking-wide uppercase backdrop-blur-sm">
                                <span className="mr-2">✨</span> Inteligência Artificial
                            </span>

                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                                Sua voz vira <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                                    prontuário estruturado.
                                </span>
                            </h2>

                            <p className="text-lg text-white/70 mb-8 leading-relaxed">
                                Foque no paciente, não na tela. Grave a consulta e nossa IA transcreve, resume e organiza tudo automaticamente no padrão médico.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-start">
                                    <div className="mt-1 mr-4 bg-white/10 p-2 rounded-lg border border-white/10">
                                        <Mic className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Gravação Segura</h4>
                                        <p className="text-sm text-white/60">Captação de áudio criptografada e processamento em tempo real.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="mt-1 mr-4 bg-white/10 p-2 rounded-lg border border-white/10">
                                        <Wand2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Refinamento Clínico</h4>
                                        <p className="text-sm text-white/60">Transforma linguagem coloquial em termos técnicos precisos.</p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20queria%20saber%20mais%20sobre%20a%20anamnese%20com%20IA"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button className="bg-white hover:bg-white/90 text-[#212121] px-8 py-6 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">
                                    Ver na Prática <Play className="ml-2 w-4 h-4" />
                                </Button>
                            </a>
                        </motion.div>
                    </div>

                    {/* Lado Direito: Animação */}
                    <div className="lg:w-1/2 w-full">
                        <motion.div
                            className="relative bg-[#FAFAFA] rounded-2xl border border-[#E0E0E0] shadow-2xl overflow-hidden aspect-[4/3] md:aspect-[16/10]"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {/* Header da Interface Simulada */}
                            <div className="h-12 border-b border-[#E0E0E0] bg-white flex items-center px-4 space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="ml-4 flex-1 bg-[#F5F5F5] h-6 rounded-md w-1/3"></div>
                            </div>

                            <div className="p-6 md:p-8 h-full flex flex-col items-center justify-center relative">
                                <AnimatePresence mode="wait">

                                    {/* Passo 1: Gravando */}
                                    {step === 0 && (
                                        <motion.div
                                            key="recording"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.4 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="relative">
                                                <motion.div
                                                    className="absolute inset-0 bg-red-100 rounded-full"
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-red-200">
                                                    <Mic className="w-10 h-10 text-white" />
                                                </div>
                                            </div>
                                            <div className="mt-8 text-center space-y-2">
                                                <p className="text-lg font-bold text-[#212121]">Ouvindo consulta...</p>
                                                <p className="text-sm text-[#757575] max-w-xs mx-auto">
                                                    "Paciente relata dor de cabeça frontal pulsátil há 3 dias, associada a náuseas..."
                                                </p>
                                                <div className="flex justify-center gap-1 mt-4 h-4 items-end">
                                                    {[...Array(5)].map((_, i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="w-1 bg-[#212121] rounded-full"
                                                            animate={{ height: [10, 24, 10] }}
                                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Passo 2: Processando IA */}
                                    {step === 1 && (
                                        <motion.div
                                            key="processing"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center w-full max-w-md"
                                        >
                                            <div className="w-16 h-16 bg-[#212121] rounded-2xl flex items-center justify-center mb-6 shadow-xl animate-bounce">
                                                <Wand2 className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-[#212121] mb-2">Processando com IA</h3>
                                            <div className="w-full bg-[#E0E0E0] rounded-full h-2 mb-6 overflow-hidden">
                                                <motion.div
                                                    className="bg-[#212121] h-2 rounded-full"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 2.5, ease: "easeInOut" }}
                                                />
                                            </div>
                                            <div className="space-y-3 w-full opacity-60">
                                                <div className="h-2 bg-[#E0E0E0] rounded w-3/4"></div>
                                                <div className="h-2 bg-[#E0E0E0] rounded w-full"></div>
                                                <div className="h-2 bg-[#E0E0E0] rounded w-5/6"></div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Passo 3: Resultado Final */}
                                    {step === 2 && (
                                        <motion.div
                                            key="result"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-xl shadow-sm p-6"
                                        >
                                            <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F5] pb-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-[#212121]" />
                                                    <span className="font-bold text-sm text-[#212121]">Anamnese Transcrita</span>
                                                </div>
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            </div>

                                            <div className="space-y-4 text-sm">
                                                <div>
                                                    <span className="text-[#9E9E9E] font-medium text-xs uppercase tracking-wider block mb-1">Queixa Principal (QP)</span>
                                                    <p className="text-[#424242] font-medium bg-[#FAFAFA] p-2 rounded">Cefaleia frontal pulsátil.</p>
                                                </div>
                                                <div>
                                                    <span className="text-[#9E9E9E] font-medium text-xs uppercase tracking-wider block mb-1">História da Moléstia Atual (HMA)</span>
                                                    <p className="text-[#424242] font-medium bg-[#FAFAFA] p-2 rounded leading-relaxed">
                                                        Início há 3 dias. Caráter pulsátil, intensidade 7/10. Associada a náuseas e fotofobia. Piora com esforço físico.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Indicadores de Estado */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${step === i ? "bg-[#212121] w-4" : "bg-[#E0E0E0]"
                                            }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
