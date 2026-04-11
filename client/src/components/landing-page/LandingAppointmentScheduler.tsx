import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronRight, Brain, Check } from "lucide-react";
import { Link } from "wouter";
import { tokens } from "./landing-tokens";

const mobileAgendaSignals = [
    { title: "Retornos do dia", description: "Paciente, horário e contexto principal visíveis sem abrir outra tela." },
    { title: "Encaixes e urgências", description: "As prioridades aparecem rápido para reorganizar a agenda no celular." },
    { title: "Rotina contínua", description: "Consultas, retornos e exames ficam no mesmo fluxo de acompanhamento." },
];

export function LandingAppointmentScheduler() {
    return (
        <section id="agenda" className={`${tokens.section.lightAlt} ${tokens.section.paddingFull} text-[#212121] relative overflow-hidden scroll-mt-16`}>
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-12 md:mb-16 max-w-3xl mx-auto"
                >
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className={tokens.eyebrow.lineLight} />
                        <span className={tokens.eyebrow.light}>Visão geral da rotina</span>
                        <span className={tokens.eyebrow.lineLight} />
                    </div>
                    <h2 className={`${tokens.h2.light} mb-6`}>
                        Agenda que organiza{" "}
                        <span className={tokens.h2.splitLight}>sem atrapalhar.</span>
                    </h2>
                    <p className={`${tokens.body.light} max-w-2xl mx-auto`}>
                        Visualize consultas, horários livres e prioridades em uma única agenda, com contexto suficiente para organizar a rotina sem retrabalho.
                    </p>
                </motion.div>

                {/* Mobile Simplified Calendar View */}
                <div className="md:hidden max-w-sm mx-auto space-y-4">
                    <motion.div
                        className="bg-white rounded-2xl shadow-xl overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-4 text-white flex items-center gap-3">
                            <Calendar className="w-5 h-5" />
                            <div>
                                <h3 className="text-base font-bold">Agenda da Semana</h3>
                                <p className="text-xs text-[#E0E0E0]">Próximas consultas</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {[
                                { time: "09:00", name: "Maria Silva", type: "Consulta", color: "border-[#212121]", bg: "bg-[#F4F4F4]" },
                                { time: "14:30", name: "João Santos", type: "Retorno", color: "border-[#9E9E9E]", bg: "bg-[#F4F4F4]" },
                                { time: "10:00", name: "Ana Costa", type: "Exames", color: "border-[#616161]", bg: "bg-[#F4F4F4]" },
                            ].map((apt, i) => (
                                <div key={i} className={`${apt.bg} border-l-4 ${apt.color} rounded-lg p-3 flex items-center justify-between`}>
                                    <div>
                                        <div className="text-xs font-semibold text-[#212121]">{apt.time}</div>
                                        <div className="text-sm font-medium text-[#212121]">{apt.name}</div>
                                    </div>
                                    <span className="text-xs text-[#616161] font-medium">{apt.type}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9E9E9E]">
                                semana em andamento
                            </p>
                            <p className="mt-1 text-[13px] leading-5 text-[#616161]">
                                Retornos, exames e encaixes organizados em uma leitura só.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="grid gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.28 }}
                    >
                        {mobileAgendaSignals.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-[22px] border border-[#E0E0E0] bg-white px-4 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9E9E9E]">
                                    {item.title}
                                </p>
                                <p className="mt-1.5 text-[13px] leading-5 text-[#616161]">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: 0.35 }}
                    >
                        <Link href="/auth">
                            <button className="w-full rounded-xl bg-[#212121] px-5 py-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#424242]">
                                Organizar agenda no VitaView AI
                                <ChevronRight className="ml-2 inline h-4 w-4" />
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Desktop Full Calendar */}
                <motion.div
                    className="relative max-w-5xl mx-auto hidden md:block"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Calendar Header */}
                        <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-7 h-7" />
                                    <div>
                                        <h3 className="text-xl font-bold">Agenda da Semana</h3>
                                        <p className="text-sm text-[#E0E0E0]">Visão organizada dos próximos atendimentos</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-[#212121] rounded-lg transition-colors">
                                        <ChevronDown className="w-5 h-5 rotate-90" />
                                    </button>
                                    <button className="p-2 hover:bg-[#212121] rounded-lg transition-colors">
                                        <ChevronDown className="w-5 h-5 -rotate-90" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-4 md:p-5">
                            {/* Week Days Header */}
                            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-xs font-semibold text-[#9E9E9E] uppercase mb-2">{day}</div>
                                        <div className={`text-sm font-medium ${i === 1 ? 'text-[#212121]' : 'text-[#212121]'}`}>
                                            {14 + i}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots Grid */}
                            <div className="grid grid-cols-7 gap-1 md:gap-2">
                                {/* Sunday - Empty */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px]"></div>

                                {/* Monday - 2 appointments */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px] space-y-1 md:space-y-2">
                                    <motion.div
                                        className="bg-white border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">09:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Maria Silva</div>
                                        <div className="text-xs text-[#212121]">Consulta</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-white border-l-4 border-[#616161] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">14:30</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">João Santos</div>
                                        <div className="text-xs text-[#212121]">Retorno</div>
                                    </motion.div>
                                </div>

                                {/* Tuesday - 1 appointment */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px]">
                                    <motion.div
                                        className="bg-white border-l-4 border-[#9E9E9E] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">10:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Ana Costa</div>
                                        <div className="text-xs text-[#424242]">Exames</div>
                                    </motion.div>
                                </div>

                                {/* Wednesday - 3 appointments */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px] space-y-1 md:space-y-2">
                                    <motion.div
                                        className="bg-[#F4F4F4] border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">08:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Pedro Lima</div>
                                        <div className="text-xs text-[#424242]">Urgência</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-white border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">11:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Carla Mendes</div>
                                        <div className="text-xs text-[#212121]">Consulta</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-white border-l-4 border-[#616161] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">15:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Roberto Silva</div>
                                        <div className="text-xs text-[#212121]">Retorno</div>
                                    </motion.div>
                                </div>

                                {/* Thursday - 2 appointments */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px] space-y-1 md:space-y-2">
                                    <motion.div
                                        className="bg-white border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">09:30</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Lucia Alves</div>
                                        <div className="text-xs text-[#212121]">Consulta</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-white border-l-4 border-[#9E9E9E] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">13:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Fernando Costa</div>
                                        <div className="text-xs text-[#424242]">Exames</div>
                                    </motion.div>
                                </div>

                                {/* Friday - 1 appointment */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px]">
                                    <motion.div
                                        className="bg-white border-l-4 border-[#616161] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">10:30</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Beatriz Souza</div>
                                        <div className="text-xs text-[#212121]">Retorno</div>
                                    </motion.div>
                                </div>

                                {/* Saturday - Empty */}
                                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[110px] md:min-h-[160px]"></div>
                            </div>

                            {/* Legend */}
                            <div className="mt-5 flex flex-wrap gap-5 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-0.5 h-3 bg-[#212121]"></div>
                                    <span className="text-xs text-[#9E9E9E]">Consulta</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-0.5 h-3 bg-[#616161]"></div>
                                    <span className="text-xs text-[#9E9E9E]">Retorno</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-0.5 h-3 bg-[#9E9E9E]"></div>
                                    <span className="text-xs text-[#9E9E9E]">Exames</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-0.5 h-3 bg-[#212121]"></div>
                                    <span className="text-xs text-[#9E9E9E]">Urgência</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Footer */}
                        <div className="bg-[#F4F4F4] px-6 py-4 border-t border-[#E0E0E0] flex justify-between items-center">
                            <div className="text-sm text-[#9E9E9E]">
                                <span className="font-bold text-[#212121]">10 consultas</span> agendadas esta semana
                            </div>
                            <Link href="/auth">
                                <button className="px-6 py-3 bg-[#212121] hover:bg-[#424242] text-white rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2">
                                    <span>Nova Consulta</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    </div>

                    <motion.div
                        className="absolute right-[calc(100%+16px)] bottom-8 hidden xl:block bg-white rounded-2xl shadow-xl border border-[#E0E0E0] px-5 py-4 w-[252px] z-20"
                        animate={{
                            y: [0, 10, 0],
                        }}
                        transition={{
                            duration: 4.6,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] shrink-0">
                                <Check className="w-4.5 h-4.5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E] mb-1">Triagem</p>
                                <h4 className="text-sm font-bold text-[#212121] leading-tight mb-1">Prioridades antes da consulta</h4>
                                <p className="text-[11px] text-[#616161] leading-snug">
                                    Observações e urgência organizadas para revisão.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute left-[calc(100%+16px)] top-14 hidden xl:block bg-white rounded-2xl shadow-xl border border-[#E0E0E0] px-5 py-4 w-[252px] z-20"
                        animate={{
                            y: [0, -8, 0],
                        }}
                        transition={{
                            duration: 4.1,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: 0.4
                        }}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] shrink-0">
                                <Brain className="w-4.5 h-4.5 text-[#212121]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E] mb-1">Apoio de agenda</p>
                                <h4 className="text-sm font-bold text-[#212121] leading-tight mb-1">Ajuda na marcação</h4>
                                <p className="text-[11px] text-[#616161] leading-snug">
                                    Apoio para organizar encaixes e prioridades ao longo do dia.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
