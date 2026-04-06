import { motion } from "framer-motion";
import { Users, Stethoscope, CheckCircle2, Building, Star, Clock, ShieldCheck } from "lucide-react";

export function LandingForWhom() {
    return (
        <section id="para-quem" className="py-12 md:py-20 bg-gradient-to-r from-[#424242] to-[#212121] text-white relative overflow-hidden scroll-mt-16 min-h-[100dvh] flex flex-col justify-center">
            {/* Elementos decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute -left-20 bottom-0 w-96 h-96 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute right-0 top-1/4 w-80 h-80 bg-[#F4F4F4] rounded-full opacity-20 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                {/* Título da seção */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8 md:mb-10"
                >
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#E0E0E0] text-[#212121] mb-4">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-xs font-medium uppercase tracking-[0.12em]">Versatilidade Profissional</span>
                    </div>
                    <h2 className="text-2xl md:text-[2.5rem] font-bold text-white mb-3 md:mb-4">
                        Soluções para cada <span className="text-white">Cenário</span>
                    </h2>
                    <p className="text-[14px] md:text-[15px] text-white text-opacity-90 max-w-2xl mx-auto px-2">
                        Nossa plataforma se adapta a diferentes modelos de atuação clínica, potencializando resultados em cada contexto.
                    </p>
                </motion.div>

                {/* Cards de público-alvo - Centralizados em 3 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-8 md:mb-10 max-w-6xl mx-auto">
                    {/* Card 1: Profissional Solo */}
                    <motion.div
                        className="bg-white rounded-xl shadow-lg overflow-hidden group border border-[#E0E0E0]"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ y: -4, boxShadow: "0 20px 34px -14px rgba(0, 0, 0, 0.16)" }}
                    >
                        {/* Barra superior colorida */}
                        <div className="h-2 bg-[#212121]"></div>

                        <div className="p-5">
                            {/* Ícone com fundo */}
                            <div className="w-14 h-14 rounded-full bg-[#F4F4F4] flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Stethoscope className="h-6 w-6 text-[#212121]" />
                            </div>

                            {/* Título do card */}
                            <h3 className="text-lg font-bold text-center text-[#212121] mb-3">Vita Pro</h3>

                            {/* Lista de benefícios */}
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Prontuário inteligente automatizado</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Agenda e lembretes inteligentes</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Redução de tempo administrativo</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Card 2: Clínicas Multidisciplinares */}
                    <motion.div
                        className="bg-white rounded-xl shadow-lg overflow-hidden group border border-[#E0E0E0]"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ y: -4, boxShadow: "0 20px 34px -14px rgba(0, 0, 0, 0.16)" }}
                    >
                        {/* Barra superior colorida */}
                        <div className="h-2 bg-gradient-to-r from-[#212121] to-[#424242]"></div>

                        <div className="p-5">
                            {/* Ícone com fundo */}
                            <div className="w-14 h-14 rounded-full bg-[#F4F4F4] flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-6 w-6 text-[#424242]" />
                            </div>

                            {/* Título do card */}
                            <h3 className="text-lg font-bold text-center text-[#212121] mb-3">Vita Team</h3>

                            {/* Lista de benefícios */}
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Centralização de dados do paciente</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Compartilhamento seguro de dados</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Fluxo de trabalho otimizado</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Card 3: Hospitais */}
                    <motion.div
                        className="bg-white rounded-xl shadow-lg overflow-hidden group border border-[#E0E0E0]"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ y: -4, boxShadow: "0 20px 34px -14px rgba(0, 0, 0, 0.16)" }}
                    >
                        {/* Barra superior colorida */}
                        <div className="h-2 bg-[#9E9E9E]"></div>

                        <div className="p-5">
                            {/* Ícone com fundo */}
                            <div className="w-14 h-14 rounded-full bg-[#F4F4F4] flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Building className="h-6 w-6 text-[#212121]" />
                            </div>

                            {/* Título do card */}
                            <h3 className="text-lg font-bold text-center text-[#212121] mb-3">Vita Enterprise</h3>

                            {/* Lista de benefícios */}
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Integração com sistemas legacy (HIS)</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Dashboard de saúde populacional</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-[#9E9E9E] text-[13px]">Segurança e conformidade enterprise</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
                    {/* Estatística 1 */}
                    <motion.div
                        className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">+40%</h3>
                        <p className="text-white/60 font-medium text-[13px]">Aumento na produtividade clínica</p>
                    </motion.div>

                    {/* Estatística 2 */}
                    <motion.div
                        className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">30%</h3>
                        <p className="text-white/60 font-medium text-[13px]">Redução no tempo de consulta</p>
                    </motion.div>

                    {/* Estatística 3 */}
                    <motion.div
                        className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">100%</h3>
                        <p className="text-white/60 font-medium text-[13px]">Segurança e Conformidade LGPD</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
