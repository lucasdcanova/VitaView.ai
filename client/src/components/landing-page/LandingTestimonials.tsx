import { motion } from "framer-motion";

export function LandingTestimonials() {
    const testimonials = [
        {
            quote: "O VitaView AI revolucionou a forma como acompanho meus pacientes crônicos. A linha do tempo visual me permite identificar padrões que passariam despercebidos em exames isolados.",
            name: "Dr. Ricardo Mendes",
            role: "Cardiologista",
            delay: 0,
            gradient: "from-[#212121] to-[#424242]",
            avatarBg: "bg-[#E0E0E0]",
            avatarText: "text-[#212121]",
            avatarBorder: "border-[#424242]",
            image: true
        },
        {
            quote: "A extração automática de dados economiza horas da minha semana. Posso focar totalmente no paciente, sabendo que os dados estão organizados e seguros.",
            name: "Dra. Juliana Costa",
            role: "Endocrinologista",
            delay: 0.1,
            gradient: "from-[#424242] to-[#212121]",
            avatarBg: "bg-[#E0E0E0]",
            avatarText: "text-[#212121]",
            avatarBorder: "border-[#424242]",
            image: true
        }
    ];

    const stats = [
        { label: "Avaliação média", value: "4.9/5", icon: "⭐" },
        { label: "Usuários ativos", value: "10k+", icon: "👥" },
        { label: "Exames analisados", value: "500k+", icon: "📊" },
        { label: "Recomendações", value: "98%", icon: "👍" }
    ];

    return (
        <section id="depoimentos" className="py-12 md:py-20 bg-[#F4F4F4] relative overflow-hidden scroll-mt-16">
            {/* Elementos decorativos */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
                <div className="absolute right-0 top-10 w-72 h-72 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute left-0 bottom-10 w-64 h-64 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl md:text-4xl font-bold text-center text-[#212121] mb-3 md:mb-4">
                        O Que Dizem Nossos <span className="text-[#212121]">Usuários</span>
                    </h2>
                    <p className="text-center text-[#9E9E9E] mb-8 md:mb-12 max-w-2xl mx-auto text-sm md:text-base px-2">
                        Centenas de pessoas já transformaram sua relação com a saúde através do VitaView AI.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-5xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            className="bg-white rounded-xl shadow-xl overflow-hidden group relative"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: testimonial.delay }}
                            whileHover={{
                                y: -10,
                                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                            }}
                        >
                            {/* Elementos decorativos de fundo */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#48C9B0]/10 to-transparent rounded-bl-full z-0 opacity-70"></div>
                            {index === 0 ? (
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#212121]/10 to-transparent rounded-tr-full z-0"></div>
                            ) : (
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#9E9E9E]/10 to-transparent rounded-tr-full z-0"></div>
                            )}

                            {/* Barra gradiente superior */}
                            <div className={`h-3 w-full bg-gradient-to-r ${testimonial.gradient}`}></div>

                            <div className="p-5 md:p-8 relative z-10">
                                {/* Aspas decorativas */}
                                <div className="flex justify-start mb-4 relative">
                                    <motion.svg
                                        width="48"
                                        height="48"
                                        viewBox="0 0 48 48"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        initial={{ opacity: 0.3, scale: 0.8 }}
                                        animate={{ opacity: 0.7, scale: 1 }}
                                        transition={{ duration: 0.5, delay: testimonial.delay + 0.2 }}
                                    >
                                        <path d="M14 24H6C6 18.5 7 11.9 14 11V17C11 17.5 10.5 19 10.5 21.5H14V24ZM28 24H20C20 18.5 21 11.9 28 11V17C25 17.5 24.5 19 24.5 21.5H28V24Z"
                                            className={`fill-[${index === 0 ? '#424242' : '#212121'}]`}
                                            style={{ opacity: 0.3 }}
                                        />
                                    </motion.svg>
                                    <div className={`absolute w-12 h-1 bg-gradient-to-r ${testimonial.gradient} rounded-full bottom-0 left-0`}></div>
                                </div>

                                {/* Texto do depoimento */}
                                <p className="text-[#212121] mb-8 text-lg leading-relaxed relative">
                                    {testimonial.quote}
                                    <span className="absolute -left-1 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#9E9E9E]/30 to-transparent rounded-full"></span>
                                </p>

                                <div className="flex items-center">
                                    {/* Avatar com bordas animadas */}
                                    <div className="relative">
                                        {/* Círculo animado de fundo */}
                                        <motion.div
                                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${testimonial.gradient} opacity-70 blur-[1px]`}
                                            animate={{
                                                scale: [1, 1.05, 1],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 3,
                                            }}
                                        />

                                        {testimonial.image ? (
                                            <div className={`w-16 h-16 rounded-full ${testimonial.avatarBg} flex items-center justify-center relative z-10 border-3 ${testimonial.avatarBorder} overflow-hidden shadow-lg`}>
                                                {index === 0 ? (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#9E9E9E]/10 to-[#212121]/10"></div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#212121]/10 to-[#9E9E9E]/10"></div>
                                                )}
                                                <div className={`w-full h-full rounded-full flex items-center justify-center ${testimonial.avatarText} font-bold text-xl bg-gradient-to-br from-white/90 to-white/70 z-10`}>
                                                    {testimonial.name.charAt(0)}{testimonial.name.split(' ')[1]?.charAt(0)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative z-10 border-2 border-white">
                                                <span className="text-lg font-bold text-[#212121]">{testimonial.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-5">
                                        <h4 className="font-bold text-[#212121] text-lg">{testimonial.name}</h4>
                                        <p className="text-[#9E9E9E] text-sm">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Avaliações em formato numérico */}
                <motion.div
                    className="mt-8 md:mt-16 bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {stats.map((stat, index) => (
                            <div key={index} className="p-6 text-center">
                                <div className="text-2xl mb-1">{stat.icon}</div>
                                <h3 className="text-3xl font-bold text-[#212121] mb-1">{stat.value}</h3>
                                <p className="text-[#9E9E9E] text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
