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
                                    Vita Timeline
                                </TabsTrigger>
                                <TabsTrigger
                                    value="laboratorial"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <LineChart className="h-4 w-4 mr-2" />
                                    Vita Exames
                                </TabsTrigger>
                                <TabsTrigger
                                    value="upload"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Enviar Exames
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
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para visualizar a Timeline.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Laboratorial Tab - Redirect to actual page */}
                            <TabsContent value="laboratorial" className="mt-0">
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <LineChart className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Vita Exames</h3>
                                        <p className="text-gray-600 mb-4">Visualize os exames laboratoriais e métricas de saúde do paciente.</p>
                                        <Button onClick={() => setLocation('/results')} className="gap-2">
                                            <LineChart className="h-4 w-4" />
                                            Abrir Vita Exames
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Upload Exams Tab */}
                            <TabsContent value="upload" className="mt-0">
                                <div className="space-y-6">
                                    {/* Upload Limits Info */}
                                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-primary-800 mb-1">Limites de Upload</h3>
                                                <p className="text-sm text-primary-700">
                                                    <span className="font-medium">Plano Gratuito:</span> 1 arquivo por vez •
                                                    <span className="font-medium ml-2">Assinantes:</span> Upload ilimitado
                                                </p>
                                            </div>
                                            <div className="text-primary-600">
                                                <FileUpIcon size={24} />
                                            </div>
                                        </div>
                                    </div>

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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Upload Area */}
                                        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Carregue os exames do paciente</h2>

                                            <FileUpload onUploadComplete={handleUploadComplete} />

                                            <div className="mt-6">
                                                <p className="text-sm text-gray-500 text-center">
                                                    Nossa IA identificará automaticamente o paciente do exame e vinculará ao prontuário correto.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tips */}
                                        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-1">
                                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Dicas</h2>

                                            <div className="space-y-4">
                                                <div className="bg-yellow-50 p-4 rounded-lg">
                                                    <div className="flex">
                                                        <ClipboardList className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={18} />
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">Qualidade dos documentos</h4>
                                                            <p className="text-sm text-gray-600 mt-1">Envie imagens com boa resolução e nitidez para melhor análise.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-primary-50 p-4 rounded-lg">
                                                    <div className="flex">
                                                        <FileText className="text-primary-500 mt-1 mr-3 flex-shrink-0" size={18} />
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">Múltiplos exames</h4>
                                                            <p className="text-sm text-gray-600 mt-1">Envie vários exames simultaneamente para uma análise integrada completa.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <div className="flex">
                                                        <ShieldCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" size={18} />
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">Privacidade garantida</h4>
                                                            <p className="text-sm text-gray-600 mt-1">Seus exames são tratados com segurança e confidencialidade.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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
