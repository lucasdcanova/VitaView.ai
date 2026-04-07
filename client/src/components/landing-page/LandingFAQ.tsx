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
            question: "Como funciona a Anamnese com IA e gravação de voz?",
            answer: "Durante a consulta, você ativa a gravação de voz e foca totalmente no paciente. Nossa IA transcreve a conversa em tempo real, estrutura as informações em formato clínico (queixa principal, história da doença atual, exame físico) e gera a anamnese completa automaticamente. Você só revisa e confirma."
        },
        {
            question: "O que a Prescrição Inteligente oferece?",
            answer: "A prescrição inteligente permite buscar medicamentos com autocomplete, definir posologia e gerar o documento final em segundos. Além disso, o sistema alerta sobre interações medicamentosas, ajudando a evitar erros e garantindo mais segurança para o paciente."
        },
        {
            question: "Como a Agenda com IA e triagem pré-consulta funcionam?",
            answer: "A agenda inteligente ajuda a organizar horários, encaixes e prioridades da rotina. Antes da consulta, a triagem e o contexto do atendimento ficam mais acessíveis para que você chegue ao caso com um panorama melhor."
        },
        {
            question: "O que é o Vita Assist?",
            answer: "O Vita Assist é seu assistente clínico com IA. Ele pode sugerir hipóteses diagnósticas com base nos dados do paciente, recomendar protocolos de exames, auxiliar na interpretação de resultados e responder dúvidas clínicas — tudo integrado ao prontuário do paciente."
        },
        {
            question: "Quais planos estão disponíveis?",
            answer: "Você pode começar no plano Gratuito. Para uma rotina individual com mais IA, volume e automação, há o Vita Pro. Para clínicas com até 5 profissionais, o Vita Team amplia a operação com recursos de equipe e gestão centralizada."
        }
    ];

    return (
        <section id="faq" className="py-12 md:py-20 bg-gradient-to-b from-[#212121] to-[#424242] text-white relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
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
                    className="text-center mb-10 md:mb-12"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-[3.1rem] font-heading font-bold text-white mb-4 leading-[1.08] tracking-tight">
                        Perguntas <span className="text-[#9E9E9E]">Frequentes.</span>
                    </h2>
                    <p className="text-base md:text-[17px] text-white/60 max-w-2xl mx-auto px-2">
                        Tire suas dúvidas sobre as ferramentas do VitaView AI e como elas podem transformar sua rotina clínica.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                    {/* Coluna Esquerda: FAQ Accordion */}
                    <div className="lg:col-span-7 space-y-3">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <motion.div
                                    className={`p-4 rounded-xl border ${activeFaq === index ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'} cursor-pointer transition-all duration-300 backdrop-blur-sm`}
                                    onClick={() => toggleFaq(index)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className={`font-semibold text-[15px] md:text-base ${activeFaq === index ? 'text-[#E0E0E0]' : 'text-white'}`}>
                                            {faq.question}
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: activeFaq === index ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex items-center justify-center w-8 h-8 rounded-full ${activeFaq === index ? 'bg-[#E0E0E0] text-[#212121]' : 'bg-white/10 text-white'}`}
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </div>

                                    <AnimatePresence>
                                        {activeFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="text-[#9E9E9E] leading-relaxed">{faq.answer}</p>
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
                            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 sticky top-24"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Estamos aqui para ajudar</h3>
                            <p className="text-[#9E9E9E] mb-6 text-sm">
                                Não encontrou o que procurava? Nossa equipe de suporte está pronta para atender você.
                            </p>

                            <div className="space-y-5">
                                <a
                                    href="mailto:contato@vitaview.ai"
                                    className="flex items-center p-3.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#E0E0E0]/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-[#E0E0E0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#9E9E9E]">Email de Suporte</div>
                                        <div className="text-base font-semibold text-white group-hover:text-[#E0E0E0] transition-colors">contato@vitaview.ai</div>
                                    </div>
                                </a>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                                        <div className="w-10 h-10 mx-auto bg-[#212121]/20 rounded-full flex items-center justify-center mb-3">
                                            <Clock className="w-5 h-5 text-[#9E9E9E]" />
                                        </div>
                                        <div className="text-sm font-medium text-white">Canal direto</div>
                                        <div className="text-xs text-[#9E9E9E] mt-1">Contato por e-mail</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                                        <div className="w-10 h-10 mx-auto bg-[#212121]/20 rounded-full flex items-center justify-center mb-3">
                                            <ShieldCheck className="w-5 h-5 text-[#9E9E9E]" />
                                        </div>
                                        <div className="text-sm font-medium text-white">Canal oficial</div>
                                        <div className="text-xs text-[#9E9E9E] mt-1">Atendimento da equipe VitaView</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-sm text-[#9E9E9E] text-center mb-4">Siga-nos nas redes sociais</p>
                                <div className="flex justify-center space-x-4">
                                    {['Instagram'].map((social) => (
                                        <a
                                            key={social}
                                            href="https://instagram.com/vitaview.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E0E0E0] hover:text-[#212121] transition-all duration-300"
                                        >
                                            <span className="sr-only">{social}</span>
                                            {social === 'Instagram' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
