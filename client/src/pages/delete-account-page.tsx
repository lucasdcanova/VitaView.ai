import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Mail, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { isRestrictedAppShell } from "@/lib/app-shell";

const LAST_UPDATED = "07 de abril de 2026";
const SUPPORT_EMAIL = "suporte@vitaview.ai";

export default function DeleteAccountPage() {
    useEffect(() => {
        document.title = "Excluir conta - VitaView AI";
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
                        <h1 className="text-4xl font-bold mb-4">Excluir conta VitaView AI</h1>
                        <p className="text-[#E0E0E0] max-w-3xl">
                            Esta página explica como o titular dos dados pode solicitar a exclusão definitiva da conta VitaView AI,
                            quais informações serão removidas, quais podem ser retidas por exigência legal e em quanto tempo a remoção é concluída.
                            O processo cumpre os direitos garantidos pela LGPD (Lei nº 13.709/2018) e pelo GDPR.
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
                                <Trash2 className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">1. Como excluir a conta dentro do app</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Qualquer usuário com acesso ativo pode encerrar a própria conta diretamente pelo aplicativo, sem precisar
                                entrar em contato com a equipe. O fluxo é o mesmo no app iOS, Android e web.
                            </p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Faça login no VitaView AI no aplicativo ou em <a href="https://vitaview.ai" className="text-[#212121] underline">vitaview.ai</a>.</li>
                                <li>Abra o menu lateral e toque em <strong>Configurações</strong> (ou no avatar do usuário).</li>
                                <li>Selecione <strong>Perfil</strong>.</li>
                                <li>Role até a seção <strong>Zona de risco</strong>.</li>
                                <li>Toque em <strong>Excluir minha conta</strong>.</li>
                                <li>Leia o aviso de exclusão definitiva e confirme.</li>
                            </ol>
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-4">
                                <p className="text-[#424242]">
                                    A exclusão é <strong>imediata e definitiva</strong>. Após a confirmação não é possível recuperar
                                    a conta nem os dados associados. Considere exportar prontuários e relatórios antes de prosseguir.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">2. Como solicitar a exclusão por e-mail</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Se você não consegue acessar a conta (esqueceu a senha, perdeu o segundo fator, conta suspensa
                                ou outro motivo), envie uma solicitação para a equipe de suporte. Vamos validar sua identidade
                                e processar a exclusão manualmente.
                            </p>
                            <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg p-4 space-y-2">
                                <p><strong>Para:</strong> <a href={`mailto:${SUPPORT_EMAIL}?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20de%20conta`} className="text-[#212121] underline">{SUPPORT_EMAIL}</a></p>
                                <p><strong>Assunto:</strong> Solicitação de exclusão de conta</p>
                                <p><strong>Inclua no corpo:</strong></p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Nome completo cadastrado</li>
                                    <li>E-mail usado no cadastro</li>
                                    <li>CRM/registro profissional (se aplicável)</li>
                                    <li>Confirmação explícita da intenção de excluir a conta</li>
                                </ul>
                            </div>
                            <p className="text-sm">
                                Por segurança, podemos pedir comprovação adicional de identidade antes de concluir a exclusão.
                                Solicitações sem identificação válida não serão processadas.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">3. Quais dados são removidos</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>A exclusão remove <strong>permanentemente</strong> todos os dados pessoais e clínicos vinculados à sua conta, incluindo:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Dados cadastrais: nome, e-mail, telefone, CRM, especialidade, foto de perfil, biografia.</li>
                                <li>Credenciais: senha (hash), fatores de autenticação multifator (MFA, biometria, TOTP).</li>
                                <li>Prontuários, diagnósticos, evoluções, anamneses, prescrições, atestados e documentos médicos criados pela conta.</li>
                                <li>Resultados e análises de exames laboratoriais enviados ao app.</li>
                                <li>Áudios de consultas e transcrições geradas pela IA.</li>
                                <li>Pacientes cadastrados pela conta, seus dados clínicos e histórico longitudinal.</li>
                                <li>Logs de uso, métricas de IA, preferências, configurações e tokens de notificação push.</li>
                                <li>Vínculo com clínicas e convites pendentes recebidos ou enviados pela conta.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">4. Quais dados podem ser retidos</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Algumas informações são mantidas por períodos determinados quando há base legal específica.
                                Esses dados são isolados, criptografados e usados exclusivamente para os fins listados:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Documentos fiscais e financeiros</strong> (notas fiscais, recibos de assinatura, comprovantes de pagamento) — retidos pelo prazo exigido pela legislação tributária brasileira (até 5 anos), conforme art. 173 do CTN.</li>
                                <li><strong>Trilhas de auditoria de segurança</strong> (logs de login, eventos críticos, tentativas de acesso) — retidos pelo prazo do Marco Civil da Internet (até 6 meses).</li>
                                <li><strong>Solicitação de exclusão</strong> (registro de que a conta foi removida e quando) — retida indefinidamente para comprovação de cumprimento da LGPD/GDPR.</li>
                                <li><strong>Registros médicos cuja guarda é obrigatória por lei</strong> — quando a conta excluída é a única responsável por prontuários sob exigência de retenção do CFM, esses prontuários podem ser anonimizados em vez de removidos, preservando apenas o conteúdo clínico sem associação ao titular.</li>
                            </ul>
                            <p>
                                Esses dados retidos <strong>não</strong> são utilizados para qualquer finalidade comercial, marketing ou
                                treinamento de modelos de IA.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">5. Prazo para conclusão</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Exclusão pelo app:</strong> imediata. Os dados são removidos do banco de produção em segundos.</li>
                                <li><strong>Solicitação por e-mail:</strong> processada em até <strong>15 dias corridos</strong> a partir da confirmação de identidade.</li>
                                <li><strong>Backups de segurança:</strong> os dados podem permanecer em backups criptografados por até <strong>30 dias</strong> antes de serem completamente sobrescritos pelo ciclo natural de retenção.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-2">
                        <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-[#212121] mb-2">Dúvidas?</h3>
                            <p className="text-[#424242]">
                                Encaminhe perguntas, reclamações ou pedidos relacionados aos seus dados para{" "}
                                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#212121] underline">{SUPPORT_EMAIL}</a>.
                                Nossa Política de Privacidade completa está disponível em{" "}
                                <a href="/privacidade" className="text-[#212121] underline">vitaview.ai/privacidade</a>.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
