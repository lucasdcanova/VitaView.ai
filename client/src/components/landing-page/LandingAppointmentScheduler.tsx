import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronRight, Brain, Check } from "lucide-react";
import { Link } from "wouter";

export function LandingAppointmentScheduler() {
    return (
        <section id="agenda" className="py-10 md:py-14 bg-[#F5F5F5] text-[#212121] relative overflow-hidden scroll-mt-16 min-h-[100dvh] flex flex-col justify-center">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-6 md:mb-8"
                >
                    <h2 className="text-2xl md:text-4xl font-bold text-[#212121] mb-3 md:mb-4">Agenda Inteligente</h2>
                    <p className="text-base md:text-lg text-[#616161] max-w-2xl mx-auto px-2">
                        Visualize consultas, horários livres e prioridades em uma única agenda, com apoio de IA para organizar sua rotina clínica.
                    </p>
                </motion.div>

                {/* Mobile Simplified Calendar View */}
                <motion.div
                    className="md:hidden bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-4 text-white flex items-center gap-3">
                        <Calendar className="w-5 h-5" />
                        <div>
                            <h3 className="text-base font-bold">Abril 2025</h3>
                            <p className="text-xs text-[#E0E0E0]">Próximas consultas</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            { time: "09:00", name: "Maria Silva", type: "Consulta", color: "border-[#3B82F6]", bg: "bg-[#E8F1FB]" },
                            { time: "14:30", name: "João Santos", type: "Retorno", color: "border-[#22C55E]", bg: "bg-[#EAF7EE]" },
                            { time: "10:00", name: "Ana Costa", type: "Exames", color: "border-[#F59E0B]", bg: "bg-[#FFF4E5]" },
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
                </motion.div>

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
                                        <h3 className="text-xl font-bold">Abril 2025</h3>
                                        <p className="text-sm text-[#E0E0E0]">Semana 14 - 20 de Abril</p>
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
                                        className="bg-[#E8F1FB] border-l-4 border-[#3B82F6] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">09:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Maria Silva</div>
                                        <div className="text-xs text-[#212121]">Consulta</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-[#EAF7EE] border-l-4 border-[#22C55E] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
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
                                        className="bg-[#FFF4E5] border-l-4 border-[#F59E0B] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
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
                                        className="bg-[#FDECEC] border-l-4 border-[#EF4444] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">08:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Pedro Lima</div>
                                        <div className="text-xs text-[#424242]">Urgência</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-[#E8F1FB] border-l-4 border-[#3B82F6] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">11:00</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Carla Mendes</div>
                                        <div className="text-xs text-[#212121]">Consulta</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-[#EAF7EE] border-l-4 border-[#22C55E] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
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
                                        className="bg-[#E8F1FB] border-l-4 border-[#3B82F6] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                                        whileHover={{ scale: 1.012 }}
                                    >
                                        <div className="text-xs font-semibold text-[#212121]">09:30</div>
                                        <div className="text-xs font-medium text-[#212121] mt-1">Lucia Alves</div>
                                        <div className="text-xs text-[#212121]">Consulta</div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-[#FFF4E5] border-l-4 border-[#F59E0B] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
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
                                        className="bg-[#EAF7EE] border-l-4 border-[#22C55E] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
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
                            <div className="mt-5 flex flex-wrap gap-4 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#3B82F6] rounded"></div>
                                    <span className="text-xs text-[#9E9E9E]">Consulta</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#22C55E] rounded"></div>
                                    <span className="text-xs text-[#9E9E9E]">Retorno</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#F59E0B] rounded"></div>
                                    <span className="text-xs text-[#9E9E9E]">Exames</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#EF4444] rounded"></div>
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
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E] mb-1">Assistente IA</p>
                                <h4 className="text-sm font-bold text-[#212121] leading-tight mb-1">Ajuda na marcação</h4>
                                <p className="text-[11px] text-[#616161] leading-snug">
                                    Foto ou texto da agenda para sugerir encaixes.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
