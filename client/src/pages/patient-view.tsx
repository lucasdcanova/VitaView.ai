import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfiles } from "@/hooks/use-profiles";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Heart,
    LineChart,
    LayoutDashboard,
    Activity,
    Pill,
    AlertTriangle,
    FileText,
    Calendar,
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    Stethoscope,
    Upload,
    FileUpIcon,
    Loader2,
    ClipboardList,
    ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TriageCard } from "@/components/dashboard/triage-card";
import { ComorbiditiesCard } from "@/components/dashboard/comorbidities-card";
import { SurgeriesCard } from "@/components/dashboard/surgeries-card";
import { AnamnesisCard } from "@/components/dashboard/anamnesis-card";
import HealthTrendsNew from "./health-trends-new";
import VitaPrescriptions from "./vita-prescricoes";
import FileUpload from "@/components/ui/file-upload";
import { useUploadManager } from "@/hooks/use-upload-manager";

export default function PatientView() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [, setLocation] = useLocation();
    const { activeProfile } = useProfiles();
    const { uploads } = useUploadManager();
    const isProcessing = uploads.some(u => ['uploading', 'processing', 'queued'].includes(u.status));

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleUploadComplete = (result: any) => {
        // If we have a result with an exam ID, navigate to the report page
        if (result && result.exam && result.exam.id) {
            setTimeout(() => {
                setLocation(`/report/${result.exam.id}`);
            }, 1000);
        }
    };

    // Fetch patient data for dashboard
    const { data: diagnoses = [] } = useQuery<any[]>({
        queryKey: ["/api/diagnoses"],
    });

    const { data: medications = [] } = useQuery<any[]>({
        queryKey: ["/api/medications"],
    });

    const { data: allergies = [] } = useQuery<any[]>({
        queryKey: ["/api/allergies"],
    });

    const { data: exams = [] } = useQuery<any[]>({
        queryKey: ["/api/exams"],
    });

    const { data: healthMetrics = [] } = useQuery<any[]>({
        queryKey: ["/api/health-metrics"],
    });

    const { data: surgeries = [] } = useQuery<any[]>({
        queryKey: ["/api/surgeries"],
    });

    const { data: triageHistory = [] } = useQuery<any[]>({
        queryKey: [`/api/triage/history/${activeProfile?.id}`],
        enabled: !!activeProfile?.id,
    });

    const todayTriage = triageHistory.length > 0 ? triageHistory[0] : null;

    // Get recent items
    const recentExams = exams.slice(0, 3);
    const activeMedications = medications.filter((m: any) => m.isActive);
    const activeDiagnoses = diagnoses.filter((d: any) => d.status === 'ativo' || d.status === 'em_tratamento');

    // Get metrics with alerts
    const alertMetrics = healthMetrics.filter((m: any) => m.status === 'alto' || m.status === 'atenção');

    const getTrendIcon = (change: string | null) => {
        if (!change) return <Minus className="h-4 w-4 text-gray-400" />;
        const value = parseFloat(change);
        if (value > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
        if (value < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <MobileHeader toggleSidebar={toggleSidebar} />

            <div className="flex flex-1 relative">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <main className="flex-1">
                    <div className="p-4 md:p-6">
                        {/* Header */}
                        <header className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <Users className="h-6 w-6" />
                                        Atendimento
                                    </h1>
                                    <p className="text-gray-600">
                                        {activeProfile ? (
                                            <>Paciente: <span className="font-semibold">{activeProfile.name}</span></>
                                        ) : (
                                            "Selecione um paciente para visualizar os dados"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </header>

                        {/* Tabs Navigation */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent pb-px mb-6">
                                <TabsTrigger
                                    value="dashboard"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Dashboard
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prescricoes"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <Pill className="h-4 w-4 mr-2" />
                                    Vita Prescrições
                                </TabsTrigger>
                                <TabsTrigger
                                    value="timeline"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <Heart className="h-4 w-4 mr-2" />
                                    Histórico do Paciente
                                </TabsTrigger>
                                <TabsTrigger
                                    value="laboratorial"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <LineChart className="h-4 w-4 mr-2" />
                                    Vita Exames
                                </TabsTrigger>
                            </TabsList>

                            {/* Dashboard Tab */}
                            <TabsContent value="dashboard" className="mt-0">
                                {!activeProfile ? (
                                    <Card className="text-center py-12">
                                        <CardContent>
                                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum paciente selecionado</h3>
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para visualizar os dados de atendimento.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Main Dashboard Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left Column: Anamnesis & Triage (2/3 width) */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* Anamnesis Section */}
                                                <AnamnesisCard />

                                                {/* Triage and Alerts Section */}
                                                {(todayTriage || alertMetrics.length > 0) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {todayTriage && <TriageCard triage={todayTriage} />}

                                                        {alertMetrics.length > 0 && (
                                                            <Card className={`border-red-200 bg-red-50 ${!todayTriage ? 'md:col-span-2' : ''}`}>
                                                                <CardHeader className="pb-3">
                                                                    <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                                                                        <AlertTriangle className="h-5 w-5" />
                                                                        Métricas que Requerem Atenção
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {alertMetrics.slice(0, 4).map((metric: any) => (
                                                                            <div key={metric.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-200 shadow-sm">
                                                                                <div>
                                                                                    <p className="font-medium text-gray-800 text-sm">{metric.name}</p>
                                                                                    <p className="text-xs text-gray-600">{metric.value} {metric.unit}</p>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    {getTrendIcon(metric.change)}
                                                                                    <Badge variant="destructive" className="text-[10px] h-5">{metric.status}</Badge>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Clinical Summary (1/3 width) */}
                                            <div className="space-y-6">
                                                <ComorbiditiesCard diagnoses={diagnoses} />
                                                <SurgeriesCard surgeries={surgeries} />
                                            </div>
                                        </div>

                                        {/* Recent Exams */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                                                        <FileText className="h-5 w-5" />
                                                        Exames Recentes
                                                    </CardTitle>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-primary-600 hover:text-primary-700"
                                                        onClick={() => setActiveTab("laboratorial")}
                                                    >
                                                        Ver todos
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                {recentExams.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">Nenhum exame enviado ainda</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {recentExams.map((exam: any) => (
                                                            <div key={exam.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors cursor-pointer" onClick={() => setActiveTab("laboratorial")}>
                                                                <FileText className="h-8 w-8 text-primary-100 mr-3" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-gray-900 truncate">{exam.name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {exam.uploadDate ? format(new Date(exam.uploadDate), "dd/MM/yyyy", { locale: ptBR }) : "Data não disponível"}
                                                                    </p>
                                                                </div>
                                                                <Badge variant={exam.status === 'analyzed' ? 'default' : 'secondary'} className="ml-2">
                                                                    {exam.status === 'analyzed' ? 'Analisado' : 'Pendente'}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Vita Prescrições Tab */}
                            <TabsContent value="prescricoes" className="mt-0">
                                {activeProfile ? (
                                    <VitaPrescriptions />
                                ) : (
                                    <Card className="text-center py-12">
                                        <CardContent>
                                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum paciente selecionado</h3>
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para gerenciar prescrições.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Timeline Tab - Redirect to actual page */}
                            <TabsContent value="timeline" className="mt-0">
                                {activeProfile ? (
                                    <HealthTrendsNew embedded={true} />
                                ) : (
                                    <Card className="text-center py-12">
                                        <CardContent>
                                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum paciente selecionado</h3>
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para visualizar o Histórico do Paciente.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Laboratorial Tab - Exames + Upload integrado */}
                            <TabsContent value="laboratorial" className="mt-0">
                                <div className="space-y-6">
                                    {/* Processing Feedback */}
                                    {isProcessing && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                                            <div className="bg-blue-100 p-3 rounded-full">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-blue-900">Processando seus exames...</h3>
                                                <p className="text-blue-700">Nossa IA está analisando seus documentos. Isso pode levar alguns segundos.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Column: Upload Area */}
                                        <div className="lg:col-span-1 space-y-4">
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Upload className="h-5 w-5" />
                                                        Enviar Novos Exames
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Arraste arquivos ou clique para selecionar
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <FileUpload onUploadComplete={handleUploadComplete} />
                                                    <p className="text-xs text-gray-500 text-center mt-3">
                                                        PDF, JPG, PNG • Máx 10MB
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            {/* Tips compacto */}
                                            <Card className="bg-gradient-to-br from-primary-50 to-white">
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="flex items-start gap-2">
                                                        <ShieldCheck className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                                        <p className="text-xs text-gray-600">Seus exames são tratados com segurança e confidencialidade.</p>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <ClipboardList className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                                                        <p className="text-xs text-gray-600">Envie imagens com boa resolução para melhor análise.</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Right Column: Exams List */}
                                        <div className="lg:col-span-2">
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <FileText className="h-5 w-5" />
                                                            Exames do Paciente
                                                        </CardTitle>
                                                        <Badge variant="outline">{exams.length} exames</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    {exams.length === 0 ? (
                                                        <div className="text-center py-12">
                                                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum exame enviado</h3>
                                                            <p className="text-gray-600 mb-4">Envie o primeiro exame do paciente usando o painel ao lado.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                                            {exams.map((exam: any) => (
                                                                <div
                                                                    key={exam.id}
                                                                    className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-white transition-all cursor-pointer"
                                                                    onClick={() => setLocation(`/report/${exam.id}`)}
                                                                >
                                                                    <div className="bg-primary-100 p-2 rounded-lg mr-4">
                                                                        <FileText className="h-6 w-6 text-primary-600" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-gray-900 truncate">{exam.name || 'Exame sem título'}</p>
                                                                        <p className="text-sm text-gray-500">
                                                                            {exam.uploadDate ? format(new Date(exam.uploadDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Data não disponível"}
                                                                        </p>
                                                                    </div>
                                                                    <Badge
                                                                        variant={exam.status === 'analyzed' ? 'default' : 'secondary'}
                                                                        className="ml-4"
                                                                    >
                                                                        {exam.status === 'analyzed' ? 'Analisado' : 'Pendente'}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
