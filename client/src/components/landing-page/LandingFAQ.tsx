import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function LandingFAQ() {
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        if (activeFaq === index) {
            setActiveFaq(null);
        } else {
            setActiveFaq(index);
        }
    };

    const faqs = [
        {
            question: "Como funciona a anamnese com gravação de voz?",
            answer: "Durante a consulta, você ativa a gravação de voz e foca totalmente no paciente. O VitaView transcreve a conversa em tempo real, estrutura as informações em formato clínico e gera a anamnese automaticamente. Você só revisa e confirma."
        },
        {
            question: "O que a prescrição digital oferece?",
            answer: "A prescrição digital permite buscar medicamentos com autocomplete, definir posologia e gerar o documento final em segundos. Além disso, o sistema alerta sobre interações medicamentosas, ajudando a evitar erros e garantindo mais segurança para o paciente."
        },
        {
            question: "Como a agenda e a triagem pré-consulta funcionam?",
            answer: "A agenda ajuda a organizar horários, encaixes e prioridades da rotina. Antes da consulta, a triagem e o contexto do atendimento ficam mais acessíveis para que você chegue ao caso com um panorama melhor."
        },
        {
            question: "O que é o Vita Assist?",
            answer: "O Vita Assist é o assistente clínico do VitaView. Ele ajuda a sugerir hipóteses, recomendar protocolos de exames, apoiar a interpretação de resultados e responder dúvidas clínicas com base no contexto do prontuário."
        },
        {
            question: "Quais planos estão disponíveis?",
            answer: "Você pode começar no plano Gratuito. Para uma rotina individual com mais automação e volume, há o Vita Pro. Para clínicas com até 5 profissionais, o Vita Team amplia a operação com recursos de equipe e gestão centralizada."
        }
    ];

    return (
        <section id="faq" className="py-8 md:py-10 bg-gradient-to-b from-[#212121] to-[#424242] text-white relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
                <div className="absolute right-0 top-20 w-64 h-64 bg-[#F4F4F4] rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute left-20 bottom-10 w-72 h-72 bg-[#F4F4F4] rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-6 md:mb-7"
                >
                    <h2 className="text-2xl md:text-4xl lg:text-[2.8rem] font-heading font-bold text-white mb-3 leading-[1.08] tracking-tight">
                        Perguntas <span className="text-[#9E9E9E]">Frequentes.</span>
                    </h2>
                    <p className="text-sm md:text-[15px] text-white/60 max-w-2xl mx-auto px-2">
                        Tire suas dúvidas sobre as ferramentas do VitaView e como elas se encaixam na sua rotina clínica.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
                    {/* Coluna Esquerda: FAQ Accordion */}
                    <div className="lg:col-span-7 space-y-2.5">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <motion.div
                                    className={`p-3.5 md:p-4 rounded-xl border ${activeFaq === index ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'} cursor-pointer transition-all duration-300 backdrop-blur-sm`}
                                    onClick={() => toggleFaq(index)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className={`font-semibold text-[14px] md:text-[15px] ${activeFaq === index ? 'text-[#E0E0E0]' : 'text-white'}`}>
                                            {faq.question}
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: activeFaq === index ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full ${activeFaq === index ? 'bg-[#E0E0E0] text-[#212121]' : 'bg-white/10 text-white'}`}
                                        >
                                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                                        </motion.div>
                                    </div>

                                    <AnimatePresence>
                                        {activeFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="text-[14px] text-[#9E9E9E] leading-relaxed">{faq.answer}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Coluna Direita: Contato e Suporte */}
                    <div className="lg:col-span-5 relative">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 md:p-5 border border-white/20 sticky top-16"
                        >
                            <h3 className="text-base md:text-xl font-bold text-white mb-2.5 md:mb-3">Estamos aqui para ajudar</h3>
                            <p className="text-[#9E9E9E] mb-3.5 md:mb-4 text-[13px] md:text-sm">
                                Não encontrou o que procurava? Nossa equipe de suporte está pronta para atender você.
                            </p>

                            <div className="space-y-3">
                                <a
                                    href="mailto:contato@vitaview.ai"
                                    className="flex items-center p-2.5 md:p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#E0E0E0]/20 flex items-center justify-center mr-3 md:mr-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-[#E0E0E0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[13px] text-[#9E9E9E]">Email de Suporte</div>
                                        <div className="text-[15px] md:text-base font-semibold text-white group-hover:text-[#E0E0E0] transition-colors">contato@vitaview.ai</div>
                                    </div>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
