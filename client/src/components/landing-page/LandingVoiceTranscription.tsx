import { motion } from "framer-motion";
import { Mic, Sparkles, Lock, Wand2, RefreshCcw, FileSearch } from "lucide-react";

export function LandingVoiceTranscription() {
    return (
        <section className="py-12 md:py-20 bg-white relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 lg:gap-24">

                    {/* Left: Voice Animation Mockup */}
                    {/* Left: AI Animation Mockups Stack */}
                    <div className="md:w-1/2 w-full flex flex-col items-center gap-6 sm:gap-8 relative z-10 py-4">
                        
                        {/* 1. Voice Mockup */}
                        <motion.div
                            className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative w-full max-w-[420px] z-30"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="bg-[#F9F9F9] border-b border-[#E0E0E0] px-3 py-2 flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]"></div>
                            </div>
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                                        <Mic className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-[#212121] mb-0.5">Ouvindo consulta...</h3>
                                <p className="text-[#616161] italic text-[11px] mb-3 max-w-[200px]">
                                    "Paciente relata dor de cabeça frontal pulsátil há 3 dias..."
                                </p>
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
                        </motion.div>

                        {/* 2. Melhorar com IA mockup */}
                        <motion.div
                            className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative w-full max-w-[420px] md:ml-12 z-20"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                        >
                            <div className="bg-[#F9F9F9] border-b border-[#E0E0E0] px-4 py-2.5 flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4 text-[#212121]" />
                                <span className="text-xs font-bold text-[#212121] uppercase tracking-wide">Melhoria Inteligente</span>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-3 relative opacity-80">
                                    <span className="absolute -top-2.5 left-3 bg-[#E0E0E0] text-[#616161] text-[9px] font-bold px-1.5 py-0.5 rounded">TEXTO ORIGINAL</span>
                                    <p className="text-[11px] text-[#616161] mt-1 font-mono italic">
                                        "paciente ta com dor na cabeca ja faz uns 3 dia tb ta com mta ansia"
                                    </p>
                                </div>
                                <div className="flex justify-center -my-2.5 relative z-10">
                                    <div className="bg-[#212121] rounded-full p-1.5 shadow-md">
                                        <Wand2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div className="bg-[#F4FFF4] border border-[#CDECCD] rounded-lg p-3 relative">
                                    <span className="absolute -top-2.5 left-3 bg-[#CDECCD] text-[#1D7A1D] text-[9px] font-bold px-1.5 py-0.5 rounded">REFINAMENTO IA</span>
                                    <p className="text-[12px] text-[#212121] mt-1 font-medium leading-relaxed">
                                        Cefaleia há 3 dias, associada a episódios de náusea.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* 3. Extrair com IA mockup */}
                        <motion.div
                            className="bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative w-full max-w-[420px] md:-ml-6 z-10"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="bg-[#F9F9F9] border-b border-[#E0E0E0] px-4 py-2.5 flex items-center gap-2">
                                <FileSearch className="w-4 h-4 text-[#212121]" />
                                <span className="text-xs font-bold text-[#212121] uppercase tracking-wide">Extração Clínica</span>
                            </div>
                            <div className="p-5">
                                <p className="text-[12px] text-[#616161] mb-4 leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#E0E0E0]">
                                    "Paciente no acompanhamento da <span className="bg-yellow-100/80 text-yellow-800 font-bold px-1 rounded">hipertensão</span>, refere piora do quadro de <span className="bg-red-100/80 text-red-800 font-bold px-1 rounded">taquicardia</span> com uso de <span className="bg-blue-100/80 text-blue-800 font-bold px-1 rounded">Losartana 50mg</span>."
                                </p>
                                <div className="flex flex-wrap gap-2 transition-all">
                                    <span className="inline-flex items-center gap-1.5 bg-[#FAFAFA] border border-[#E0E0E0] text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-md text-[#212121] shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> HAS</span>
                                    <span className="inline-flex items-center gap-1.5 bg-[#FAFAFA] border border-[#E0E0E0] text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-md text-[#212121] shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Taquicardia</span>
                                    <span className="inline-flex items-center gap-1.5 bg-[#FAFAFA] border border-[#E0E0E0] text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-md text-[#212121] shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Losartana 50mg</span>
                                </div>
                            </div>
                        </motion.div>

                    </div>

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

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-[1.1] mb-5 tracking-tight">
                            Sua parceira inteligente na <br />
                            <span className="text-[#9E9E9E]">construção da anamnese.</span>
                        </h2>

                        <p className="text-base md:text-lg text-[#616161] leading-relaxed mb-6 max-w-lg">
                            Foque apenas no paciente. O VitaView não só transforma áudio em texto clínico, como também aprimora anotações rápidas que você digita e extrai o núcleo de históricos médicos extensos automaticamente.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0 border border-[#E0E0E0]">
                                    <Lock className="w-5 h-5 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0.5">Gravação Segura</h4>
                                    <p className="text-xs text-[#616161] leading-relaxed">Criptografia ponta a ponta na captação do áudio.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0 border border-[#E0E0E0]">
                                    <Wand2 className="w-5 h-5 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0.5">Refinamento Clínico</h4>
                                    <p className="text-xs text-[#616161] leading-relaxed">Transforma linguagem coloquial em termos médicos.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0 border border-[#E0E0E0]">
                                    <RefreshCcw className="w-5 h-5 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0.5">Melhorar com IA</h4>
                                    <p className="text-xs text-[#616161] leading-relaxed">Aprimora e formata textos digitados manualmente.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0 border border-[#E0E0E0]">
                                    <FileSearch className="w-5 h-5 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0.5">Extrair com IA</h4>
                                    <p className="text-xs text-[#616161] leading-relaxed">Pinça sintomas e histórico de grandes blocos de texto.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
