import { useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfiles } from "@/hooks/use-profiles";
import { formatMetricDisplayName } from "@shared/exam-normalizer";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus, FileText, Activity, Clock, Mic, Upload, FileUp, Sparkles,
    Users, User, Building2, CalendarDays, LayoutDashboard, Pill,
    Heart, LineChart, FileSignature, TrendingUp, TrendingDown, Minus,
    AlertTriangle, ClipboardList, ShieldCheck, Loader2, MoreVertical
} from 'lucide-react';
import { FeatureGate } from '@/components/ui/feature-gate';
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TriageCard } from "@/components/dashboard/triage-card";
import { ComorbiditiesCard } from "@/components/dashboard/comorbidities-card";
import { SurgeriesCard } from "@/components/dashboard/surgeries-card";
import { AnamnesisCard } from "@/components/dashboard/anamnesis-card";
import { AllergiesCard } from "@/components/dashboard/allergies-card";

import { DiagnosisDialog, diagnosisSchema, type DiagnosisFormData } from "@/components/dialogs/diagnosis-dialog";
import { SurgeryDialog, surgerySchema, type SurgeryFormData } from "@/components/dialogs/surgery-dialog";
import { RegisterDeathDialog } from "@/components/dialogs/register-death-dialog";

// Lazy load heavy tab components for better initial page load
const HealthTrendsNew = lazy(() => import("./health-trends-new"));
const VitaPrescriptions = lazy(() => import("./vita-prescricoes"));
const VitaCertificates = lazy(() => import("./vita-atestados"));
const VitaSolicitacaoExames = lazy(() => import("./vita-solicitacao-exames"));
const ExamTimeline = lazy(() => import("./exam-timeline"));

import FileUpload from "@/components/ui/file-upload";
import { useUploadManager } from "@/hooks/use-upload-manager";

// Loading skeleton for lazy-loaded tabs
const TabLoadingSkeleton = () => (
    <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
    </div>
);

// Função para calcular idade
const calculateAge = (birthDate: string | null | undefined): number | null => {
    if (!birthDate) return null;
    try {
        return differenceInYears(new Date(), new Date(birthDate));
    } catch {
        return null;
    }
};


