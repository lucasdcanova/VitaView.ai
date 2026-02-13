import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export function LandingHero() {
    return (
        <section className="min-h-[100dvh] md:h-screen w-full relative bg-white flex flex-col overflow-hidden">
            {/* Subtle dot grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <div className="flex-grow flex flex-col justify-center items-center text-center max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-24 md:py-0 relative z-10">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="mb-8"
                >
                    <Logo
                        size="xl"
                        showText={true}
                        textSize="xl"
                        variant="icon"
                        className="font-bold tracking-tight"
                    />
                </motion.div>

                {/* Headline */}
                <motion.h1
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-[#212121] leading-[1.08] tracking-tight mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
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
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    Concentre-se no paciente enquanto nossa IA cuida da burocracia.
                    Uma plataforma simples, objetiva e completa.
                </motion.p>

                {/* Single CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Link href="/auth">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                size="lg"
                                className="bg-[#212121] hover:bg-[#424242] text-white px-10 py-6 rounded-xl font-heading font-bold text-base shadow-lg hover:shadow-xl transition-all h-auto"
                            >
                                Começar Teste Grátis
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    </Link>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#9E9E9E]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
            >
                <span className="text-[10px] font-medium uppercase tracking-widest">Descubra</span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </motion.div>
        </section>
    );
}
