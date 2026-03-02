import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, FileText, Users, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const LAST_UPDATED = "02 de março de 2026";

export default function TermsPage() {
    useEffect(() => {
        document.title = "Termos de Uso - VitaView AI";
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
                        <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
                        <p className="text-[#E0E0E0] max-w-3xl">
                            Estes Termos regulam o acesso e uso da plataforma VitaView AI por profissionais de saúde e equipes autorizadas.
                            Ao criar conta ou utilizar o serviço, você confirma que leu e aceitou integralmente este documento.
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
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">1. Escopo e Aceite</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                A VitaView AI oferece recursos de prontuário, organização de atendimento, documentação clínica e apoio por inteligência artificial.
                            </p>
                            <p>
                                O uso da plataforma está condicionado ao aceite destes Termos e da{" "}
                                <a href="/privacidade" className="text-[#212121] underline font-semibold">Política de Privacidade</a>.
                            </p>
                            <p className="font-semibold">
                                Se você não concordar com qualquer cláusula, não deve utilizar a plataforma.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">2. Cadastro e Elegibilidade</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Ao se cadastrar, você declara que:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Possui capacidade legal para contratar e utilizar o serviço.</li>
                                <li>Fornecerá dados verdadeiros, completos e atualizados.</li>
                                <li>Manterá o sigilo das credenciais e responderá por toda atividade da conta.</li>
                                <li>Utilizará o sistema apenas para finalidades profissionais e lícitas.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#D32F2F] rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">3. Dados de Pacientes e LGPD</h2>
                        </div>
                        <div className="bg-red-50 border-l-4 border-[#D32F2F] p-6 rounded-r-lg mb-4">
                            <p className="text-[#424242] font-semibold">
                                O profissional de saúde é o responsável por garantir base legal e consentimentos aplicáveis para o tratamento de dados pessoais e sensíveis.
                            </p>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <ul className="list-disc pl-6 space-y-2">
                                <li>O usuário atua como controlador dos dados que insere.</li>
                                <li>A VitaView AI atua como operadora, processando dados conforme instruções do usuário e legislação aplicável.</li>
                                <li>É proibido inserir dados sem autorização ou em desacordo com deveres éticos e legais.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Server className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">4. Uso Permitido e Uso Proibido</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>Você concorda em não:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Violar leis, normas profissionais ou direitos de terceiros.</li>
                                <li>Compartilhar contas e acessos com pessoas não autorizadas.</li>
                                <li>Tentar acessar áreas, dados ou sistemas sem permissão.</li>
                                <li>Realizar engenharia reversa, scraping abusivo ou introduzir código malicioso.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">5. Inteligência Artificial e Limites Clínicos</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Recursos de IA têm caráter de apoio e produtividade. Eles não substituem avaliação clínica, diagnóstico médico, prescrição responsável ou decisão profissional.
                            </p>
                            <p>
                                O usuário permanece integralmente responsável pela validação técnica e legal de todo conteúdo clínico gerado, editado ou assinado.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">6. Segurança e Disponibilidade</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>A VitaView AI adota medidas técnicas e organizacionais para proteger os dados, incluindo:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Controle de acesso, auditoria e monitoramento de segurança.</li>
                                <li>Criptografia de dados em trânsito e em repouso, quando aplicável.</li>
                                <li>Rotinas de continuidade e recuperação de serviço.</li>
                            </ul>
                            <p>
                                Podem ocorrer indisponibilidades temporárias por manutenção, atualização, incidentes de terceiros ou fatores fora do controle razoável da plataforma.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">7. Propriedade Intelectual</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Código, marcas, elementos visuais e demais ativos da VitaView AI permanecem protegidos por direitos de propriedade intelectual.
                            </p>
                            <p>
                                O usuário mantém titularidade sobre os dados que insere, observadas as licenças necessárias para operação do serviço.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">8. Suspensão, Encerramento e Violação</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                A VitaView AI poderá suspender ou encerrar contas em caso de violação destes Termos, risco de segurança, fraude, ordem legal ou uso indevido da plataforma.
                            </p>
                            <p>
                                Medidas de bloqueio podem ser adotadas para preservar a integridade do sistema e de dados de terceiros.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">9. Limitação de Responsabilidade</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Na extensão permitida por lei, a VitaView AI não responde por danos indiretos, lucros cessantes, perda de oportunidade ou decisões clínicas tomadas pelo usuário.
                            </p>
                            <p>
                                O usuário concorda em manter a VitaView AI indene por danos decorrentes de uso irregular, inserção indevida de dados, violação legal ou descumprimento destes Termos.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">10. Atualizações dos Termos</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Estes Termos podem ser revisados periodicamente. Alterações relevantes serão comunicadas por meios adequados da plataforma.
                            </p>
                            <p>
                                A continuidade de uso após a publicação da versão atualizada representa aceite dos novos termos.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">11. Contato e Foro</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Em caso de dúvida sobre estes Termos, contate:
                            </p>
                            <p className="font-semibold">
                                E-mail: <a href="mailto:contato@vitaview.ai" className="text-[#212121] underline">contato@vitaview.ai</a>
                            </p>
                            <p>
                                Conflitos serão tratados conforme a legislação brasileira aplicável.
                            </p>
                        </div>
                    </section>

                    <div className="bg-[#212121] text-white p-6 rounded-lg mt-8">
                        <p className="font-semibold text-center">
                            Ao utilizar a VitaView AI, você confirma ciência e concordância com este Termo de Uso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
