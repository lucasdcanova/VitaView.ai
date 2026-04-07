import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    FileKey,
    Fingerprint,
    Lock,
    Server,
    ShieldCheck,
} from "lucide-react";

const securityStates = [
    {
        id: "access",
        label: "Acesso",
        icon: <Fingerprint className="w-5 h-5" />,
        items: ["WebAuthn / biometria", "TOTP habilitável", "Códigos de backup"],
        meta: "Fator adicional disponível",
        logs: ["Dispositivo verificado", "Sessão renovada", "Acesso autorizado"],
    },
    {
        id: "app",
        label: "Aplicação",
        icon: <ShieldCheck className="w-5 h-5" />,
        items: ["WAF ativo", "Rate limiting", "CSP + Helmet"],
        meta: "Borda monitorada",
        logs: ["Regra aplicada", "Payload validado", "Requisição normalizada"],
    },
    {
        id: "files",
        label: "Arquivos",
        icon: <FileKey className="w-5 h-5" />,
        items: ["S3 para arquivos sensíveis", "AES256 no servidor", "URL assinada temporária"],
        meta: "Armazenamento protegido",
        logs: ["Upload cifrado", "URL temporária gerada", "Documento isolado"],
    },
];

const proofItems = [
    {
        icon: <Fingerprint className="w-4 h-4" />,
        title: "Acesso reforçado",
        description: "Biometria/WebAuthn e TOTP disponíveis para reforçar o login.",
    },
    {
        icon: <Lock className="w-4 h-4" />,
        title: "Sessões e transporte protegidos",
        description: "Cookies restritos, sessões seguras e TLS/HTTPS no transporte.",
    },
    {
        icon: <Server className="w-4 h-4" />,
        title: "Defesa ativa da aplicação",
        description: "WAF, rate limiting e proteção de rotas para reduzir superfície de ataque.",
    },
];

export function LandingSecurity() {
    const [activeState, setActiveState] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveState((current) => (current + 1) % securityStates.length);
        }, 3200);

        return () => clearInterval(timer);
    }, []);

    const currentState = securityStates[activeState];

    return (
        <section id="seguranca" className="py-10 md:py-20 bg-white relative overflow-hidden md:min-h-[100dvh] flex flex-col justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col-reverse lg:flex-row-reverse items-center gap-8 lg:gap-14">
                    <motion.div
                        className="lg:w-[46%] w-full max-w-md lg:max-w-none"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.24em] text-[#666666]">
                            <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-[#9E9E9E]" />
                            <ShieldCheck className="w-3.5 h-3.5 text-[#212121]" />
                            <span>Controles ativos na operação</span>
                            <span aria-hidden="true" className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-[#9E9E9E]" />
                        </div>

                        <h2 className="mt-5 text-3xl sm:text-4xl md:text-[3.15rem] md:whitespace-nowrap font-heading font-bold text-[#212121] leading-[1.02] tracking-tight">
                            Segurança <span className="text-[#9E9E9E]">Inegociável.</span>
                        </h2>

                        <p className="mt-5 max-w-xl text-base md:text-[17px] leading-relaxed text-[#616161]">
                            A proteção no VitaView não depende de uma única barreira. Ela se distribui entre acesso,
                            sessão, aplicação e armazenamento de documentos sensíveis, com controles presentes no fluxo da plataforma.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-3 md:hidden">
                            {proofItems.map((item) => (
                                <div key={item.title} className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9E9E9E]">{item.title}</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[#616161]">{item.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block mt-6 space-y-3">
                            {proofItems.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 + index * 0.08 }}
                                    className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#212121] border border-[#E0E0E0]">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#212121]">{item.title}</h3>
                                            <p className="mt-1 text-sm leading-relaxed text-[#616161]">{item.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-[54%] w-full"
                        initial={{ opacity: 0, x: -20, scale: 0.98 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.12 }}
                    >
                        <div className="relative max-w-[560px] mx-auto">
                            <div className="absolute -inset-2 bg-[#EAEAEA] rounded-[32px] blur-3xl opacity-70" />

                            <div className="relative overflow-hidden rounded-[28px] border border-[#DCDCDC] bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.18)]">
                                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-4 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                                            <ShieldCheck className="w-5 h-5 text-white/85" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Painel de Segurança</p>
                                            <p className="text-xs text-white/45">Controles ativos dentro da plataforma</p>
                                        </div>
                                    </div>

                                    <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                                        Monitorado
                                    </div>
                                </div>

                                <div className="border-b border-white/10 px-4 py-3 sm:px-5">
                                    <div className="grid grid-cols-3 gap-2">
                                        {securityStates.map((state, index) => (
                                            <div
                                                key={state.id}
                                                className={`rounded-xl border px-3 py-2 text-center transition-all ${
                                                    index === activeState
                                                        ? "border-white/20 bg-white/[0.10] text-white"
                                                        : "border-white/10 bg-white/[0.03] text-white/45"
                                                }`}
                                            >
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{state.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentState.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }}
                                            transition={{ duration: 0.28 }}
                                            className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-white"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                                                        {currentState.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">{currentState.label}</p>
                                                        <p className="text-xs text-white/45">{currentState.meta}</p>
                                                    </div>
                                                </div>

                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                                                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {currentState.items.map((item, index) => (
                                                    <motion.div
                                                        key={item}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.06 * index }}
                                                        className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
                                                    >
                                                        <p className="text-[11px] leading-snug text-white/78">{item}</p>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <div className="mt-4 rounded-2xl border border-white/10 bg-[#161616] p-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                                                        Status do momento
                                                    </p>
                                                    <span className="text-xs font-semibold text-emerald-400">OK</span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {currentState.logs.map((item, index) => (
                                                        <motion.div
                                                            key={item}
                                                            initial={{ opacity: 0, y: 6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.05 * index }}
                                                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65"
                                                        >
                                                            {item}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                    <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-white"
                                            animate={{ width: `${((activeState + 1) / securityStates.length) * 100}%` }}
                                            transition={{ duration: 0.35 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
