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
    ArrowRight
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
        <section className="h-screen w-full relative bg-white flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center pt-16 px-5 sm:px-6 lg:px-8">
                <motion.div
                    className="flex flex-col md:flex-row items-center"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div className="md:w-1/2 mb-10 md:mb-0 md:pr-8" variants={itemVariants}>


                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-3 md:mb-4">
                            <span className="tracking-tight">VitaView</span><span className="text-[#9E9E9E] ml-1">AI</span>: O Prontuário que <span className="text-[#212121] decoration-4 underline decoration-[#E0E0E0]">pensa com você.</span>
                        </h1>

                        <p className="text-sm md:text-base text-[#616161] font-body mb-4 md:mb-5 max-w-lg leading-relaxed">
                            Uma plataforma <strong>simples, objetiva e completa</strong>.
                            Concentre-se no paciente enquanto nossa IA cuida da burocracia.
                        </p>

                        {/* Benefícios em lista - Removido para limpar e focar nos pilares abaixo */}
                        <div className="mb-8 hidden md:block">
                            <p className="text-sm text-[#9E9E9E] font-medium mb-2">PLATAFORMA INTEGRADA:</p>
                            <div className="flex gap-4 text-[#424242] text-sm font-medium">
                                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Anamnese</span>
                                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Prescrição</span>
                                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> IA Assist</span>
                            </div>
                        </div>



                        {/* Estatísticas animadas */}
                        <div className="grid grid-cols-3 gap-3 mb-6 hidden md:grid">
                            <motion.div
                                className="text-center p-4 bg-pureWhite rounded-lg border border-[#E0E0E0]"
                                whileHover={{ y: -5 }}
                            >
                                <h3 className="text-2xl md:text-3xl font-heading font-bold text-[#212121]">98%</h3>
                                <p className="text-sm text-[#9E9E9E] font-body">Precisão na Extração</p>
                            </motion.div>
                            <motion.div
                                className="text-center p-4 bg-pureWhite rounded-lg border border-[#E0E0E0]"
                                whileHover={{ y: -5 }}
                            >
                                <h3 className="text-2xl md:text-3xl font-heading font-bold text-[#212121]">30%</h3>
                                <p className="text-sm text-[#9E9E9E] font-body">Menos Tempo Desperdício</p>
                            </motion.div>
                            <motion.div
                                className="text-center p-4 bg-pureWhite rounded-lg border border-[#E0E0E0]"
                                whileHover={{ y: -5 }}
                            >
                                <h3 className="text-2xl md:text-3xl font-heading font-bold text-[#212121]">24/7</h3>
                                <p className="text-sm text-[#9E9E9E] font-body">Acesso Seguro a Todo Instante</p>
                            </motion.div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                            <Link href="/auth">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Button size="lg" className="bg-[#212121] hover:bg-[#424242] text-white px-6 md:px-8 py-5 md:py-6 rounded-lg w-full sm:w-auto font-heading font-bold text-sm md:text-base">
                                        Começar Teste Grátis
                                        <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                                    </Button>
                                </motion.div>
                            </Link>
                            <a
                                href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20da%20VitaView%20AI"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Button size="lg" variant="outline" className="border-2 border-[#212121] text-[#212121] hover:bg-[#E0E0E0] px-6 md:px-8 py-5 md:py-6 rounded-lg flex items-center font-heading font-bold text-sm md:text-base cursor-pointer">
                                        <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Agendar Demonstração
                                    </Button>
                                </motion.div>
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        className="md:w-1/2 flex justify-center relative mt-10 md:mt-0"
                        variants={itemVariants}
                    >
                        {/* Elemento decorativo minimalista */}
                        <div className="absolute -z-10 w-64 h-64 bg-[#E0E0E0] rounded-full opacity-30 blur-xl -top-10 -right-10"></div>

                        {/* Imagem principal com sobreposição de elementos */}
                        <div className="relative w-full max-w-[600px]">
                            <motion.div
                                className="rounded-xl shadow-xl relative z-10 bg-white overflow-hidden w-full max-w-[420px] h-auto aspect-[16/10] max-h-[240px] flex flex-col items-center justify-center border-2 border-dashed border-[#E0E0E0]200 bg-[#F4F4F4]/30"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                {/* Central Upload Icon */}
                                <motion.div
                                    className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 relative z-20"
                                    animate={{
                                        boxShadow: ["0 10px 25px -5px rgba(59, 130, 246, 0.1)", "0 10px 25px -5px rgba(59, 130, 246, 0.3)", "0 10px 25px -5px rgba(59, 130, 246, 0.1)"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Upload className="w-10 h-10 text-[#212121]" />
                                </motion.div>

                                <h3 className="text-xl font-semibold text-[#212121] mb-2">Arraste exames de pacientes aqui</h3>
                                <p className="text-[#9E9E9E] text-center max-w-xs mb-8">
                                    A IA processa PDFs e imagens automaticamente para o prontuário.
                                </p>

                                {/* Animated Files Floating In */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {/* File 1 - PDF */}
                                    <motion.div
                                        className="absolute top-10 left-10 bg-white p-3 rounded-lg shadow-md flex items-center gap-2 border border-[#E0E0E0]"
                                        initial={{ x: -100, y: -50, opacity: 0 }}
                                        animate={{
                                            x: [null, 150, 220],
                                            y: [null, 100, 150],
                                            opacity: [0, 1, 0],
                                            scale: [1, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            repeatDelay: 1
                                        }}
                                    >
                                        <FileText className="w-8 h-8 text-[#212121]" />
                                        <div className="w-16 h-2 bg-[#E0E0E0] rounded"></div>
                                    </motion.div>

                                    {/* File 2 - Image */}
                                    <motion.div
                                        className="absolute bottom-20 right-10 bg-white p-3 rounded-lg shadow-md flex items-center gap-2 border border-[#E0E0E0]"
                                        initial={{ x: 100, y: 50, opacity: 0 }}
                                        animate={{
                                            x: [null, -120, -200],
                                            y: [null, -80, -120],
                                            opacity: [0, 1, 0],
                                            scale: [1, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 3.5,
                                            repeat: Infinity,
                                            repeatDelay: 0.5,
                                            delay: 1
                                        }}
                                    >
                                        <div className="w-8 h-8 bg-[#E0E0E0] rounded flex items-center justify-center">
                                            <span className="text-xs font-bold text-[#212121]">JPG</span>
                                        </div>
                                        <div className="w-16 h-2 bg-[#E0E0E0] rounded"></div>
                                    </motion.div>

                                    {/* File 3 - Another PDF */}
                                    <motion.div
                                        className="absolute top-1/2 left-[-50px] bg-white p-2 rounded-lg shadow-sm flex items-center gap-2 border border-[#E0E0E0]"
                                        initial={{ x: 0, opacity: 0 }}
                                        animate={{
                                            x: [0, 200, 280],
                                            y: [0, -20, 0],
                                            opacity: [0, 1, 0],
                                            scale: [0.8, 0.8, 0.4]
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            repeatDelay: 2,
                                            delay: 0.5
                                        }}
                                    >
                                        <FileText className="w-6 h-6 text-[#9E9E9E]" />
                                    </motion.div>
                                </div>

                                {/* Scanning Line Effect */}
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9E9E9E] to-transparent opacity-50"
                                    animate={{ top: ["0%", "100%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>

                            {/* Floating Badges */}
                            <motion.div
                                className="absolute -top-12 -right-8 p-4 bg-white rounded-xl shadow-xl z-20 hidden md:block border border-[#E0E0E0]"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="bg-[#212121] p-2.5 rounded-lg">
                                        <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider leading-none mb-1">Pioneiros em</p>
                                        <p className="text-sm font-bold text-[#212121] leading-tight">Interpretação de<br />Exames com IA</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute -bottom-8 -left-8 p-3 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                            >
                                <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-[#212121]" />
                                    <span className="text-sm font-medium">Dados Extraídos</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Badges flutuantes na parte de baixo - design minimalista estilo "ilha" */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-4 py-2 px-6 bg-pureWhite border border-[#E0E0E0] rounded-full shadow-sm text-xs md:text-sm text-[#212121] hidden sm:flex z-10">
                <span className="flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-[#212121]" /> Dados protegidos
                </span>
                <span className="flex items-center">
                    <Brain className="w-4 h-4 mr-1 text-[#212121]" /> Análise com IA
                </span>
            </div>

            {/* How It Works Sub-section - Footer Area */}
            <div className="shrink-0 w-full bg-white border-t border-dashed border-gray-100 py-8 md:py-12 px-4 relative z-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <motion.h2
                            className="text-base md:text-lg font-heading font-bold text-[#212121] flex items-center justify-center gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="bg-[#212121] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wide font-bold">3 Passos Simples</span>
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-3 gap-6 md:gap-12 relative">
                        {[
                            {
                                icon: <Upload className="w-6 h-6 md:w-8 md:h-8 text-[#212121]" />,
                                title: "1. Upload",
                                description: "Arraste seus arquivos."
                            },
                            {
                                icon: <Brain className="w-6 h-6 md:w-8 md:h-8 text-[#212121]" />,
                                title: "2. Análise IA",
                                description: "Extração clínica e classificação."
                            },
                            {
                                icon: <FileText className="w-6 h-6 md:w-8 md:h-8 text-[#212121]" />,
                                title: "3. Prontuário",
                                description: "Histórico estruturado pronto."
                            }
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                className="relative flex flex-col items-center text-center"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#F5F5F5] border border-[#E0E0E0] flex items-center justify-center shadow-sm mb-3 md:mb-4 transition-transform hover:scale-105 duration-300">
                                    {step.icon}
                                </div>
                                <h3 className="text-sm md:text-base font-bold text-[#212121] mb-1 md:mb-2">{step.title}</h3>
                                <p className="text-xs md:text-sm text-[#616161] leading-relaxed max-w-[180px]">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
