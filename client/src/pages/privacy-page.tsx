import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Database, Eye, Trash2, Globe, Users, Baby, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { isRestrictedAppShell } from "@/lib/app-shell";

const LAST_UPDATED = "07 de abril de 2026";

export default function PrivacyPage() {
    useEffect(() => {
        document.title = "Política de Privacidade - VitaView AI";
        window.scrollTo(0, 0);
    }, []);

    const handleBack = () => {
        if (isRestrictedAppShell()) {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.replace("/auth");
            }
        } else {
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F4F4]">
            <div className="bg-[#212121] text-white py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <Button variant="ghost" className="text-white hover:bg-white/10 mb-6" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
                        <p className="text-[#E0E0E0] max-w-3xl">
                            Esta Política explica como a VitaView AI coleta, utiliza, protege e compartilha dados pessoais no contexto da plataforma.
                            O tratamento observa a LGPD (Lei nº 13.709/2018), o GDPR quando aplicável e as melhores práticas de segurança da informação.
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
                                <li>Nome completo, e-mail, telefone, CRM/registro profissional, especialidade, RQE, biografia, foto de perfil.</li>
                                <li>Credenciais de autenticação (senha hasheada e fatores de MFA quando ativos).</li>
                                <li>Dados técnicos: endereço IP, identificadores de dispositivo, sistema operacional, versão do app, idioma e fuso horário.</li>
                                <li>Logs de uso, eventos de segurança, trilhas de auditoria e preferências da plataforma.</li>
                                <li>Identificadores de assinatura da App Store ou tokens de pagamento do Stripe (sem armazenar número de cartão).</li>
                            </ul>
                            <p className="mt-4"><strong>Dados de pacientes inseridos pelo profissional:</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Dados cadastrais e clínicos: prontuário, diagnósticos, evoluções, alergias, medicações, exames, anamneses, atestados, prescrições e documentos médicos.</li>
                                <li>Áudio de consultas (quando o profissional ativa a gravação) processado para transcrição e estruturação automática.</li>
                                <li>Imagens capturadas pela câmera ou enviadas pela biblioteca do dispositivo, exclusivamente quando o usuário autoriza.</li>
                            </ul>
                            <p className="mt-4"><strong>Dados de uso de IA:</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Métricas de consumo de tokens, custo por análise e tempo de processamento, usados para limites do plano e auditoria interna.</li>
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
                            <p>Utilizamos os dados estritamente para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Executar funcionalidades solicitadas (prontuário, agenda, prescrição, análise de exames, transcrição de voz, Vita Assist).</li>
                                <li>Autenticar o usuário, manter sessão e proteger a conta.</li>
                                <li>Faturar e processar assinaturas via App Store (iOS) ou Stripe (web).</li>
                                <li>Manter rastreabilidade, segurança, integridade e continuidade operacional.</li>
                                <li>Atender obrigações legais, regulatórias, sanitárias e fiscais.</li>
                                <li>Melhorar desempenho, usabilidade e qualidade da plataforma a partir de dados agregados ou anonimizados.</li>
                            </ul>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mt-4">
                                <p className="text-[#424242]">
                                    Dados de pacientes <strong>nunca</strong> são comercializados, vendidos ou compartilhados para fins de publicidade, marketing de terceiros ou treinamento de modelos públicos de IA.
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
                                <li>O profissional de saúde, clínica ou organização usuária atua como <strong>controlador</strong> dos dados de pacientes.</li>
                                <li>A VitaView AI atua como <strong>operadora</strong>, tratando dados de acordo com as instruções do controlador e a legislação aplicável.</li>
                                <li>Para dados de conta do próprio usuário (cadastro, faturamento, segurança), a VitaView AI atua como controladora.</li>
                                <li>O controlador é responsável pela base legal do tratamento, consentimentos do paciente e atendimento aos direitos dos titulares.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">4. Provedores e Operadores Subcontratados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Para operar a plataforma, contratamos provedores que recebem dados estritamente necessários para a finalidade descrita,
                                sob obrigações contratuais de confidencialidade e segurança equivalentes:
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left p-3 border-b">Provedor</th>
                                            <th className="text-left p-3 border-b">Finalidade</th>
                                            <th className="text-left p-3 border-b">País</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="p-3 border-b">Apple Inc. (App Store / StoreKit)</td><td className="p-3 border-b">Processamento de assinaturas in-app no iOS/iPadOS/macOS</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">Stripe, Inc.</td><td className="p-3 border-b">Processamento de assinaturas e pagamentos pela web</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">OpenAI, L.L.C.</td><td className="p-3 border-b">Modelos de linguagem para análise de exames e Vita Assist</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">Anthropic, PBC</td><td className="p-3 border-b">Modelos de linguagem (Claude) para anamnese e suporte clínico</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">Google LLC (Gemini / Cloud)</td><td className="p-3 border-b">Modelos de IA e infraestrutura auxiliar</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">Neon Inc. (PostgreSQL)</td><td className="p-3 border-b">Banco de dados gerenciado da aplicação</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">Render Services, Inc.</td><td className="p-3 border-b">Hospedagem do backend</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3 border-b">Resend / SendGrid</td><td className="p-3 border-b">Envio transacional de e-mail</td><td className="p-3 border-b">EUA</td></tr>
                                        <tr><td className="p-3">Cloudflare, Inc.</td><td className="p-3">CDN, proteção DDoS e segurança de borda</td><td className="p-3">EUA</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-600 mt-3">
                                Todos os provedores acima são contratualmente obrigados a manter padrões de segurança e privacidade equivalentes aos descritos nesta Política.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">5. Dados de Assinaturas e Compras In-App</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Quando você assina um plano pago pelo aplicativo iOS/iPadOS/macOS, a transação é processada exclusivamente pela
                                App Store da Apple via StoreKit. A Apple recebe e armazena seus dados de pagamento conforme a
                                <a href="https://www.apple.com/legal/privacy/" className="text-[#212121] underline mx-1">Política de Privacidade da Apple</a>.
                            </p>
                            <p>
                                A VitaView AI recebe da Apple apenas: o identificador opaco da transação, o produto adquirido, o status da assinatura
                                (ativa, em renovação, cancelada, expirada) e um <em>app account token</em> anônimo que vincula a compra à sua conta da plataforma.
                                <strong> Não recebemos nem armazenamos número de cartão, CPF, endereço de cobrança ou demais dados financeiros sensíveis.</strong>
                            </p>
                            <p>
                                Quando a assinatura é feita pela web, o pagamento é processado pelo Stripe, que armazena dados de pagamento conforme a
                                <a href="https://stripe.com/privacy" className="text-[#212121] underline mx-1">Política de Privacidade do Stripe</a>.
                                A VitaView AI recebe apenas o ID de cliente e o ID da assinatura, sem o número completo do cartão.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">6. Segurança da Informação</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Adotamos medidas técnicas e organizacionais compatíveis com a sensibilidade dos dados de saúde:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Criptografia em trânsito (TLS 1.2+) e em repouso para dados sensíveis no banco e em backups.</li>
                                <li>Senhas armazenadas com hashing bcrypt e suporte a MFA (TOTP e biometria).</li>
                                <li>Controle de acesso por função (médico, secretária, administrador), com princípio do menor privilégio.</li>
                                <li>Trilhas de auditoria, monitoramento de eventos e alertas de segurança.</li>
                                <li>Rotinas de backup, testes de restauração e plano de resposta a incidentes.</li>
                                <li>Avaliação contínua de fornecedores e dependências de software.</li>
                            </ul>
                            <p>
                                Apesar dessas medidas, nenhum sistema é absolutamente imune a falhas. Em caso de incidente que afete dados pessoais,
                                comunicaremos os controladores e as autoridades competentes nos prazos e formas exigidos pela LGPD.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Trash2 className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">7. Retenção de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Mantemos dados pelo período necessário para cumprir as finalidades contratuais, legais e regulatórias.
                                Após esse período, os dados são eliminados, anonimizados ou bloqueados, conforme aplicável.
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Dados de conta e assinatura:</strong> enquanto a relação contratual estiver ativa e pelo prazo prescricional cabível após o encerramento.</li>
                                <li><strong>Dados clínicos de pacientes:</strong> conforme prazo definido pelo controlador (profissional/clínica) e por normas do conselho profissional aplicável (CFM/CRM).</li>
                                <li><strong>Logs e trilhas de auditoria:</strong> até 5 anos para fins de compliance e investigação de incidentes.</li>
                                <li><strong>Backups:</strong> ciclo técnico de retenção e descarte seguro, normalmente em até 90 dias após exclusão lógica.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#D32F2F] rounded-lg">
                                <Trash2 className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">8. Como Excluir Sua Conta e Seus Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Você pode solicitar a exclusão completa da sua conta e dos dados associados a qualquer momento, diretamente no aplicativo:
                            </p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Faça login no VitaView AI.</li>
                                <li>Acesse <strong>Conta profissional</strong> (ícone do estetoscópio) no menu lateral.</li>
                                <li>Abra a aba <strong>Privacidade (LGPD)</strong>.</li>
                                <li>Toque em <strong>Excluir minha conta</strong> e confirme.</li>
                            </ol>
                            <p>
                                Após a confirmação, a conta é removida e os dados associados são apagados, anonimizados ou bloqueados conforme a Seção 7.
                                Dados que devam ser preservados por obrigação legal serão mantidos pelo prazo mínimo exigido em lei e protegidos contra acesso indevido.
                            </p>
                            <p>
                                Você também pode solicitar exclusão por e-mail em
                                <a href="mailto:privacidade@vitaview.ai" className="text-[#212121] underline ml-1">privacidade@vitaview.ai</a>
                                ou
                                <a href="mailto:dpo@vitaview.ai" className="text-[#212121] underline ml-1">dpo@vitaview.ai</a>.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">9. Direitos dos Titulares</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Nos termos da LGPD, você pode exercer os seguintes direitos:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Confirmação da existência de tratamento.</li>
                                <li>Acesso aos dados.</li>
                                <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                                <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
                                <li>Portabilidade dos dados a outro fornecedor (Conta profissional &gt; Privacidade &gt; Exportar meus dados).</li>
                                <li>Eliminação dos dados tratados com base no consentimento.</li>
                                <li>Informação sobre as entidades públicas e privadas com as quais a VitaView AI compartilhou os dados.</li>
                                <li>Revogação do consentimento, quando aplicável.</li>
                                <li>Revisão de decisões automatizadas que afetem seus interesses.</li>
                            </ul>
                            <p>
                                Quando a VitaView AI atuar como operadora, as solicitações relativas a dados de pacientes serão tratadas em coordenação com o controlador responsável.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Globe className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">10. Transferência Internacional de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                A VitaView AI utiliza provedores de infraestrutura, IA e pagamentos sediados nos Estados Unidos e em outras jurisdições
                                (vide Seção 4). Como consequência, dados pessoais podem ser transferidos para fora do Brasil.
                            </p>
                            <p>
                                Realizamos essas transferências exclusivamente para a execução do contrato com o usuário, com base no art. 33, II, V e IX da LGPD,
                                e exigimos dos provedores garantias contratuais de proteção compatíveis com o ordenamento brasileiro, incluindo cláusulas-padrão
                                e certificações reconhecidas (SOC 2, ISO 27001, HIPAA, GDPR, etc., conforme aplicável a cada provedor).
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Baby className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">11. Privacidade de Crianças</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                A VitaView AI é destinada exclusivamente a profissionais de saúde adultos, com registro profissional ativo,
                                e seu uso é restrito a finalidades clínicas profissionais. <strong>Não coletamos intencionalmente dados de crianças
                                como usuárias do aplicativo.</strong>
                            </p>
                            <p>
                                Dados de pacientes pediátricos podem ser inseridos pelo profissional de saúde responsável, na qualidade de controlador,
                                respeitando o consentimento dos pais ou responsáveis legais e a legislação aplicável (LGPD, ECA, normas do CFM).
                            </p>
                            <p>
                                Caso identifiquemos cadastro indevido de menor de idade como usuário direto, a conta será removida.
                                Pais ou responsáveis que tenham conhecimento de tal cadastro devem contatar
                                <a href="mailto:privacidade@vitaview.ai" className="text-[#212121] underline ml-1">privacidade@vitaview.ai</a>.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">12. Cookies e Tecnologias Similares</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Utilizamos cookies e tecnologias equivalentes para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Autenticação e manutenção de sessão segura.</li>
                                <li>Memória de preferências (tema, idioma, layout).</li>
                                <li>Métricas internas de desempenho e prevenção de abuso.</li>
                            </ul>
                            <p>
                                Não utilizamos cookies de publicidade, rastreamento de comportamento entre sites ou compartilhamento com redes de anúncios.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">13. Alterações desta Política</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Esta Política pode ser atualizada periodicamente para refletir melhorias de produto, exigências legais ou alterações operacionais.
                                A versão vigente está sempre publicada nesta página, com a data da última atualização indicada no topo.
                            </p>
                            <p>
                                Alterações materiais serão comunicadas no aplicativo ou por e-mail, com antecedência razoável quando exigido por lei.
                            </p>
                        </div>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">14. Contato</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Para assuntos de privacidade, exercício de direitos ou dúvidas sobre esta Política:</p>
                            <p>
                                <strong>Encarregado / DPO:</strong>{" "}
                                <a href="mailto:dpo@vitaview.ai" className="text-[#212121] underline ml-1">
                                    dpo@vitaview.ai
                                </a>
                            </p>
                            <p>
                                <strong>Privacidade:</strong>{" "}
                                <a href="mailto:privacidade@vitaview.ai" className="text-[#212121] underline ml-1">
                                    privacidade@vitaview.ai
                                </a>
                            </p>
                            <p>
                                <strong>Suporte geral:</strong>{" "}
                                <a href="mailto:contato@vitaview.ai" className="text-[#212121] underline ml-1">
                                    contato@vitaview.ai
                                </a>
                            </p>
                            <p>
                                <strong>Operador da plataforma:</strong> Lucas Dickel Canova ME, Brasil.
                            </p>
                        </div>
                    </section>

                    <div className="bg-[#212121] text-white p-6 rounded-lg mt-8 flex items-center justify-center gap-4">
                        <Shield className="h-8 w-8" />
                        <p className="font-semibold text-center">
                            Documento em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e com as diretrizes da App Store da Apple.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