export default function PatientView() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showUpload, setShowUpload] = useState(false);
    const [, setLocation] = useLocation();
    const { activeProfile, inServiceAppointmentId } = useProfiles();
    const { uploads } = useUploadManager();
    const isProcessing = uploads.some(u => ['uploading', 'processing', 'queued'].includes(u.status));
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Dialog States
    const [isDiagnosisDialogOpen, setIsDiagnosisDialogOpen] = useState(false);
    const [isSurgeryDialogOpen, setIsSurgeryDialogOpen] = useState(false);
    const [isDeathDialogOpen, setIsDeathDialogOpen] = useState(false);

    // Diagnosis Form & Mutation
    const diagnosisForm = useForm<DiagnosisFormData>({
        resolver: zodResolver(diagnosisSchema),
        defaultValues: {
            cidCode: "",
            diagnosisDate: new Date().toISOString().split('T')[0],
            status: "ativo",
            notes: "",
        },
    });

    const createDiagnosisMutation = useMutation({
        mutationFn: (data: DiagnosisFormData & { profileId?: number }) => apiRequest("POST", "/api/diagnoses", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
            toast({ title: "Sucesso", description: "Diagnóstico registrado com sucesso." });
            setIsDiagnosisDialogOpen(false);
            diagnosisForm.reset();
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao registrar diagnóstico.", variant: "destructive" });
        },
    });

    const onAddDiagnosis = (data: DiagnosisFormData) => {
        createDiagnosisMutation.mutate({ ...data, profileId: activeProfile?.id });
    };

    // Surgery Form & Mutation
    const surgeryForm = useForm<SurgeryFormData>({
        resolver: zodResolver(surgerySchema),
        defaultValues: {
            procedureName: "",
            hospitalName: "",
            surgeonName: "",
            surgeryDate: new Date().toISOString().split('T')[0],
            notes: "",
        },
    });

    const createSurgeryMutation = useMutation({
        mutationFn: (data: SurgeryFormData) => apiRequest("POST", "/api/surgeries", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] });
            toast({ title: "Sucesso", description: "Cirurgia registrada com sucesso." });
            setIsSurgeryDialogOpen(false);
            surgeryForm.reset();
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao registrar cirurgia.", variant: "destructive" });
        },
    });

    const onAddSurgery = (data: SurgeryFormData) => {
        createSurgeryMutation.mutate(data);
    };

    const handleUploadComplete = (result: any) => {
        // If we have a result with an exam ID, navigate to the report page
        if (result && result.exam && result.exam.id) {
            setTimeout(() => {
                setLocation(`/report/${result.exam.id}`);
            }, 1000);
        }
    };

    // Fetch all patient data in a single consolidated query for performance
    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ["/api/patient-dashboard", activeProfile?.id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/patient-dashboard/${activeProfile?.id}`);
            return res.json();
        },
        enabled: !!activeProfile?.id,
        staleTime: 30000, // 30 seconds - data is considered fresh
    });

    // Destructure all the data from the consolidated response
    const {
        diagnoses = [],
        medications = [],
        allergies = [],
        exams = [],
        healthMetrics = [],
        surgeries = [],
        triageHistory = []
    } = dashboardData || {};

    // Filter triage for the current appointment if in service
    const currentTriage = triageHistory.find((t: any) =>
        inServiceAppointmentId && t.appointmentId === inServiceAppointmentId
    ) || null;

    // Get recent items
    const recentExams = exams.slice(0, 3);

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
            <MobileHeader />

            <div className="flex flex-1 relative">
                <Sidebar />

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
                                    {activeProfile ? (
                                        <div className="mt-2">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <p className="text-lg font-semibold text-gray-800">{activeProfile.name}</p>
                                                {calculateAge(activeProfile.birthDate) !== null && (
                                                    <span className="flex items-center gap-1 text-sm text-gray-600">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        {calculateAge(activeProfile.birthDate)} anos
                                                    </span>
                                                )}
                                                {activeProfile.createdAt && (
                                                    <span className="flex items-center gap-1 text-sm text-gray-600">
                                                        <CalendarDays className="h-4 w-4 text-gray-400" />
                                                        Paciente desde {format(new Date(activeProfile.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
                                                    </span>
                                                )}
                                                {activeProfile.insuranceName && (
                                                    <span className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Building2 className="h-4 w-4 text-gray-400" />
                                                        {activeProfile.insuranceName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 mt-1">
                                            Selecione um paciente para visualizar os dados
                                        </p>
                                    )}
                                </div>

                                {/* Doctor Prescriber Info & Actions - Right side of header */}
                                <div className="flex items-center gap-4">
                                    {user && (
                                        <div className="hidden md:flex min-w-[200px] bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex-col items-end flex-shrink-0">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Médico Prescritor</span>
                                            <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.username || "Profissional"}</p>
                                            {user?.crm && <span className="text-xs text-gray-600 font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">CRM: {user.crm}</span>}
                                        </div>
                                    )}

                                    {activeProfile && (
                                        <div className="flex items-center gap-2">
                                            {activeProfile.deceased ? (
                                                <Badge variant="destructive" className="px-3 py-1 flex gap-2 items-center bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                                                    <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                                                    PACIENTE FALECIDO
                                                </Badge>
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                            onClick={() => setIsDeathDialogOpen(true)}
                                                        >
                                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                                            Registrar Óbito
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    )}
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
                                    Atendimento
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prescricoes"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <Pill className="h-4 w-4 mr-2" />
                                    Prescrição
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
                                    Exames
                                </TabsTrigger>
                                <FeatureGate>
                                    <TabsTrigger
                                        value="evolution"
                                        className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                    >
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Evolução
                                    </TabsTrigger>
                                </FeatureGate>
                                <TabsTrigger
                                    value="atestados"
                                    className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                                >
                                    <FileSignature className="h-4 w-4 mr-2" />
                                    Atestados
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
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* SECTION 1: MAIN HIGHLIGHT - ANAMNESIS */}
                                            <div className="w-full">
                                                <AnamnesisCard />
                                            </div>

                                            {/* SECTION 2: ATTENTION NEEDED (Triage & Alerts) - Only shows if data exists */}
                                            {/* SECTION 2: ATTENTION NEEDED (Triage) - Only shows if data exists */}
                                            {currentTriage && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                                        Atenção Imediata
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="md:col-span-2">
                                                            <TriageCard triage={currentTriage} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SECTION 3: CLINICAL HISTORY GRID (2x2 Symmetric Layout) */}
                                            <div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="md:col-span-2">
                                                        <AllergiesCard profileId={activeProfile.id} allergies={allergies} />
                                                    </div>
                                                    <ComorbiditiesCard
                                                        diagnoses={diagnoses}
                                                        onAdd={() => setIsDiagnosisDialogOpen(true)}
                                                    />
                                                    <SurgeriesCard
                                                        surgeries={surgeries}
                                                        onAdd={() => setIsSurgeryDialogOpen(true)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Dialogs */}
                                            <DiagnosisDialog
                                                open={isDiagnosisDialogOpen}
                                                onOpenChange={setIsDiagnosisDialogOpen}
                                                form={diagnosisForm}
                                                onSubmit={onAddDiagnosis}
                                                isPending={createDiagnosisMutation.isPending}
                                                mode="create"
                                            />

                                            <SurgeryDialog
                                                open={isSurgeryDialogOpen}
                                                onOpenChange={setIsSurgeryDialogOpen}
                                                form={surgeryForm}
                                                onSubmit={onAddSurgery}
                                                isPending={createSurgeryMutation.isPending}
                                                mode="create"
                                            />

                                            {activeProfile && (
                                                <RegisterDeathDialog
                                                    open={isDeathDialogOpen}
                                                    onOpenChange={setIsDeathDialogOpen}
                                                    patient={activeProfile}
                                                />
                                            )}
                                        </div>

                                        {/* Recent Exams */}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Vita Prescrições Tab */}
                            <TabsContent value="prescricoes" className="mt-0">
                                {activeProfile ? (
                                    <Suspense fallback={<TabLoadingSkeleton />}>
                                        <VitaPrescriptions patient={activeProfile} medications={medications} allergies={allergies} />
                                    </Suspense>
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


                            {/* Timeline Tab (Histórico do Paciente - Aberto para todos) */}
                            <TabsContent value="timeline" className="mt-0">
                                {activeProfile ? (
                                    <Suspense fallback={<TabLoadingSkeleton />}>
                                        <HealthTrendsNew
                                            embedded={true}
                                            diagnoses={diagnoses}
                                            medications={medications}
                                            allergies={allergies}
                                            surgeries={surgeries}
                                            triageHistory={triageHistory}
                                            exams={exams}
                                            healthMetrics={healthMetrics}
                                        />
                                    </Suspense>
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
                                {!activeProfile ? (
                                    <Card className="text-center py-12">
                                        <CardContent>
                                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum paciente selecionado</h3>
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para gerenciar exames.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
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

                                        {/* Grid: Solicitação de Exames | Upload + Lista */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Left Column: Solicitação de Exames */}
                                            <div>
                                                <Suspense fallback={<TabLoadingSkeleton />}>
                                                    <VitaSolicitacaoExames patient={activeProfile} />
                                                </Suspense>
                                            </div>

                                            {/* Right Column: Upload + Lista de Resultados */}
                                            <div className="space-y-6">
                                                {/* Upload Area */}
                                                <Card className="h-fit">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <Upload className="h-5 w-5 text-primary-600" />
                                                            Enviar Resultados
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Envie os resultados de exames já realizados
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <FileUpload onUploadComplete={handleUploadComplete} />
                                                        <p className="text-xs text-gray-500 text-center">
                                                            PDF, JPG, PNG • Máx 10MB
                                                        </p>

                                                        {/* Tips integrado */}
                                                        <div className="bg-gradient-to-br from-primary-50 to-gray-50 rounded-lg p-4 space-y-3 border border-primary-100">
                                                            <div className="flex items-start gap-2">
                                                                <ShieldCheck className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                                                <p className="text-xs text-gray-600">Seus exames são tratados com segurança e confidencialidade.</p>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <ClipboardList className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                                                                <p className="text-xs text-gray-600">Envie imagens com boa resolução para melhor análise.</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Exams List */}
                                                <Card className="h-fit">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <FileText className="h-5 w-5 text-primary-600" />
                                                                Resultados de Exames
                                                            </CardTitle>
                                                            <Badge variant="outline">{exams.length} exames</Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {exams.length === 0 ? (
                                                            <div className="text-center py-8">
                                                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                                                <h3 className="text-base font-semibold text-gray-800 mb-1">Nenhum resultado enviado</h3>
                                                                <p className="text-sm text-gray-600">Envie os resultados dos exames usando o painel acima.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                                {exams.map((exam: any) => (
                                                                    <div
                                                                        key={exam.id}
                                                                        className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-white transition-all cursor-pointer"
                                                                        onClick={() => setLocation(`/report/${exam.id}`)}
                                                                    >
                                                                        <div className="bg-primary-100 p-2 rounded-lg mr-3">
                                                                            <FileText className="h-5 w-5 text-primary-600" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-medium text-gray-900 truncate text-sm">{exam.name || 'Exame sem título'}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {exam.uploadDate ? format(new Date(exam.uploadDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Data não disponível"}
                                                                            </p>
                                                                        </div>
                                                                        <Badge
                                                                            variant={exam.status === 'analyzed' ? 'default' : 'secondary'}
                                                                            className="ml-3 text-xs"
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
                                )}
                            </TabsContent>

                            {/* Evolution Tab (Gated) */}
                            <TabsContent value="evolution" className="mt-0">
                                {activeProfile ? (
                                    <Suspense fallback={<TabLoadingSkeleton />}>
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-1 w-full">
                                                <ExamTimeline
                                                    embedded={true}
                                                    activeProfile={activeProfile}
                                                    exams={exams}
                                                    healthMetrics={healthMetrics}
                                                />
                                            </div>

                                            {alertMetrics.length > 0 && (
                                                <Card className="border-red-200 bg-red-50 shadow-sm">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                                                            <Activity className="h-5 w-5" />
                                                            Alertas de Sinais Vitais
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                            {alertMetrics.map((metric: any) => (
                                                                <div key={metric.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-200 shadow-sm">
                                                                    <div>
                                                                        <p className="font-medium text-gray-800 text-sm">{formatMetricDisplayName(metric.name)}</p>
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
                                    </Suspense>
                                ) : (
                                    <Card className="text-center py-12">
                                        <CardContent>
                                            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum paciente selecionado</h3>
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para visualizar a evolução clínica.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Vita Atestados Tab */}
                            <TabsContent value="atestados" className="mt-0">
                                {activeProfile ? (
                                    <Suspense fallback={<TabLoadingSkeleton />}>
                                        <VitaCertificates patient={activeProfile} />
                                    </Suspense>
                                ) : (
                                    <Card className="text-center py-12">
                                        <CardContent>
                                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum paciente selecionado</h3>
                                            <p className="text-gray-600 mb-4">Selecione um paciente na sidebar para gerenciar atestados.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>


                        </Tabs>
                    </div>
                </main>
            </div >
        </div >
    );
}
