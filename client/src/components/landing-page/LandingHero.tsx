import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export function LandingHero() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const targetPlaybackRateRef = useRef(1);
    const lastScrollAtRef = useRef(0);
    const { scrollY } = useScroll();
    const prefersReducedMotion = useReducedMotion();

    const heroOpacityRaw = useTransform(
        scrollY,
        [0, 96, 460],
        [1, 1, prefersReducedMotion ? 1 : 0.08]
    );
    const heroOpacity = useSpring(heroOpacityRaw, {
        stiffness: 130,
        damping: 28,
        mass: 0.42,
    });
    const heroTranslateYRaw = useTransform(
        scrollY,
        [0, 120, 420],
        [0, 0, prefersReducedMotion ? 0 : -30]
    );
    const heroTranslateY = useSpring(heroTranslateYRaw, {
        stiffness: 140,
        damping: 30,
        mass: 0.44,
    });
    const videoScaleRaw = useTransform(
        scrollY,
        [0, 160, 460],
        [1.08, 1.1, prefersReducedMotion ? 1.08 : 1.17]
    );
    const videoScale = useSpring(videoScaleRaw, {
        stiffness: 150,
        damping: 30,
        mass: 0.46,
    });
    const discoverScaleRaw = useTransform(
        scrollY,
        [0, 64, 280],
        [1, 1, prefersReducedMotion ? 1 : 1.34]
    );
    const discoverScale = useSpring(discoverScaleRaw, {
        stiffness: 220,
        damping: 26,
        mass: 0.4,
    });
    const discoverOpacity = useTransform(
        scrollY,
        [0, 56, 300, 430],
        [0.94, 1, 1, prefersReducedMotion ? 1 : 0]
    );
    const discoverGlowOpacity = useTransform(
        scrollY,
        [0, 80, 260],
        [0.14, 0.2, prefersReducedMotion ? 0.2 : 0.56]
    );
    const discoverTextOpacity = useTransform(
        scrollY,
        [0, 80, 260],
        [0.92, 1, 1]
    );

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (prefersReducedMotion) return;
        lastScrollAtRef.current = performance.now();
        const scrollBoost = Math.min(latest / 700, 1);
        targetPlaybackRateRef.current = latest > 2 ? 1.08 + scrollBoost * 0.12 : 1;
    });

    useEffect(() => {
        if (prefersReducedMotion) return;

        let rafId = 0;

        const tick = () => {
            const video = videoRef.current;
            if (video) {
                if (performance.now() - lastScrollAtRef.current > 160) {
                    targetPlaybackRateRef.current = 1;
                }

                const currentRate = video.playbackRate || 1;
                const smoothedRate = currentRate + (targetPlaybackRateRef.current - currentRate) * 0.18;
                video.playbackRate = Math.min(1.22, Math.max(1, smoothedRate));
            }

            rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(rafId);
    }, [prefersReducedMotion]);

    const scrollToFirstSection = () => {
        const firstSection = document.getElementById("como-funciona");
        if (firstSection) {
            firstSection.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    };

    return (
        <>
            <motion.section
                style={{ opacity: heroOpacity, y: heroTranslateY }}
                className="min-h-[100dvh] md:h-screen w-full relative bg-white flex flex-col overflow-hidden touch-pan-y"
            >
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <motion.video
                        ref={videoRef}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        src="/hero-lines-loop-cropped.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        aria-hidden="true"
                        style={{ scale: videoScale }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/58 to-white/88" />
                    <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_42%,rgba(255,255,255,0.02),rgba(255,255,255,0.82))]" />
                    <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#E0E0E0]/80 blur-3xl" />
                    <div className="absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-[#F2F2F2]/85 blur-3xl" />
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
            </motion.section>

            {/* Scroll indicator */}
            <div className="fixed inset-x-0 bottom-4 md:bottom-6 z-30 flex justify-center pointer-events-none">
                <motion.button
                    type="button"
                    onClick={scrollToFirstSection}
                    aria-label="Descer para a próxima seção"
                    className="pointer-events-auto w-fit flex flex-col items-center gap-1 px-2 py-1 text-[#111111] hover:text-black transition-colors touch-manipulation"
                    style={{ scale: discoverScale, opacity: discoverOpacity }}
                >
                    <motion.span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ opacity: discoverTextOpacity }}
                    >
                        Descubra
                    </motion.span>
                    <motion.div
                        className="relative"
                        style={{ opacity: discoverGlowOpacity }}
                        animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ChevronDown className="w-4 h-4 relative z-10" />
                    </motion.div>
                </motion.button>
            </div>
        </>
    );
}
