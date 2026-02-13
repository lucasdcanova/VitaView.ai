import { motion } from "framer-motion";
import { Link } from "wouter";
import {
    ShieldCheck,
    Brain,
    Activity,
    ChevronRight,
    Play,
    Upload,
    FileText,
    CheckCircle2,
    Shield,
    FlaskConical,
    ArrowRight,
    Mic,
    Sparkles,
    Lock,
    Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";


export function LandingHero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <section className="min-h-[100dvh] md:h-screen w-full relative bg-white flex flex-col overflow-hidden">
            <div className="flex-grow flex flex-col justify-center max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 gap-6 md:gap-10 py-20 md:py-0">

                {/* First Block: Hero Text vs File Upload Animation */}
                <motion.div
                    className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {/* Left Content: Text */}
                    <motion.div className="md:w-1/2 flex flex-col items-start" variants={itemVariants}>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-3">
                            <span className="tracking-tight">VitaView</span><span className="text-[#9E9E9E] ml-1">AI</span>: O Prontuário que <span className="text-[#212121] decoration-4 underline decoration-[#E0E0E0]">pensa com você.</span>
                        </h1>

                        <p className="text-sm md:text-base text-[#616161] font-body mb-5 max-w-lg leading-relaxed">
                            Uma plataforma <strong>simples, objetiva e completa</strong>.
                            Concentre-se no paciente enquanto nossa IA cuida da burocracia.
                        </p>

                        {/* Benefícios em lista */}
                        <div className="mb-6 hidden md:block">
                            <p className="text-xs text-[#9E9E9E] font-medium mb-2">PLATAFORMA INTEGRADA:</p>
                            <div className="flex gap-4 text-[#424242] text-xs font-medium">
                                <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Anamnese</span>
                                <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Prescrição</span>
                                <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> IA Assist</span>
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                            <motion.div className="text-center p-2 bg-pureWhite rounded-lg border border-[#E0E0E0]" whileHover={{ y: -3 }}>
                                <h3 className="text-lg md:text-xl font-heading font-bold text-[#212121]">98%</h3>
                                <p className="text-[10px] text-[#9E9E9E] font-body">Precisão</p>
                            </motion.div>
                            <motion.div className="text-center p-2 bg-pureWhite rounded-lg border border-[#E0E0E0]" whileHover={{ y: -3 }}>
                                <h3 className="text-lg md:text-xl font-heading font-bold text-[#212121]">30%</h3>
                                <p className="text-[10px] text-[#9E9E9E] font-body">Economia</p>
                            </motion.div>
                            <motion.div className="text-center p-2 bg-pureWhite rounded-lg border border-[#E0E0E0]" whileHover={{ y: -3 }}>
                                <h3 className="text-lg md:text-xl font-heading font-bold text-[#212121]">24/7</h3>
                                <p className="text-[10px] text-[#9E9E9E] font-body">Acesso</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Content: File Upload Animation */}
                    <motion.div className="md:w-1/2 flex justify-center relative w-full" variants={itemVariants}>
                        {/* Wrapper for compactness on mobile */}
                        <div className="relative w-full max-w-[420px]">
                            {/* Bg Blur */}
                            <div className="absolute -z-10 w-56 h-56 bg-[#E0E0E0] rounded-full opacity-30 blur-xl -top-8 -right-8 hidden md:block"></div>

                            <motion.div
                                className="rounded-xl shadow-lg relative z-10 bg-white overflow-hidden w-full aspect-[16/9] flex flex-col items-center justify-center border-2 border-dashed border-[#E0E0E0] bg-[#F4F4F4]/30"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <motion.div
                                    className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-3 relative z-20"
                                    animate={{ boxShadow: ["0 10px 25px -5px rgba(59, 130, 246, 0.1)", "0 10px 25px -5px rgba(59, 130, 246, 0.3)", "0 10px 25px -5px rgba(59, 130, 246, 0.1)"] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Upload className="w-6 h-6 text-[#212121]" />
                                </motion.div>
                                <h3 className="text-base font-semibold text-[#212121] mb-0.5">Arraste exames aqui</h3>
                                <p className="text-[#9E9E9E] text-center text-xs max-w-[180px]">IA processa PDFs e imagens.</p>

                                {/* Animated Files */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <motion.div
                                        className="absolute top-4 left-4 bg-white p-1.5 rounded-lg shadow-md flex items-center gap-1.5 border border-[#E0E0E0]"
                                        initial={{ x: -100, y: -50, opacity: 0 }}
                                        animate={{ x: [null, 100, 160], y: [null, 60, 100], opacity: [0, 1, 0], scale: [1, 1, 0.5] }}
                                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                                    >
                                        <FileText className="w-5 h-5 text-[#212121]" />
                                    </motion.div>
                                    <motion.div
                                        className="absolute bottom-12 right-4 bg-white p-1.5 rounded-lg shadow-md flex items-center gap-1.5 border border-[#E0E0E0]"
                                        initial={{ x: 100, y: 50, opacity: 0 }}
                                        animate={{ x: [null, -80, -140], y: [null, -50, -90], opacity: [0, 1, 0], scale: [1, 1, 0.5] }}
                                        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 0.5, delay: 1 }}
                                    >
                                        <span className="text-[10px] font-bold text-[#212121] px-0.5">JPG</span>
                                    </motion.div>
                                </div>
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9E9E9E] to-transparent opacity-50"
                                    animate={{ top: ["0%", "100%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>

                            {/* Floating Badge */}
                            <motion.div
                                className="absolute -bottom-5 -left-3 p-2.5 bg-white rounded-lg shadow-lg z-20 hidden md:flex items-center space-x-2 border border-[#E0E0E0]"
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#212121]" />
                                <span className="text-[10px] font-medium">Dados Extraídos</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Second Block: Voice Animation (Left) vs Voice Text (Right) */}
                <div className="flex flex-col-reverse md:flex-row items-center gap-6 md:gap-12">

                    {/* Left Content: Voice Animation Mockup */}
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

                    {/* Right Content: Voice Text */}
                    <motion.div
                        className="md:w-1/2 flex flex-col items-start"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F5F5F5] border border-[#E0E0E0] mb-3">
                            <Sparkles className="w-3 h-3 text-[#212121]" />
                            <span className="text-[10px] font-bold text-[#212121] uppercase tracking-wide">Inteligência Artificial</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#212121] leading-tight mb-3">
                            Sua voz vira <br />
                            <span className="text-[#9E9E9E]">prontuário estruturado.</span>
                        </h2>

                        <p className="text-sm text-[#616161] leading-relaxed mb-5 max-w-lg">
                            Foque no paciente, não na tela. Grave a consulta e nossa IA transcreve, resume e organiza tudo automaticamente.
                        </p>

                        <div className="space-y-3">
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                                    <Lock className="w-3.5 h-3.5 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0">Gravação Segura</h4>
                                    <p className="text-[10px] text-[#616161]">Criptografia ponta a ponta.</p>
                                </div>
                            </div>

                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                                    <Wand2 className="w-3.5 h-3.5 text-[#212121]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121] mb-0">Refinamento Clínico</h4>
                                    <p className="text-[10px] text-[#616161]">Transforma linguagem coloquial em técnica.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom CTA Area - Consolidated */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-0 pt-0 w-full"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/auth">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button size="lg" className="bg-[#212121] hover:bg-[#424242] text-white px-8 py-5 rounded-lg font-heading font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all h-auto">
                                Começar Teste Grátis
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    </Link>
                    <a
                        href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20da%20VitaView%20AI"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button size="lg" variant="outline" className="border-2 border-[#212121] text-[#212121] hover:bg-[#F5F5F5] px-8 py-5 rounded-lg flex items-center font-heading font-bold text-sm md:text-base h-auto">
                                <Play className="mr-2 h-4 w-4" /> Agendar Demonstração
                            </Button>
                        </motion.div>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}

