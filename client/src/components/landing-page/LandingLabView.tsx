import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { LineChart, ArrowRight, Upload, FileText, Brain, CheckCircle2, Sparkles, FileUp, Zap } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { tokens } from "./landing-tokens";

type TrendBarProps = {
    delay: number;
    isActive: boolean;
    prefersReducedMotion: boolean;
    tone: "soft" | "solid";
    value: string;
    width: `${number}%` | string;
};

function TrendBar({ delay, isActive, prefersReducedMotion, tone, value, width }: TrendBarProps) {
    const barClasses = tone === "solid"
        ? "bg-white text-black"
        : "bg-white/30 text-white";

    return (
        <div className="flex-1 bg-white/10 rounded-full h-5 relative overflow-hidden">
            <motion.div
                className={`${barClasses} h-full rounded-full flex items-center justify-end pr-2 relative overflow-hidden`}
                initial={prefersReducedMotion ? false : { width: 0, opacity: 0.86, filter: "blur(1.5px)" }}
                animate={isActive ? { width, opacity: 1, filter: "blur(0px)" } : { width: 0, opacity: 0.86, filter: "blur(1.5px)" }}
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.95, delay, ease: [0.22, 1, 0.36, 1] }
                }
            >
                {!prefersReducedMotion && (
                    <motion.span
                        aria-hidden="true"
                        className={`absolute inset-y-0 -left-8 w-10 ${
                            tone === "solid"
                                ? "bg-gradient-to-r from-transparent via-[#f5f5f5]/70 to-transparent"
                                : "bg-gradient-to-r from-transparent via-white/45 to-transparent"
                        }`}
                        initial={{ x: "-120%" }}
                        animate={isActive ? { x: "240%" } : { x: "-120%" }}
                        transition={{ duration: 1.08, delay: delay + 0.28, ease: [0.4, 0, 0.2, 1] }}
                    />
                )}
                <span className="relative z-10 text-[10px] font-semibold">{value}</span>
            </motion.div>
        </div>
    );
}

/* ── Falling File Icon ── */
function FallingFile({ delay, fileName, onLand }: { delay: number; fileName: string; onLand?: () => void }) {
    return (
        <motion.div
            className="absolute left-1/2 flex flex-col items-center gap-0.5 pointer-events-none"
            style={{ x: "-50%" }}
            initial={{ y: -60, opacity: 0, rotate: -8 }}
            animate={{ y: 0, opacity: [0, 1, 1, 0.8], rotate: [-8, 3, -2, 0], scale: [0.85, 1, 1, 0.9] }}
            transition={{
                duration: 0.7,
                delay,
                ease: [0.22, 1, 0.36, 1],
                opacity: { duration: 0.7, delay, times: [0, 0.2, 0.8, 1] },
            }}
            onAnimationComplete={onLand}
        >
            <div className="w-9 h-11 md:w-10 md:h-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col items-center justify-center shadow-lg shadow-black/30">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
                <span className="text-[6px] md:text-[7px] text-white/40 mt-0.5 font-medium">.PDF</span>
            </div>
            <span className="text-[7px] md:text-[8px] text-white/40 whitespace-nowrap max-w-[80px] truncate">{fileName}</span>
        </motion.div>
    );
}

/* ── Upload Animation Panel ── */
const FILE_BATCHES = [
    [
        { name: "hemograma_recente.pdf", size: "1.2 MB" },
        { name: "perfil_lipidico.pdf", size: "840 KB" },
    ],
    [
        { name: "glicemia_controle.pdf", size: "956 KB" },
        { name: "urina_tipo1.pdf", size: "1.1 MB" },
    ],
    [
        { name: "tsh_t4livre.pdf", size: "720 KB" },
        { name: "coagulograma.pdf", size: "1.4 MB" },
    ],
];

const MOBILE_LAB_SUMMARY = [
    { title: "Hemoglobina", description: "Comparativo rápido entre exames anteriores e o resultado atual.", tone: "text-emerald-300" },
    { title: "Glicemia", description: "Sinalização de atenção quando a evolução foge do padrão esperado.", tone: "text-amber-300" },
    { title: "Evolução", description: "Histórico consolidado para revisar o caso sem abrir várias telas.", tone: "text-white/80" },
];

