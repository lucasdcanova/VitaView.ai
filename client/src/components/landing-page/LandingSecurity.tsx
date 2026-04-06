import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Cloud,
    Database,
    FileKey,
    Fingerprint,
    Lock,
    Server,
    ShieldCheck,
    Smartphone,
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
        description: "Base para biometria/WebAuthn e autenticação TOTP dentro da plataforma.",
    },
    {
        icon: <Lock className="w-4 h-4" />,
        title: "Sessões e transporte protegidos",
        description: "Cookies restritos, sessões seguras, TLS/HTTPS e políticas rígidas de navegação.",
    },
    {
        icon: <Server className="w-4 h-4" />,
        title: "Defesa ativa da aplicação",
        description: "WAF, detecção de padrões suspeitos e limites por endpoint para reduzir abuso e ataque automatizado.",
    },
    {
        icon: <Cloud className="w-4 h-4" />,
        title: "Arquivos sensíveis isolados",
        description: "Armazenamento em S3 com criptografia no servidor e acesso temporário por URL assinada.",
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
        <section id="seguranca" className="py-12 md:py-20 bg-white relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                    <motion.div
                        className="lg:w-[46%]"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-[#F7F7F7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#424242]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#212121]" />
                            Segurança Operacional
                        </span>

                        <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-[1.06] tracking-tight">
                            Segurança <br />
                            <span className="text-[#9E9E9E]">Inegociável.</span>
                        </h2>

                        <p className="mt-5 max-w-xl text-base md:text-lg leading-relaxed text-[#616161]">
                            A proteção no VitaView não depende de uma única barreira. Ela se distribui entre acesso,
                            sessão, aplicação e armazenamento de documentos sensíveis, com recursos já presentes na plataforma.
                        </p>

                        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {proofItems.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 + index * 0.08 }}
                                    className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4"
                                >
                                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#212121] border border-[#E0E0E0]">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-sm font-bold text-[#212121]">{item.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#616161]">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#E0E0E0] bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#212121]">
                                    <Database className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#212121]">Governança e rastreabilidade</h4>
                                    <p className="mt-1 text-sm leading-relaxed text-[#616161]">
                                        O cadastro já registra consentimentos, e a base prevê trilhas de auditoria e registros
                                        de incidentes para operações sensíveis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-[54%] w-full"
                        initial={{ opacity: 0, x: 20, scale: 0.98 }}
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

                                <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-5">
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

                                            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                                                    Controles visíveis
                                                </p>
                                                <div className="mt-3 space-y-2">
                                                    {currentState.items.map((item, index) => (
                                                        <motion.div
                                                            key={item}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.08 * index }}
                                                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                                                        >
                                                            <span className="text-sm text-white/85">{item}</span>
                                                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-2xl border border-white/10 bg-[#161616] p-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                                                    Eventos recentes
                                                </p>
                                                <div className="mt-3 space-y-2">
                                                    {currentState.logs.map((item, index) => (
                                                        <motion.div
                                                            key={item}
                                                            initial={{ opacity: 0, y: 6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.06 * index }}
                                                            className="flex items-center gap-2 text-sm text-white/70"
                                                        >
                                                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/55" />
                                                            {item}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
                                                    <Smartphone className="w-4 h-4 text-white/80" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Acesso</p>
                                                    <p className="text-sm font-semibold text-white">Controle por fator adicional</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
                                                    <Server className="w-4 h-4 text-white/80" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Aplicação</p>
                                                    <p className="text-sm font-semibold text-white">WAF, CSP e limites por rota</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
                                                    <Cloud className="w-4 h-4 text-white/80" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Arquivos</p>
                                                    <p className="text-sm font-semibold text-white">S3 com acesso temporário assinado</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-[#161616] p-4 text-white">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Camadas visíveis</span>
                                                <span className="text-sm font-bold text-white">{securityStates.length}</span>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-white"
                                                    animate={{ width: `${((activeState + 1) / securityStates.length) * 100}%` }}
                                                    transition={{ duration: 0.35 }}
                                                />
                                            </div>
                                            <p className="mt-3 text-xs leading-relaxed text-white/55">
                                                Segurança distribuída entre acesso, aplicação e dados, em vez de uma promessa genérica isolada.
                                            </p>
                                        </div>
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
