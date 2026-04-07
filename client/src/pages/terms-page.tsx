import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, FileText, Users, Server, AlertTriangle, CreditCard, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { isRestrictedAppShell } from "@/lib/app-shell";

const LAST_UPDATED = "07 de abril de 2026";

export default function TermsPage() {
    useEffect(() => {
        document.title = "Termos de Uso - VitaView AI";
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
                        <h1 className="text-4xl font-bold mb-4">Termos de Uso (EULA)</h1>
                        <p className="text-[#E0E0E0] max-w-3xl">
                            Estes Termos, em conjunto com a Política de Privacidade, formam o Contrato de Licença de Usuário Final (EULA)
                            entre a VitaView AI e você. Ao criar conta, baixar ou utilizar o aplicativo, você confirma que leu e aceitou integralmente este documento.
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
                            <h2 className="text-2xl font-bold text-[#212121]">1. Escopo, Aceite e Partes</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                A VitaView AI é uma plataforma clínica para profissionais de saúde, com prontuário eletrônico, agenda médica,
                                gestão de pacientes, prescrição digital, transcrição de consultas e análise de exames com inteligência artificial.
                                É operada por <strong>Lucas Dickel Canova ME</strong>, sediada no Brasil ("VitaView AI", "nós").
                            </p>
                            <p>
                                Este EULA é firmado entre você ("usuário") e a VitaView AI. <strong>A Apple Inc. não é parte deste contrato</strong>.
                                A Apple atua apenas como distribuidora do aplicativo na App Store, conforme detalhado na Seção 11.
                            </p>
                            <p>
                                O uso da plataforma está condicionado ao aceite destes Termos e da{" "}
                                <a href="/privacidade" className="text-[#212121] underline font-semibold">Política de Privacidade</a>.
                            </p>
                            <p className="font-semibold">
                                Se você não concorda com qualquer cláusula, não deve utilizar a plataforma.
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
                                <li>É maior de 18 anos e possui plena capacidade legal para contratar o serviço.</li>
                                <li>É profissional de saúde com registro ativo no respectivo conselho de classe (CRM, COREN, CRO, CRP, CRN, CREFITO etc.) ou integrante autorizado de equipe sob supervisão profissional.</li>
                                <li>Fornecerá dados verdadeiros, completos e atualizados.</li>
                                <li>Manterá o sigilo das credenciais e responderá por toda atividade da conta.</li>
                                <li>Utilizará o sistema apenas para finalidades profissionais lícitas e em conformidade com os deveres éticos do seu conselho de classe.</li>
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
                                O profissional de saúde é responsável por garantir base legal e consentimentos aplicáveis para o tratamento de dados pessoais e sensíveis.
                            </p>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <ul className="list-disc pl-6 space-y-2">
                                <li>O usuário atua como controlador dos dados que insere.</li>
                                <li>A VitaView AI atua como operadora, processando dados conforme instruções do usuário e a legislação aplicável.</li>
                                <li>É proibido inserir dados sem autorização ou em desacordo com deveres éticos e legais.</li>
                                <li>O tratamento de dados pessoais é detalhado na <a href="/privacidade" className="text-[#212121] underline font-semibold">Política de Privacidade</a>, parte integrante deste EULA.</li>
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
                                <li>Realizar engenharia reversa, descompilação, scraping abusivo ou introduzir código malicioso.</li>
                                <li>Usar a plataforma para fins ilegais, fraudulentos ou que violem normas sanitárias e éticas.</li>
                                <li>Revender, sublicenciar ou ceder o acesso ao serviço sem autorização escrita.</li>
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
                                Recursos de IA têm caráter de apoio à produtividade e à organização do atendimento. Eles
                                <strong> não substituem</strong> avaliação clínica, diagnóstico médico, prescrição responsável ou decisão profissional.
                            </p>
                            <p>
                                O usuário permanece <strong>integralmente responsável</strong> pela validação técnica, ética e legal de todo conteúdo clínico
                                gerado, editado, prescrito ou assinado a partir das funcionalidades de IA.
                            </p>
                            <p>
                                Sugestões automáticas, transcrições e análises podem conter erros e devem ser revisadas antes de qualquer uso clínico.
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
                                <li>Controle de acesso, MFA, auditoria e monitoramento de segurança.</li>
                                <li>Criptografia de dados em trânsito (TLS 1.2+) e em repouso, quando aplicável.</li>
                                <li>Rotinas de backup, continuidade e recuperação de serviço.</li>
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
                                Código, marcas, layout, elementos visuais, modelos, conteúdo da plataforma e demais ativos da VitaView AI permanecem
                                protegidos por direitos de propriedade intelectual. Nenhuma cláusula deste EULA transfere titularidade ao usuário.
                            </p>
                            <p>
                                A VitaView AI concede ao usuário uma licença pessoal, intransferível, não exclusiva e revogável para uso do aplicativo,
                                limitada ao escopo deste contrato e ao plano contratado.
                            </p>
                            <p>
                                O usuário mantém titularidade sobre os dados que insere, observadas as licenças necessárias para a operação do serviço.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">8. Assinaturas Auto-Renováveis (App Store)</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p>
                                A VitaView AI oferece assinaturas auto-renováveis no aplicativo iOS/iPadOS/macOS, processadas exclusivamente pela
                                <strong> App Store da Apple via StoreKit</strong>. Os planos disponíveis são:
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left p-3 border-b">Plano</th>
                                            <th className="text-left p-3 border-b">Duração</th>
                                            <th className="text-left p-3 border-b">Preço</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="p-3 border-b">Vita Pro Mensal</td><td className="p-3 border-b">1 mês</td><td className="p-3 border-b">Conforme exibido na App Store no momento da compra</td></tr>
                                        <tr><td className="p-3 border-b">Vita Pro Semestral</td><td className="p-3 border-b">6 meses</td><td className="p-3 border-b">Conforme exibido na App Store no momento da compra</td></tr>
                                        <tr><td className="p-3">Vita Pro Anual</td><td className="p-3">1 ano</td><td className="p-3">Conforme exibido na App Store no momento da compra</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p>
                                <strong>Cobrança:</strong> o pagamento é cobrado na sua conta Apple ID na confirmação da compra.
                            </p>
                            <p>
                                <strong>Renovação automática:</strong> a assinatura é renovada automaticamente, a menos que seja cancelada com pelo menos
                                24 horas de antecedência ao final do período atual. Sua conta Apple ID será cobrada pela renovação dentro das 24 horas
                                anteriores ao final do período atual, no mesmo valor (salvo aumento previamente comunicado).
                            </p>
                            <p>
                                <strong>Como cancelar:</strong> você pode gerenciar suas assinaturas e desativar a renovação automática nos
                                Ajustes da sua conta Apple, acessando <em>Ajustes &gt; [seu nome] &gt; Assinaturas</em> no iPhone/iPad ou
                                <em> Configurações do Sistema &gt; [seu nome] &gt; Mídia e Compras &gt; Assinaturas</em> no Mac.
                                O cancelamento entra em vigor ao final do período já pago.
                            </p>
                            <p>
                                <strong>Reembolsos:</strong> reembolsos relativos a compras feitas pela App Store são geridos exclusivamente pela Apple,
                                conforme os termos disponíveis em <a href="https://support.apple.com/pt-br/HT204084" className="text-[#212121] underline">support.apple.com</a>.
                            </p>
                            <p>
                                <strong>Período de teste gratuito:</strong> quando aplicável ao plano, qualquer parte não usada de um período de teste gratuito
                                será automaticamente perdida ao adquirir uma assinatura paga.
                            </p>
                            <p>
                                Para assinaturas contratadas pela web, o pagamento é processado pelo Stripe, com cobrança no cartão informado no momento da contratação,
                                e o cancelamento é feito no portal de cobrança disponível em "Minha Assinatura".
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">9. Suspensão, Encerramento e Violação</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                A VitaView AI poderá suspender ou encerrar contas em caso de violação destes Termos, risco de segurança, fraude,
                                ordem legal ou uso indevido da plataforma. Medidas de bloqueio podem ser adotadas para preservar a integridade do sistema
                                e de dados de terceiros.
                            </p>
                            <p>
                                Você pode encerrar a sua conta a qualquer momento por meio de <strong>Conta profissional &gt; Privacidade (LGPD) &gt; Excluir minha conta</strong>.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">10. Limitação de Responsabilidade e Garantias</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                O serviço é fornecido "no estado em que se encontra" e "conforme disponível". Na extensão máxima permitida por lei,
                                a VitaView AI não responde por danos indiretos, lucros cessantes, perda de oportunidade, perda de dados decorrente de
                                falha do usuário ou decisões clínicas tomadas pelo usuário a partir de sugestões da plataforma.
                            </p>
                            <p>
                                O usuário concorda em manter a VitaView AI indene por danos decorrentes de uso irregular, inserção indevida de dados,
                                violação legal ou descumprimento destes Termos.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#212121] rounded-lg">
                                <Apple className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121]">11. Disposições da App Store da Apple</h2>
                        </div>
                        <div className="text-[#424242] space-y-4 pl-12">
                            <p className="text-sm italic">
                                As cláusulas a seguir aplicam-se apenas a usuários que obtêm o aplicativo VitaView AI pela App Store da Apple.
                                Em caso de conflito com outras cláusulas deste EULA, estas prevalecem para o licenciamento via Apple, conforme exigido pelo
                                Apple Developer Program License Agreement (Schedule 2).
                            </p>
                            <p>
                                <strong>11.1 Partes do EULA.</strong> Este EULA é firmado entre você e a VitaView AI, e <strong>não com a Apple Inc</strong>.
                                A VitaView AI é a única responsável pelo aplicativo VitaView AI e pelo seu conteúdo.
                            </p>
                            <p>
                                <strong>11.2 Escopo da licença.</strong> A licença concedida por este EULA é limitada a uma licença pessoal, intransferível,
                                de uso do aplicativo nos produtos da marca Apple que você possui ou controla, conforme as Regras de Uso descritas nos
                                Termos de Serviço da App Store.
                            </p>
                            <p>
                                <strong>11.3 Manutenção e suporte.</strong> A VitaView AI é a única responsável por fornecer suporte e manutenção do aplicativo.
                                <strong> A Apple não tem qualquer obrigação de fornecer manutenção ou suporte</strong> ao aplicativo.
                            </p>
                            <p>
                                <strong>11.4 Garantias.</strong> A VitaView AI é responsável por qualquer garantia, expressa ou implícita por lei, na medida em que não seja
                                efetivamente excluída. Em caso de falha do aplicativo em cumprir qualquer garantia aplicável, você poderá notificar a Apple,
                                e a Apple reembolsará o preço de compra do aplicativo a você (se houver). <strong>No máximo permitido pela legislação aplicável,
                                a Apple não terá nenhuma outra obrigação de garantia em relação ao aplicativo</strong>, e quaisquer outras reivindicações,
                                perdas, responsabilidades, danos, custos ou despesas atribuíveis a qualquer falha em conformidade com qualquer garantia serão
                                de responsabilidade exclusiva da VitaView AI.
                            </p>
                            <p>
                                <strong>11.5 Reclamações sobre o produto.</strong> A VitaView AI, e não a Apple, é responsável por endereçar quaisquer reclamações
                                do usuário ou de terceiros relativas ao aplicativo ou à sua posse e uso, incluindo, sem limitação: (i) reclamações de responsabilidade
                                do produto; (ii) qualquer alegação de que o aplicativo não está em conformidade com qualquer requisito legal ou regulatório;
                                e (iii) reclamações decorrentes da legislação de proteção ao consumidor, privacidade ou similar.
                            </p>
                            <p>
                                <strong>11.6 Direitos de propriedade intelectual.</strong> No caso de qualquer reclamação de terceiro de que o aplicativo
                                ou a posse e o uso pelo usuário do aplicativo infringem direitos de propriedade intelectual, <strong>a VitaView AI, e não a Apple,
                                será a única responsável</strong> pela investigação, defesa, acordo e quitação de tal reclamação.
                            </p>
                            <p>
                                <strong>11.7 Conformidade legal.</strong> Você declara e garante que (i) não está localizado em país que esteja sujeito a embargo
                                do governo dos EUA ou que tenha sido designado pelo governo dos EUA como país "patrocinador do terrorismo"; e (ii) não está
                                listado em nenhuma lista do governo dos EUA de partes proibidas ou restritas.
                            </p>
                            <p>
                                <strong>11.8 Beneficiária terceira.</strong> Você reconhece e concorda que <strong>a Apple e suas subsidiárias são beneficiárias terceiras
                                deste EULA</strong>, e que, mediante o aceite dos termos e condições deste EULA, a Apple terá o direito (e será considerada como tendo aceitado o direito)
                                de fazer cumprir este EULA contra você como uma beneficiária terceira deste.
                            </p>
                            <p>
                                <strong>11.9 Contato.</strong> Para qualquer questão relativa a este EULA, contate a VitaView AI pelos canais indicados na Seção 13.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">12. Atualizações dos Termos</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>
                                Estes Termos podem ser revisados periodicamente. Alterações relevantes serão comunicadas por meios adequados da plataforma e,
                                quando exigido por lei, com antecedência razoável.
                            </p>
                            <p>
                                A continuidade de uso após a publicação da versão atualizada representa aceite dos novos termos.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#212121] mb-4">13. Contato e Foro</h2>
                        <div className="text-[#424242] space-y-4">
                            <p>Em caso de dúvida sobre estes Termos, contate:</p>
                            <p>
                                <strong>E-mail:</strong>{" "}
                                <a href="mailto:contato@vitaview.ai" className="text-[#212121] underline">contato@vitaview.ai</a>
                            </p>
                            <p>
                                <strong>Suporte:</strong>{" "}
                                <a href="mailto:suporte@vitaview.ai" className="text-[#212121] underline">suporte@vitaview.ai</a>
                            </p>
                            <p>
                                <strong>Operador:</strong> Lucas Dickel Canova ME, Brasil.
                            </p>
                            <p>
                                Conflitos serão tratados conforme a legislação brasileira aplicável, eleito o foro do domicílio do consumidor quando aplicável.
                            </p>
                        </div>
                    </section>

                    <div className="bg-[#212121] text-white p-6 rounded-lg mt-8">
                        <p className="font-semibold text-center">
                            Ao utilizar a VitaView AI, você confirma ciência e concordância integral com este EULA e com a Política de Privacidade.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
