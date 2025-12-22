import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, FileText, Users, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function TermsPage() {
    useEffect(() => {
        document.title = "Termos de Uso - VitaView AI";
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
                        <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
                        <p className="text-[#E0E0E0] max-w-2xl">
                            Ao utilizar a plataforma VitaView AI, você concorda com os termos e condições descritos abaixo.
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

                    {/* 1. Aceitação dos Termos */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">1. Aceitação dos Termos</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                Ao criar uma conta e utilizar os serviços da VitaView AI, você declara ter lido, compreendido e
                                concordado integralmente com estes Termos de Uso e com nossa Política de Privacidade.
                            </p>
                            <p className="font-semibold">
                                Se você não concordar com qualquer parte destes termos, não poderá utilizar nossos serviços.
                            </p>
                        </div>
                    </section>

                    {/* 2. Responsabilidade do Usuário */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">2. Responsabilidade do Usuário</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>O usuário é integralmente responsável por:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>
                                    <strong>Consentimento do Paciente:</strong> Obter autorização expressa dos pacientes antes de
                                    inserir qualquer dado pessoal ou de saúde na plataforma, conforme exigido pela LGPD (Lei Geral
                                    de Proteção de Dados) e demais legislações aplicáveis.
                                </li>
                                <li>
                                    <strong>Veracidade das Informações:</strong> Garantir que todos os dados inseridos sejam
                                    verdadeiros, precisos e atualizados.
                                </li>
                                <li>
                                    <strong>Confidencialidade:</strong> Manter sigilo sobre as credenciais de acesso e não
                                    compartilhar sua conta com terceiros.
                                </li>
                                <li>
                                    <strong>Uso Profissional:</strong> Utilizar a plataforma exclusivamente para fins profissionais
                                    de saúde, em conformidade com as regulamentações de sua categoria profissional.
                                </li>
                                <li>
                                    <strong>Conformidade Legal:</strong> Cumprir todas as leis, regulamentos e códigos de ética
                                    aplicáveis à sua profissão e jurisdição.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. Dados de Pacientes */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#D32F2F] rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">3. Dados de Pacientes e Informações Confidenciais</h2>
                        </div>
                        <div className="bg-red-50 border-l-4 border-[#D32F2F] p-6 rounded-r-lg mb-4">
                            <p className="text-[#424242] font-semibold">
                                ⚠️ ATENÇÃO: É de responsabilidade exclusiva do profissional de saúde garantir que possui
                                autorização legal para armazenar e processar dados de pacientes na plataforma.
                            </p>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                O usuário reconhece e concorda que:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>
                                    A VitaView AI atua como <strong>operadora de dados</strong>, enquanto o profissional de saúde
                                    é o <strong>controlador</strong> responsável pelo tratamento dos dados pessoais de seus pacientes.
                                </li>
                                <li>
                                    O usuário é o único responsável por obter o consentimento informado dos pacientes antes de
                                    inserir qualquer informação pessoal ou de saúde na plataforma.
                                </li>
                                <li>
                                    A VitaView AI não se responsabiliza por dados inseridos sem o devido consentimento ou
                                    autorização legal.
                                </li>
                                <li>
                                    Em caso de uso indevido ou ilegal da plataforma, o usuário assume toda e qualquer
                                    responsabilidade civil, criminal e administrativa.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 4. Segurança e Proteção de Dados */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">4. Segurança e Proteção de Dados</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>A VitaView AI se compromete a:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Implementar medidas técnicas e organizacionais adequadas para proteger os dados armazenados.</li>
                                <li>Criptografar dados em trânsito e em repouso.</li>
                                <li>Realizar backups regulares e manter planos de recuperação de desastres.</li>
                                <li>Notificar os usuários em caso de incidentes de segurança que possam afetar seus dados.</li>
                                <li>Manter conformidade com padrões de segurança reconhecidos e com a LGPD.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 5. Limitação de Responsabilidade */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">5. Limitação de Responsabilidade</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                <strong>A VitaView AI NÃO se responsabiliza por:</strong>
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Decisões clínicas tomadas com base nas informações processadas pela plataforma.</li>
                                <li>Danos diretos, indiretos, incidentais ou consequentes decorrentes do uso da plataforma.</li>
                                <li>Inserção de dados sem o devido consentimento dos titulares.</li>
                                <li>Uso indevido das credenciais de acesso por terceiros.</li>
                                <li>Interrupções temporárias do serviço para manutenção ou por fatores externos.</li>
                                <li>Quaisquer reclamações, processos ou demandas judiciais de pacientes relacionadas a dados
                                    inseridos pelo usuário sem a devida autorização.</li>
                            </ul>
                            <p className="font-semibold mt-4">
                                O usuário concorda em indenizar e isentar a VitaView AI de qualquer responsabilidade
                                decorrente de violações destes termos ou de legislações aplicáveis.
                            </p>
                        </div>
                    </section>

                    {/* 6. Uso da Plataforma */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Server className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">6. Uso da Plataforma</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>O usuário concorda em não:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Utilizar a plataforma para fins ilegais ou não autorizados.</li>
                                <li>Tentar acessar sistemas ou dados não autorizados.</li>
                                <li>Compartilhar credenciais de acesso com terceiros.</li>
                                <li>Fazer engenharia reversa ou tentar extrair o código-fonte da plataforma.</li>
                                <li>Inserir dados maliciosos, vírus ou código prejudicial.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 7. Propriedade Intelectual */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">7. Propriedade Intelectual</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Todos os direitos de propriedade intelectual relacionados à plataforma VitaView AI,
                                incluindo software, design, logotipos e conteúdo, pertencem exclusivamente à VitaView AI
                                ou seus licenciadores.
                            </p>
                            <p>
                                Os dados inseridos pelo usuário permanecem de sua propriedade, e a VitaView AI não
                                utiliza esses dados para fins comerciais ou de marketing.
                            </p>
                        </div>
                    </section>

                    {/* 8. Vigência e Rescisão */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">8. Vigência e Rescisão</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Estes termos entram em vigor quando você aceita e cria sua conta, permanecendo válidos
                                enquanto você utilizar nossos serviços.
                            </p>
                            <p>
                                A VitaView AI reserva-se o direito de suspender ou encerrar contas que violem estes
                                termos, sem aviso prévio.
                            </p>
                        </div>
                    </section>

                    {/* 9. Alterações */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">9. Alterações nos Termos</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                A VitaView AI pode modificar estes termos a qualquer momento. Notificaremos os usuários
                                sobre alterações significativas por e-mail ou através da plataforma.
                            </p>
                            <p>
                                O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
                            </p>
                        </div>
                    </section>

                    {/* 10. Contato */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">10. Contato</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Para dúvidas sobre estes termos, entre em contato conosco:
                            </p>
                            <p className="font-semibold">
                                E-mail: <a href="mailto:contato@vitaview.ai" className="text-[#212121] underline">contato@vitaview.ai</a>
                            </p>
                        </div>
                    </section>

                    {/* 11. Legislação Aplicável */}
                    <section className="mb-6">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">11. Legislação Aplicável</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa
                                será resolvida no foro da comarca de [sua cidade], Estado de [seu estado].
                            </p>
                        </div>
                    </section>

                    {/* Final Notice */}
                    <div className="bg-[#212121] text-white p-6 rounded-lg mt-8">
                        <p className="font-semibold text-center">
                            Ao criar uma conta na VitaView AI, você declara ter lido, compreendido e concordado
                            integralmente com todos os termos acima descritos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
