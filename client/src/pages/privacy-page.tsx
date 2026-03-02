import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Database, Eye, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const LAST_UPDATED = "02 de março de 2026";

export default function PrivacyPage() {
    useEffect(() => {
        document.title = "Política de Privacidade - VitaView AI";
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F4F4]">
            <div className="bg-[#212121] text-white py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/">
                        <Button variant="ghost" className="text-white hover:bg-white/10 mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
                        <p className="text-[#E0E0E0] max-w-3xl">
                            Esta Política explica como a VitaView AI coleta, utiliza, protege e compartilha dados pessoais no contexto da plataforma.
                            O tratamento observa a LGPD e as melhores práticas de segurança da informação.
                        </p>
                        <p className="text-sm text-[#9E9E9E] mt-4">
                            Última atualização: {LAST_UPDATED}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Database className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">1. Quais Dados Coletamos</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p><strong>Dados de conta e operação:</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Nome, e-mail, dados de autenticação e informações profissionais.</li>
                                <li>Dados técnicos de uso, logs de segurança e preferências da plataforma.</li>
                                <li>Informações de cobrança processadas por provedores de pagamento.</li>
                            </ul>
                            <p className="mt-4"><strong>Dados inseridos pelo usuário sobre pacientes:</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Dados cadastrais e clínicos, incluindo prontuário, exames e documentos.</li>
                                <li>Conteúdos de apoio clínico processados por funcionalidades da plataforma.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Eye className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">2. Como Utilizamos os Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Utilizamos os dados para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Executar funcionalidades solicitadas pelo usuário.</li>
                                <li>Manter segurança, rastreabilidade e continuidade operacional.</li>
                                <li>Atender obrigações legais, regulatórias e de auditoria.</li>
                                <li>Melhorar desempenho, usabilidade e qualidade da plataforma.</li>
                            </ul>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mt-4">
                                <p className="text-[#424242]">
                                    Dados de pacientes não são comercializados e não são compartilhados para publicidade.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">3. Papéis de Tratamento (LGPD)</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <ul className="list-disc pl-6 space-y-2">
                                <li>O profissional de saúde, clínica ou organização usuária atua como controlador dos dados de pacientes.</li>
                                <li>A VitaView AI atua como operadora, tratando dados de acordo com as instruções do controlador e a lei.</li>
                                <li>O controlador é responsável pela base legal do tratamento e gestão dos direitos dos titulares.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Globe className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">4. Compartilhamento de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>O compartilhamento ocorre apenas quando necessário para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Prestação de serviços essenciais da plataforma por parceiros sob confidencialidade.</li>
                                <li>Cumprimento de obrigação legal, regulatória ou ordem de autoridade competente.</li>
                                <li>Proteção de direitos, prevenção à fraude e resposta a incidentes de segurança.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">5. Segurança da Informação</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Adotamos medidas de segurança técnicas e administrativas, como:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Criptografia em trânsito e proteção de dados em armazenamento.</li>
                                <li>Controle de acessos, trilhas de auditoria e monitoramento contínuo.</li>
                                <li>Rotinas de backup e práticas de recuperação de incidentes.</li>
                                <li>Políticas internas de segurança e resposta a eventos.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Trash2 className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">6. Retenção e Exclusão</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Mantemos dados pelo período necessário para cumprir finalidades contratuais, legais e regulatórias.
                                Após esse período, os dados são eliminados, anonimizados ou bloqueados, conforme aplicável.
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Dados de conta: conforme vigência da relação contratual e obrigações legais.</li>
                                <li>Dados de auditoria e segurança: conforme prazos legais e de compliance.</li>
                                <li>Backups: ciclo técnico de retenção e descarte seguro.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">7. Direitos dos Titulares</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Nos termos da LGPD, titulares podem solicitar confirmação de tratamento, acesso, correção,
                                anonimização, portabilidade, eliminação e revisão de decisões automatizadas, quando aplicável.
                            </p>
                            <p>
                                Quando a VitaView AI atuar como operadora, as solicitações serão tratadas em coordenação com o controlador responsável.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">8. Cookies e Tecnologias Similares</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Utilizamos cookies e tecnologias equivalentes para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Autenticação e manutenção de sessão.</li>
                                <li>Preferências de uso e desempenho.</li>
                                <li>Segurança e prevenção de abuso.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">9. Alterações desta Política</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Esta Política pode ser atualizada periodicamente para refletir melhorias de produto, exigências legais ou alterações operacionais.
                                A versão vigente estará sempre publicada nesta página.
                            </p>
                        </div>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">10. Contato</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Para assuntos de privacidade e proteção de dados:</p>
                            <p>
                                <strong>E-mail:</strong>{" "}
                                <a href="mailto:privacidade@vitaview.ai" className="text-[#212121] underline ml-1">
                                    privacidade@vitaview.ai
                                </a>
                            </p>
                            <p>
                                <strong>DPO:</strong>{" "}
                                <a href="mailto:dpo@vitaview.ai" className="text-[#212121] underline ml-1">
                                    dpo@vitaview.ai
                                </a>
                            </p>
                        </div>
                    </section>

                    <div className="bg-[#212121] text-white p-6 rounded-lg mt-8 flex items-center justify-center gap-4">
                        <Shield className="h-8 w-8" />
                        <p className="font-semibold text-center">
                            Documento em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
