import { motion } from "framer-motion";

const stats = [
    { value: "98%", label: "Precisão na extração de dados" },
    { value: "30%", label: "Economia de tempo por consulta" },
    { value: "24/7", label: "Acesso seguro à plataforma" },
];

export function LandingStatsStrip() {
    return (
        <section className="py-8 md:py-12 bg-[#FAFAFA] border-y border-[#E0E0E0]">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="flex flex-row justify-center items-center gap-8 md:gap-20 lg:gap-28">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            className="text-center"
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <h3 className="text-2xl md:text-4xl font-heading font-bold text-[#212121] tracking-tight">
                                {stat.value}
                            </h3>
                            <p className="text-[10px] md:text-xs text-[#9E9E9E] font-medium mt-1 max-w-[120px] mx-auto leading-snug">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
