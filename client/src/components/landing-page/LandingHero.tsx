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
    FlaskConical
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
        <section className="pt-28 pb-12 md:pt-32 md:pb-16 px-5 sm:px-6 lg:px-8 relative bg-pureWhite min-h-screen flex flex-col justify-center">
            <motion.div
                className="flex flex-col md:flex-row items-center"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div className="md:w-1/2 mb-10 md:mb-0 md:pr-8" variants={itemVariants}>


                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-5 md:mb-6">
                        <span className="tracking-tight">VitaView</span><span className="text-[#9E9E9E] ml-1">AI</span>: Simples. Objetiva. <span className="text-[#212121] decoration-4 underline decoration-[#E0E0E0]">Completa.</span>
                    </h1>

                    <p className="text-base md:text-xl text-[#616161] font-body mb-6 md:mb-8 max-w-lg leading-relaxed">
                        A plataforma de gestão clínica que entrega <strong>tudo o que você precisa</strong> sem complexidade.
                        Prontuário inteligente, IA avançada e interface direta por um valor que faz sentido.
                    </p>

                    {/* Benefícios em lista */}
                    <div className="mb-6 md:mb-8 space-y-3 md:space-y-3 hidden md:block">
                        {[
                            { icon: <ShieldCheck className="h-5 w-5 text-[#212121]" />, text: "Conformidade HIPAA e LGPD" },
                            { icon: <Brain className="h-5 w-5 text-[#212121]" />, text: "Organização Inteligente de Dados Clínicos" },
                            { icon: <Activity className="h-5 w-5 text-[#212121]" />, text: "Monitoramento Remoto de Pacientes" }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="flex items-center space-x-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                            >
                                <div className="flex-shrink-0 p-1.5 bg-[#E0E0E0] rounded-full">
                                    {item.icon}
                                </div>
                                <p className="text-[#212121] font-body">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Estatísticas animadas */}
                    <div className="grid grid-cols-3 gap-4 mb-8 hidden md:grid">
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
                            <p className="text-sm text-[#9E9E9E] font-body">Menos Tempo Desperdiçado</p>
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
                        <a href="#demonstracoes">
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Button size="lg" variant="outline" className="border-2 border-[#212121] text-[#212121] hover:bg-[#E0E0E0] px-6 md:px-8 py-5 md:py-6 rounded-lg flex items-center font-heading font-bold text-sm md:text-base">
                                    <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Ver Demonstração
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
                            className="rounded-xl shadow-2xl relative z-10 bg-white overflow-hidden w-full max-w-[600px] h-auto aspect-[16/10] flex flex-col items-center justify-center border-2 border-dashed border-[#E0E0E0]200 bg-[#F4F4F4]/30"
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
                            className="absolute -top-5 -right-5 p-3 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                        >
                            <div className="flex items-center space-x-2">
                                <Brain className="w-5 h-5 text-[#212121]" />
                                <span className="text-sm font-medium">Processamento IA</span>
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

            {/* Badges flutuantes na parte de baixo - design minimalista */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-4 py-2 px-6 bg-pureWhite border border-[#E0E0E0] rounded-t-xl text-xs md:text-sm text-[#212121] hidden sm:flex">
                <span className="flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-[#212121]" /> Dados protegidos
                </span>
                <span className="flex items-center">
                    <Brain className="w-4 h-4 mr-1 text-[#212121]" /> Análise com IA
                </span>
                <span className="flex items-center">
                    <FlaskConical className="w-4 h-4 mr-1 text-[#212121]" /> Interpretação clínica
                </span>
            </div>
        </section>
    );
}
