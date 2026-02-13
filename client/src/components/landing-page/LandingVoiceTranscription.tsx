import { motion } from "framer-motion";
import { Mic, Sparkles, Lock, Wand2 } from "lucide-react";

export function LandingVoiceTranscription() {
    return (
        <section className="py-12 md:py-20 bg-white relative overflow-hidden">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 lg:gap-24">

                    {/* Left: Voice Animation Mockup */}
                    <motion.div
                        className="md:w-1/2 w-full flex justify-center"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-xl overflow-hidden relative w-full max-w-[420px]">
                            {/* Browser Header */}
                            <div className="bg-[#F9F9F9] border-b border-[#E0E0E0] px-3 py-2 flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#E0E0E0]"></div>
                                <div className="w-2 h-2 rounded-full bg-[#E0E0E0]"></div>
                                <div className="w-2 h-2 rounded-full bg-[#E0E0E0]"></div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex flex-col items-center text-center">
                                {/* Pulsing Mic */}
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                                        <Mic className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-[#212121] mb-0.5">Ouvindo consulta...</h3>
                                <p className="text-[#616161] italic text-[10px] mb-3 max-w-[200px]">
                                    "Paciente relata dor de cabeça frontal pulsátil há 3 dias..."
                                </p>

                                {/* Audio Visualizer Bars */}
                                <div className="flex items-center gap-1 h-5 mb-2">
                                    {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1 bg-[#212121] rounded-full"
                                            animate={{ height: [6, h * 3, 6] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                            style={{ height: 6 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Text Content */}
                    <motion.div
                        className="md:w-1/2 flex flex-col items-start"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F5F5F5] border border-[#E0E0E0] mb-4">
                            <Sparkles className="w-3 h-3 text-[#212121]" />
                            <span className="text-[10px] font-bold text-[#212121] uppercase tracking-wide">Inteligência Artificial</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-4">
                            Sua voz vira <br />
                            <span className="text-[#9E9E9E]">prontuário estruturado.</span>
                        </h2>

                        <p className="text-base md:text-lg text-[#616161] leading-relaxed mb-6 max-w-lg">
                            Foque no paciente, não na tela. Grave a consulta e nossa IA transcreve, resume e organiza tudo automaticamente.
                        </p>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                                    <Lock className="w-4 h-4 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0.5">Gravação Segura</h4>
                                    <p className="text-xs text-[#616161]">Criptografia ponta a ponta.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                                    <Wand2 className="w-4 h-4 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0.5">Refinamento Clínico</h4>
                                    <p className="text-xs text-[#616161]">Transforma linguagem coloquial em técnica.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
