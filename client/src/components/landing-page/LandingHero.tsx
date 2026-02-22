import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export function LandingHero() {
    const scrollToFirstSection = () => {
        const firstSection = document.getElementById("como-funciona");
        if (firstSection) {
            firstSection.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    };

    return (
        <section className="min-h-[100dvh] md:h-screen w-full relative bg-white flex flex-col overflow-hidden touch-pan-y">
            {/* Clean background atmosphere (without particles) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#F5F5F5] to-transparent" />
                <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#E0E0E0] opacity-75 blur-3xl" />
                <div className="absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-[#F2F2F2] opacity-85 blur-3xl" />
            </div>

            <div className="flex-grow flex flex-col justify-center items-center text-center max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-24 md:py-0 relative z-10">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.44, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-8"
                >
                    <Logo
                        size="lg"
                        showText={false}
                        textSize="xl"
                        variant="full"
                        className="md:hidden w-[min(88vw,380px)] [&>img]:w-full [&>img]:h-auto"
                    />
                    <Logo
                        size="xl"
                        showText={true}
                        textSize="xl"
                        variant="icon"
                        className="hidden md:flex font-bold tracking-tight"
                    />
                </motion.div>

                {/* Headline */}
                <motion.h1
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-[#212121] leading-[1.08] tracking-tight mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.58, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                    O Prontuário que{" "}
                    <br className="hidden sm:block" />
                    <span className="text-[#9E9E9E]">pensa com você.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-base md:text-lg text-[#757575] font-body max-w-xl leading-relaxed mb-10"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                    Concentre-se no paciente enquanto nossa IA cuida da burocracia.
                    Uma plataforma simples, objetiva e completa.
                </motion.p>

                {/* Dual CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-20 touch-manipulation flex flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-[360px] sm:max-w-none"
                >
                    <motion.div
                        whileHover={{ y: -2, scale: 1.015 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-block flex-1 sm:flex-none"
                    >
                        <Link href="/auth">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-[#212121] hover:bg-[#424242] active:bg-[#616161] text-white px-4 sm:px-10 py-4 sm:py-6 rounded-xl font-heading font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all h-auto touch-manipulation pointer-events-auto cursor-pointer"
                            >
                                Entrar
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-block flex-1 sm:flex-none"
                    >
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto border-[#212121] text-[#212121] bg-white/80 hover:bg-white px-4 sm:px-10 py-4 sm:py-6 rounded-xl font-heading font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all h-auto"
                        >
                            <a href="#como-funciona">Conhecer</a>
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.button
                type="button"
                onClick={scrollToFirstSection}
                aria-label="Descer para a próxima seção"
                className="absolute bottom-8 inset-x-0 mx-auto w-fit z-20 flex flex-col items-center gap-1 text-[#9E9E9E] hover:text-[#616161] transition-colors touch-manipulation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: 1 }}
                whileTap={{ scale: 0.97 }}
            >
                <span className="text-[10px] font-medium uppercase tracking-widest">Descubra</span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </motion.button>
        </section>
    );
}
