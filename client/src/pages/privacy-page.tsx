import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Database, Eye, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function PrivacyPage() {
    useEffect(() => {
        document.title = "Política de Privacidade - VitaView AI";
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F4F4]">
            {/* Header */}
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
                        <p className="text-[#E0E0E0] max-w-2xl">
                            Esta política descreve como coletamos, usamos e protegemos suas informações
                            pessoais e os dados de saúde processados na plataforma VitaView AI.
                        </p>
                        <p className="text-sm text-[#9E9E9E] mt-4">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">

                    {/* 1. Informações Coletadas */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Database className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">1. Informações que Coletamos</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p><strong>1.1. Dados do Profissional de Saúde (Usuário):</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Nome completo e credenciais profissionais</li>
                                <li>E-mail e informações de contato</li>
                                <li>Dados de uso e navegação na plataforma</li>
                                <li>Informações de pagamento (processadas por terceiros)</li>
                            </ul>

                            <p className="mt-4"><strong>1.2. Dados de Pacientes (Inseridos pelo Usuário):</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Informações pessoais de identificação</li>
                                <li>Dados de saúde (exames, diagnósticos, medicações)</li>
                                <li>Histórico médico e anotações clínicas</li>
                            </ul>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-4">
                                <p className="text-[#424242]">
                                    <strong>Importante:</strong> Os dados de pacientes são inseridos exclusivamente pelo
                                    profissional de saúde, que é responsável por obter o consentimento necessário.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Como Usamos os Dados */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Eye className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">2. Como Usamos os Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Utilizamos os dados coletados para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Fornecer e manter nossos serviços</li>
                                <li>Processar e analisar exames e dados de saúde</li>
                                <li>Gerar relatórios e insights clínicos</li>
                                <li>Enviar comunicações relacionadas ao serviço</li>
                                <li>Melhorar e personalizar a experiência do usuário</li>
                                <li>Garantir a segurança da plataforma</li>
                            </ul>

                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mt-4">
                                <p className="text-[#424242]">
                                    <strong>Compromisso:</strong> Nunca vendemos, comercializamos ou compartilhamos
                                    dados de pacientes para fins de marketing ou publicidade.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Proteção de Dados */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">3. Proteção de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Implementamos as seguintes medidas de segurança:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Criptografia TLS/SSL:</strong> Dados em trânsito são criptografados</li>
                                <li><strong>Criptografia AES-256:</strong> Dados em repouso são criptografados</li>
                                <li><strong>Autenticação Segura:</strong> Senhas hasheadas e autenticação multifator</li>
                                <li><strong>Controle de Acesso:</strong> Permissões baseadas em função</li>
                                <li><strong>Logs de Auditoria:</strong> Registro de atividades para compliance</li>
                                <li><strong>Backups Regulares:</strong> Cópias de segurança com retenção segura</li>
                            </ul>
                        </div>
                    </section>

                    {/* 4. Compartilhamento de Dados */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Globe className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">4. Compartilhamento de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Podemos compartilhar dados apenas nas seguintes situações:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Prestadores de Serviço:</strong> Fornecedores que auxiliam na operação
                                    (hospedagem, processamento de pagamentos), sob contratos de confidencialidade.</li>
                                <li><strong>Obrigações Legais:</strong> Quando exigido por lei, ordem judicial ou
                                    autoridade competente.</li>
                                <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, segurança
                                    ou propriedade.</li>
                            </ul>
                            <p className="font-semibold mt-4">
                                Nunca compartilhamos dados de saúde de pacientes para fins comerciais ou de marketing.
                            </p>
                        </div>
                    </section>

                    {/* 5. Direitos do Titular */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">5. Seus Direitos (LGPD)</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Confirmação:</strong> Saber se processamos seus dados</li>
                                <li><strong>Acesso:</strong> Obter cópia dos dados que temos sobre você</li>
                                <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                                <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários</li>
                                <li><strong>Portabilidade:</strong> Transferir seus dados para outro serviço</li>
                                <li><strong>Eliminação:</strong> Solicitar exclusão de dados pessoais</li>
                                <li><strong>Revogação:</strong> Revogar consentimento previamente dado</li>
                            </ul>
                            <p className="mt-4">
                                Para exercer esses direitos, entre em contato pelo e-mail:
                                <a href="mailto:privacidade@vitaview.ai" className="text-[#212121] underline ml-1">
                                    privacidade@vitaview.ai
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* 6. Retenção de Dados */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Trash2 className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">6. Retenção e Exclusão de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir
                                obrigações legais. Após o encerramento da conta:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Dados de conta: Excluídos em até 30 dias</li>
                                <li>Dados de pacientes: O usuário pode exportar antes da exclusão</li>
                                <li>Backups: Eliminados em até 90 dias</li>
                                <li>Logs de auditoria: Mantidos conforme exigência legal</li>
                            </ul>
                        </div>
                    </section>

                    {/* 7. Cookies e Tecnologias */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">7. Cookies e Tecnologias Similares</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Utilizamos cookies para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Manter sua sessão autenticada</li>
                                <li>Lembrar suas preferências</li>
                                <li>Analisar o uso da plataforma</li>
                            </ul>
                            <p>Você pode gerenciar cookies nas configurações do seu navegador.</p>
                        </div>
                    </section>

                    {/* 8. Alterações */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">8. Alterações nesta Política</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Podemos atualizar esta política periodicamente. Notificaremos sobre alterações
                                significativas por e-mail ou através da plataforma.
                            </p>
                        </div>
                    </section>

                    {/* 9. Contato */}
                    <section className="mb-6">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">9. Contato</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Para questões relacionadas a privacidade e proteção de dados:</p>
                            <p><strong>E-mail:</strong>
                                <a href="mailto:privacidade@vitaview.ai" className="text-[#212121] underline ml-1">
                                    privacidade@vitaview.ai
                                </a>
                            </p>
                            <p><strong>Encarregado de Proteção de Dados (DPO):</strong>
                                <a href="mailto:dpo@vitaview.ai" className="text-[#212121] underline ml-1">
                                    dpo@vitaview.ai
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* LGPD Badge */}
                    <div className="bg-[#212121] text-white p-6 rounded-lg mt-8 flex items-center justify-center gap-4">
                        <Shield className="h-8 w-8" />
                        <p className="font-semibold text-center">
                            Em conformidade com a Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