function UploadAnimationPanel({
    isActive,
    prefersReducedMotion,
    mobileCompact = false,
}: {
    isActive: boolean;
    prefersReducedMotion: boolean;
    mobileCompact?: boolean;
}) {
    const [step, setStep] = useState(0);
    const [cycle, setCycle] = useState(0);
    const [showFallingFiles, setShowFallingFiles] = useState(false);
    const stableMobileMotion = prefersReducedMotion || mobileCompact;
    // step: 0 = idle/files falling, 1 = files landed, 2 = uploading, 3 = AI processing, 4 = done

    const currentFiles = FILE_BATCHES[cycle % FILE_BATCHES.length];
    useEffect(() => {
        if (!isActive) return;
        if (prefersReducedMotion) {
            setStep(4);
            return;
        }

        let cancelled = false;
        const CYCLE_DURATION = 8500; // total cycle length

        function runCycle() {
            if (cancelled) return;
            setStep(0);
            setShowFallingFiles(true);

            const timers = [
                setTimeout(() => { if (!cancelled) setStep(1); }, 900),
                setTimeout(() => { if (!cancelled) { setStep(2); setShowFallingFiles(false); } }, 1800),
                setTimeout(() => { if (!cancelled) setStep(3); }, 3400),
                setTimeout(() => { if (!cancelled) setStep(4); }, 5200),
                setTimeout(() => {
                    if (!cancelled) {
                        setCycle(prev => prev + 1);
                    }
                }, CYCLE_DURATION),
            ];

            return () => timers.forEach(clearTimeout);
        }

        const cleanup = runCycle();
        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [isActive, prefersReducedMotion, cycle]);

    return (
        <div className="h-full flex flex-col">
            {/* Upload Header */}
            <div className="bg-[#111111] p-3 md:p-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <FileUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-base font-bold text-white">Envio de exames</h3>
                        <p className="text-[10px] md:text-xs text-[#9E9E9E]">Arraste arquivos para análise automática</p>
                    </div>
                </div>
            </div>

            {/* Upload Body */}
            <div className="flex-1 p-3 md:p-4 flex flex-col gap-3">
                {/* Drop Zone */}
                <motion.div
                    className="relative rounded-xl border-2 border-dashed p-4 md:p-5 flex flex-col items-center justify-center text-center min-h-[110px] md:min-h-[130px] overflow-hidden"
                    animate={{
                        borderColor: step === 0 && showFallingFiles
                            ? ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.15)"]
                            : step === 1
                            ? "rgba(255,255,255,0.4)"
                            : step === 4
                            ? "rgba(52,211,153,0.3)"
                            : "rgba(255,255,255,0.12)",
                        backgroundColor: step === 1
                            ? "rgba(255,255,255,0.06)"
                            : step === 4
                            ? "rgba(52,211,153,0.04)"
                            : "rgba(255,255,255,0.02)",
                    }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Falling file icons */}
                    <AnimatePresence>
                        {showFallingFiles && step === 0 && (
                            <>
                                <motion.div
                                    key={`fall-left-${cycle}`}
                                    className="absolute pointer-events-none"
                                    style={{ left: "28%", top: 0 }}
                                    initial={{ y: -70, opacity: 0, rotate: -12 }}
                                    animate={stableMobileMotion
                                        ? { y: [-70, 10, 4], opacity: [0, 1, 1], rotate: [-12, 4, 0] }
                                        : {
                                            y: [-70, 10, 4],
                                            opacity: [0, 1, 1],
                                            rotate: [-12, 4, 0],
                                        }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        duration: 0.65,
                                        delay: 0.1,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <div className="w-9 h-11 md:w-10 md:h-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col items-center justify-center shadow-lg shadow-black/40 relative">
                                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
                                        <span className="text-[6px] md:text-[7px] text-white/50 mt-0.5 font-medium">.PDF</span>
                                        {/* Landing ripple */}
                                        {!stableMobileMotion && (
                                            <motion.div
                                                className="absolute -bottom-1 left-1/2 w-12 h-2 bg-white/10 rounded-full"
                                                style={{ x: "-50%" }}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0, 1.5], opacity: [0, 0.5, 0] }}
                                                transition={{ duration: 0.4, delay: 0.65 }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[7px] text-white/40 text-center mt-0.5 block max-w-[70px] truncate">{currentFiles[0]?.name}</span>
                                </motion.div>

                                <motion.div
                                    key={`fall-right-${cycle}`}
                                    className="absolute pointer-events-none"
                                    style={{ right: "25%", top: 0 }}
                                    initial={{ y: -70, opacity: 0, rotate: 10 }}
                                    animate={{
                                        y: [-70, 14, 8],
                                        opacity: [0, 1, 1],
                                        rotate: [10, -3, 0],
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        duration: 0.65,
                                        delay: 0.35,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <div className="w-9 h-11 md:w-10 md:h-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col items-center justify-center shadow-lg shadow-black/40 relative">
                                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
                                        <span className="text-[6px] md:text-[7px] text-white/50 mt-0.5 font-medium">.PDF</span>
                                        {!stableMobileMotion && (
                                            <motion.div
                                                className="absolute -bottom-1 left-1/2 w-12 h-2 bg-white/10 rounded-full"
                                                style={{ x: "-50%" }}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0, 1.5], opacity: [0, 0.5, 0] }}
                                                transition={{ duration: 0.4, delay: 0.9 }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[7px] text-white/40 text-center mt-0.5 block max-w-[70px] truncate">{currentFiles[1]?.name}</span>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Center status content */}
                    <AnimatePresence mode="wait">
                        {step === 0 && !showFallingFiles && (
                            <motion.div
                                key={`idle-${cycle}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-1.5"
                            >
                                {stableMobileMotion ? (
                                    <Upload className="w-6 h-6 text-white/30" />
                                ) : (
                                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                                        <Upload className="w-6 h-6 text-white/30" />
                                    </motion.div>
                                )}
                                <span className="text-[10px] text-white/40">Aguardando arquivos...</span>
                            </motion.div>
                        )}
                        {step === 0 && showFallingFiles && (
                            <motion.div
                                key={`landing-${cycle}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col items-center gap-1 mt-14 md:mt-16"
                            >
                                <span className="text-[10px] text-white/50 font-medium">{currentFiles.length} arquivos recebidos</span>
                            </motion.div>
                        )}
                        {step === 1 && (
                            <motion.div
                                key={`detected-${cycle}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center gap-1.5"
                            >
                                {stableMobileMotion ? (
                                    <FileText className="w-7 h-7 text-white/70" />
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: [0.8, 1.1, 1] }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <FileText className="w-7 h-7 text-white/70" />
                                    </motion.div>
                                )}
                                <span className="text-xs text-white/70 font-medium">{currentFiles.length} arquivos detectados</span>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div
                                key={`uploading-${cycle}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                                    <Zap className="w-7 h-7 text-amber-400" />
                                </motion.div>
                                <span className="text-xs text-amber-300/90 font-medium">Enviando arquivos...</span>
                                {/* Progress bar */}
                                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-400/70 rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.4, ease: "easeInOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div
                                key={`analyzing-${cycle}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                {stableMobileMotion ? (
                                    <Brain className="w-7 h-7 text-purple-400" />
                                ) : (
                                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}>
                                        <Brain className="w-7 h-7 text-purple-400" />
                                    </motion.div>
                                )}
                                <span className="text-xs text-purple-300/90 font-medium">Estruturando resultados...</span>
                                {/* Scanning dots */}
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-purple-400"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {step === 4 && (
                            <motion.div
                                key={`done-${cycle}`}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                className="flex flex-col items-center gap-1.5"
                            >
                                {stableMobileMotion ? (
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.3, 1] }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </motion.div>
                                )}
                                <span className="text-xs text-emerald-300 font-semibold">Integrado ao prontuário!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* File List */}
                <div className="space-y-2">
                    <AnimatePresence mode="wait">
                        {currentFiles.map((file, i) => (
                            <motion.div
                                key={`${file.name}-${cycle}`}
                                className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                                initial={{ opacity: 0, x: -16, y: 4 }}
                                animate={step >= 1
                                    ? { opacity: 1, x: 0, y: 0 }
                                    : { opacity: 0, x: -16, y: 4 }
                                }
                                exit={{ opacity: 0, x: 12, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.35, delay: i * 0.1 }}
                            >
                                <FileText className="w-4 h-4 text-white/50 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] md:text-xs text-white/80 font-medium truncate">{file.name}</p>
                                    <p className="text-[10px] text-white/30">{file.size}</p>
                                </div>
                                <AnimatePresence mode="wait">
                                    {step === 2 && (
                                        <motion.div
                                            key="spin"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            className="flex-shrink-0"
                                        >
                                            <motion.div
                                                className="w-4 h-4 rounded-full border-2 border-amber-400/40 border-t-amber-400"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 3 && (
                                        <motion.div
                                            key="sparkle"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            className="flex-shrink-0"
                                        >
                                            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                            </motion.div>
                                        </motion.div>
                                    )}
                                    {step >= 4 && (
                                        <motion.div
                                            key="check"
                                            initial={{ opacity: 0, scale: 0.3 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                            className="flex-shrink-0"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export function LandingLabView() {
    const analyzerRef = useRef<HTMLDivElement | null>(null);
    const isAnalyzerInView = useInView(analyzerRef, {
        once: true,
        amount: 0.22,
        margin: "0px 0px -12% 0px",
    });
    const prefersReducedMotion = useReducedMotion() ?? false;

    return (
        <section id="como-funciona" aria-labelledby="como-funciona-heading" className={`${tokens.section.dark} ${tokens.section.paddingFull} relative overflow-hidden`}>
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute left-0 top-20 w-72 h-72 bg-white rounded-full opacity-5 blur-3xl"></div>
                <div className="absolute right-0 bottom-20 w-80 h-80 bg-white rounded-full opacity-5 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12 md:mb-16"
                >
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className={tokens.eyebrow.lineDark} />
                        <span className={tokens.eyebrow.dark}>Exames integrados ao prontuário</span>
                        <span className={tokens.eyebrow.lineDark} />
                    </div>

                    <h2 id="como-funciona-heading" className={`${tokens.h2.dark} mb-6 max-w-4xl mx-auto`}>
                        Envie exames,{" "}
                        <span className={tokens.h2.splitDark}>tudo entra estruturado.</span>
                    </h2>
                    <p className={`${tokens.body.dark} max-w-2xl mx-auto`}>
                        Arraste PDFs ou imagens de exames e o VitaView extrai, interpreta e integra todos os resultados
                        diretamente no prontuário do paciente — com gráficos de evolução automáticos.
                    </p>
                </motion.div>

                {/* Two-panel layout */}
                <motion.div
                    className="max-w-6xl mx-auto"
                    ref={analyzerRef}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                    animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.62, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
                    }
                >
                    <div className="md:hidden space-y-4">
                        <motion.div
                            className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                            animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }
                            }
                        >
                            <UploadAnimationPanel
                                isActive={isAnalyzerInView}
                                prefersReducedMotion={prefersReducedMotion}
                                mobileCompact
                            />
                        </motion.div>

                        <motion.div
                            className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                            animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }
                            }
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                                    <LineChart className="w-4 h-4 text-white/78" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                                        O que aparece na revisão
                                    </p>
                                    <p className="text-sm font-semibold text-white">
                                        Tudo pronto para retomar o caso
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {MOBILE_LAB_SUMMARY.map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-[18px] border border-white/8 bg-black/30 px-4 py-3"
                                    >
                                        <p className={`text-sm font-semibold ${item.tone}`}>
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-[12px] leading-5 text-white/65">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                        {/* LEFT — Upload & AI Processing Panel */}
                        <motion.div
                            className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                            initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                            animate={isAnalyzerInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
                            }
                        >
                            <UploadAnimationPanel
                                isActive={isAnalyzerInView}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        </motion.div>

                        {/* RIGHT — Compact Analysis Results Panel */}
                        <motion.div
                            className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                            animate={isAnalyzerInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }
                            }
                        >
                            {/* Analyzer Header */}
                            <div className="bg-[#111111] p-3 md:p-4 text-white border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <LineChart className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm md:text-base font-bold text-white">Análise Comparativa</h3>
                                            <p className="text-[10px] md:text-xs text-[#9E9E9E]">Paciente: Maria Silva — Últimos 6 meses</p>
                                        </div>
                                    </div>
                                    <button className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] md:text-xs font-medium transition-colors text-white hidden sm:block">
                                        Exportar PDF
                                    </button>
                                </div>
                            </div>

                            {/* Lab Results Grid — 2x2 */}
                            <div className="p-3 md:p-4">
                                <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                                    {/* Hemoglobina */}
                                    <motion.div
                                        className="bg-white/5 rounded-xl p-2.5 md:p-3 border border-white/10"
                                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                        animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                        transition={
                                            prefersReducedMotion
                                                ? { duration: 0 }
                                                : { duration: 0.48, delay: 0.24, ease: [0.22, 1, 0.36, 1] }
                                        }
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs md:text-sm font-bold text-white">Hemoglobina</h4>
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] md:text-[10px] font-semibold border border-emerald-500/30">
                                                Normal
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Mar</span>
                                                <TrendBar delay={0.32} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="soft" value="13.2" width="75%" />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Abr</span>
                                                <TrendBar delay={0.38} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="solid" value="14.2" width="80%" />
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                                            <span className="text-emerald-400 font-semibold">↗ +7.6%</span>
                                            <span className="text-[#9E9E9E] hidden md:inline">vs. anterior</span>
                                        </div>
                                    </motion.div>

                                    {/* Glicemia */}
                                    <motion.div
                                        className="bg-white/5 rounded-xl p-2.5 md:p-3 border border-white/10"
                                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                        animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                        transition={
                                            prefersReducedMotion
                                                ? { duration: 0 }
                                                : { duration: 0.48, delay: 0.3, ease: [0.22, 1, 0.36, 1] }
                                        }
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs md:text-sm font-bold text-white">Glicemia</h4>
                                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[9px] md:text-[10px] font-semibold border border-amber-500/30">
                                                Atenção
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Mar</span>
                                                <TrendBar delay={0.36} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="soft" value="102" width="85%" />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Abr</span>
                                                <TrendBar delay={0.42} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="solid" value="108" width="90%" />
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                                            <span className="text-amber-400 font-semibold">↗ +5.9%</span>
                                            <span className="text-[#9E9E9E] hidden md:inline">vs. anterior</span>
                                        </div>
                                    </motion.div>

                                    {/* Colesterol */}
                                    <motion.div
                                        className="bg-white/5 rounded-xl p-2.5 md:p-3 border border-white/10"
                                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                        animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                        transition={
                                            prefersReducedMotion
                                                ? { duration: 0 }
                                                : { duration: 0.48, delay: 0.36, ease: [0.22, 1, 0.36, 1] }
                                        }
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs md:text-sm font-bold text-white">Colesterol</h4>
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] md:text-[10px] font-semibold border border-emerald-500/30">
                                                Normal
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Mar</span>
                                                <TrendBar delay={0.4} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="soft" value="195" width="78%" />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Abr</span>
                                                <TrendBar delay={0.46} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="solid" value="180" width="72%" />
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                                            <span className="text-emerald-400 font-semibold">↘ -7.7%</span>
                                            <span className="text-[#9E9E9E] hidden md:inline">vs. anterior</span>
                                        </div>
                                    </motion.div>

                                    {/* Creatinina */}
                                    <motion.div
                                        className="bg-white/5 rounded-xl p-2.5 md:p-3 border border-white/10"
                                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                        animate={isAnalyzerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                                        transition={
                                            prefersReducedMotion
                                                ? { duration: 0 }
                                                : { duration: 0.48, delay: 0.42, ease: [0.22, 1, 0.36, 1] }
                                        }
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs md:text-sm font-bold text-white">Creatinina</h4>
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] md:text-[10px] font-semibold border border-emerald-500/30">
                                                Normal
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Mar</span>
                                                <TrendBar delay={0.44} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="soft" value="0.9" width="65%" />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-[#9E9E9E] w-7">Abr</span>
                                                <TrendBar delay={0.5} isActive={isAnalyzerInView} prefersReducedMotion={prefersReducedMotion} tone="solid" value="0.92" width="67%" />
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                                            <span className="text-white/50 font-semibold">→ +2.2%</span>
                                            <span className="text-[#9E9E9E] hidden md:inline">vs. anterior</span>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Connection Arrow between panels (desktop only) */}
                    <div className="hidden lg:flex items-center justify-center -mt-[calc(50%+1.25rem)] absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ display: 'none' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isAnalyzerInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: 0.6, duration: 0.3 }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20"
                        >
                            <ArrowRight className="w-5 h-5 text-white/60" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    className="mt-10 md:mt-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/auth?tab=register">
                        <button
                            className="bg-white hover:bg-[#E0E0E0] text-[#111111] font-bold py-3 px-8 rounded-lg shadow-lg text-base transition-colors w-full sm:w-auto"
                        >
                            Experimentar na prática
                            <ArrowRight className="ml-2 h-5 w-5 inline text-[#111111]" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
