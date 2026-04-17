import {
  useState,
  useEffect,
  lazy,
  Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { Tabs,
  TabsContent,
  TabsList,
  TabsTrigger } from "@/components/ui/tabs";
import { useProfiles } from "@/hooks/use-profiles";
import { formatMetricDisplayName } from "@shared/exam-normalizer";
import { useQuery } from "@tanstack/react-query";
import { Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Mic,
  Sparkles,
  Users,
  User,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Pill,
  Heart,
  LineChart,
  FileSignature,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  MoreVertical,
  HeartCrack,
} from "lucide-react";
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
import { AppointmentExamHistoryDialog } from "@/components/exams/appointment-exam-history-dialog";
import { ExamUploadLauncher } from "@/components/exams/exam-upload-launcher";
import { AppointmentExamWorkspace } from "@/components/exams/appointment-exam-workspace";

// Lazy load heavy tab components for better initial page load
const HealthTrendsNew = lazy(() => import("./health-trends-new"));
const VitaPrescriptions = lazy(() => import("./vita-prescricoes"));
const VitaCertificates = lazy(() => import("./vita-atestados"));
const VitaSolicitacaoExames = lazy(() => import("./vita-solicitacao-exames"));
const ExamTimeline = lazy(() => import("./exam-timeline"));

import { useUploadManager } from "@/hooks/use-upload-manager";
import { BrandLoader } from "@/components/ui/brand-loader";
import { setExamReturnContext } from "@/lib/exam-navigation";

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
    const [, setLocation] = useLocation();
    const { activeProfile, inServiceAppointmentId, setActiveProfile } = useProfiles();
    const { uploads } = useUploadManager();
    const isProcessing = uploads.some(
        (upload) =>
            ['uploading', 'processing', 'queued'].includes(upload.status) &&
            (!activeProfile?.id || upload.profileId === activeProfile.id)
    );
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isMobile = useIsMobile();

    // Dialog States
    const [isDiagnosisDialogOpen, setIsDiagnosisDialogOpen] = useState(false);
    const [isSurgeryDialogOpen, setIsSurgeryDialogOpen] = useState(false);
    const [isDeathDialogOpen, setIsDeathDialogOpen] = useState(false);
    const [isExamHistoryDialogOpen, setIsExamHistoryDialogOpen] = useState(false);

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
        mutationFn: async (data: SurgeryFormData) => {
            if (!activeProfile?.id) {
                throw new Error("Selecione um paciente antes de registrar uma cirurgia.");
            }
            return apiRequest("POST", "/api/surgeries", {
                ...data,
                profileId: activeProfile.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] });
            if (activeProfile?.id) {
                queryClient.invalidateQueries({ queryKey: [`/api/surgeries?profileId=${activeProfile.id}`] });
            }
            setIsSurgeryDialogOpen(false);
            surgeryForm.reset();
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error?.message || "Erro ao registrar cirurgia.", variant: "destructive" });
        },
    });

    const onAddSurgery = (data: SurgeryFormData) => {
        createSurgeryMutation.mutate(data);
    };

    // Fetch all patient data in a single consolidated query for performance
    const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery({
        queryKey: ["/api/patient-dashboard", activeProfile?.id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/patient-dashboard/${activeProfile?.id}`);
            return res.json();
        },
        enabled: !!activeProfile?.id,
        retry: (failureCount, error: any) => error?.status !== 403 && failureCount < 1,
        staleTime: 30000, // 30 seconds - data is considered fresh
    });

    useEffect(() => {
        const error = dashboardError as any;
        if (error?.status !== 403) return;

        setActiveProfile(null);
        toast({
            title: "Paciente indisponível",
            description: "O paciente selecionado não está mais disponível para este usuário. Selecione outro paciente.",
            variant: "destructive",
        });
        setLocation("/pacientes");
    }, [dashboardError, setActiveProfile, setLocation, toast]);

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

    const activeDiagnoses = diagnoses.filter((d: any) => d.status === 'ativo' || d.status === 'em_tratamento');

    // Get metrics with alerts
    const alertMetrics = healthMetrics.filter((m: any) => m.status === 'alto' || m.status === 'atenção');

    const getTrendIcon = (change: string | null) => {
        if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
        const value = parseFloat(change);
        if (value > 0) return <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />;
        if (value < 0) return <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    const getAlertMetricCardClassName = (status: string | null | undefined) => {
        const normalizedStatus = status?.toLowerCase() || '';

        if (normalizedStatus === 'atenção' || normalizedStatus === 'atencao') {
            return 'border-amber-200/80 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/15';
        }

        return 'border-red-200/80 bg-white/90 dark:border-red-900/60 dark:bg-red-950/15';
    };

    const getAlertMetricBadgeClassName = (status: string | null | undefined) => {
        const normalizedStatus = status?.toLowerCase() || '';

        if (normalizedStatus === 'atenção' || normalizedStatus === 'atencao') {
            return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-200';
        }

        return 'border-red-200 bg-red-100 text-red-800 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-200';
    };

    const openExamReportFromAppointment = (examId: number) => {
        setIsExamHistoryDialogOpen(false);
        setExamReturnContext({
            path: "/atendimento",
            label: "Voltar ao atendimento",
        });
        setLocation(`/report/${examId}`);
    };

    const openExamHistoryFromAppointment = () => {
        setIsExamHistoryDialogOpen(true);
    };

    useEffect(() => {
        setIsExamHistoryDialogOpen(false);
    }, [activeProfile?.id]);

    return (
        <div className="flex h-full flex-col bg-background">
            <main className="flex-1 overflow-y-auto bg-background">
                <div className={isMobile ? "p-2.5 pt-1" : "p-4 md:p-6"}>
                        {/* Header */}
                        {isMobile ? (
                            /* ── Mobile: Premium compact patient strip ── */
                            <header className="sticky top-0 z-30 mb-2.5 bg-background py-1">
                                {activeProfile ? (
                                    <div className="rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-black/[0.06] dark:border-white/10 px-3.5 py-2.5 shadow-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-[15px] text-foreground tracking-tight truncate">
                                                    {activeProfile.name}
                                                    {calculateAge(activeProfile.birthDate) !== null && (
                                                        <span className="font-medium text-muted-foreground text-xs ml-1.5">· {calculateAge(activeProfile.birthDate)} anos</span>
                                                    )}
                                                </p>
                                                {activeProfile.insuranceName && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{activeProfile.insuranceName}</p>
                                                )}
                                            </div>
                                            {activeProfile.deceased ? (
                                                <Badge variant="destructive" className="px-2 py-0.5 flex gap-1 items-center bg-red-100 text-red-800 border-red-200 text-[10px] shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
                                                    FALECIDO
                                                </Badge>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 rounded-lg transition-colors shrink-0"
                                                    onClick={() => setIsDeathDialogOpen(true)}
                                                    title="Registrar Óbito"
                                                >
                                                    <HeartCrack className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 px-3.5 py-3 text-center">
                                        <p className="text-sm text-muted-foreground">Selecione um paciente na sidebar</p>
                                    </div>
                                )}
                            </header>
                        ) : (
                            /* ── Desktop: Full header ── */
                            <header className="sticky top-0 z-20 mb-6 bg-background py-2">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                            <Users className="h-6 w-6" />
                                            Atendimento
                                        </h1>
                                        {activeProfile ? (
                                            <div className="mt-2">
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <p className="text-lg font-semibold text-foreground">{activeProfile.name}</p>
                                                    {calculateAge(activeProfile.birthDate) !== null && (
                                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {calculateAge(activeProfile.birthDate)} anos
                                                        </span>
                                                    )}
                                                    {activeProfile && (
                                                        <div className="ml-2">
                                                            {activeProfile.deceased ? (
                                                                <Badge variant="destructive" className="px-2 py-0.5 flex gap-1.5 items-center bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
                                                                    PACIENTE FALECIDO
                                                                </Badge>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 rounded-md transition-colors"
                                                                    onClick={() => setIsDeathDialogOpen(true)}
                                                                >
                                                                    <HeartCrack className="h-3.5 w-3.5 mr-1" />
                                                                    <span className="text-xs font-medium">Registrar Óbito</span>
                                                                </Button>
                                                            )}
                                                        </div>
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
                                            <p className="text-gray-600 mt-1 text-sm">
                                                Selecione um paciente para visualizar os dados
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {user && (
                                            <div className="hidden md:flex min-w-[200px] bg-card px-4 py-2 rounded-lg border border-border shadow-sm flex-col items-end flex-shrink-0">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Médico Prescritor</span>
                                                <p className="font-semibold text-foreground text-sm">{user?.fullName || user?.username || "Profissional"}</p>
                                                {user?.crm && <span className="text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded border border-border">CRM: {user.crm}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </header>
                        )}

                        {/* Tabs Navigation */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            {isMobile ? (
                                /* ── Mobile: Premium pill-style tabs ── */
                                <TabsList className="w-full justify-start rounded-none bg-transparent p-0 mb-2.5 overflow-x-auto flex-nowrap gap-1 border-b-0 scrollbar-hide">
                                    <TabsTrigger
                                        value="dashboard"
                                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-transparent text-muted-foreground bg-transparent transition-all data-[state=active]:bg-[#212121] data-[state=active]:text-white data-[state=active]:border-[#212121] data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 dark:data-[state=active]:border-white"
                                    >
                                        <LayoutDashboard className="h-3 w-3 mr-1" />
                                        Atendimento
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="timeline"
                                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-transparent text-muted-foreground bg-transparent transition-all data-[state=active]:bg-[#212121] data-[state=active]:text-white data-[state=active]:border-[#212121] data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 dark:data-[state=active]:border-white"
                                    >
                                        <Heart className="h-3 w-3 mr-1" />
                                        Histórico
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="prescricoes"
                                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-transparent text-muted-foreground bg-transparent transition-all data-[state=active]:bg-[#212121] data-[state=active]:text-white data-[state=active]:border-[#212121] data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 dark:data-[state=active]:border-white"
                                    >
                                        <Pill className="h-3 w-3 mr-1" />
                                        Prescrição
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="laboratorial"
                                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-transparent text-muted-foreground bg-transparent transition-all data-[state=active]:bg-[#212121] data-[state=active]:text-white data-[state=active]:border-[#212121] data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 dark:data-[state=active]:border-white"
                                    >
                                        <LineChart className="h-3 w-3 mr-1" />
                                        Exames
                                    </TabsTrigger>
                                    <FeatureGate>
                                        <TabsTrigger
                                            value="evolution"
                                            className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-transparent text-muted-foreground bg-transparent transition-all data-[state=active]:bg-[#212121] data-[state=active]:text-white data-[state=active]:border-[#212121] data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 dark:data-[state=active]:border-white"
                                        >
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Evolução
                                        </TabsTrigger>
                                    </FeatureGate>
                                    <TabsTrigger
                                        value="atestados"
                                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-transparent text-muted-foreground bg-transparent transition-all data-[state=active]:bg-[#212121] data-[state=active]:text-white data-[state=active]:border-[#212121] data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 dark:data-[state=active]:border-white"
                                    >
                                        <FileSignature className="h-3 w-3 mr-1" />
                                        Atestados
                                    </TabsTrigger>
                                </TabsList>
                            ) : (
                                /* ── Desktop: Standard tabs ── */
                                <TabsList className="border-b border-border w-full justify-start rounded-none bg-transparent pb-px mb-6">
                                    <TabsTrigger value="dashboard" className="data-[state=active]:border-primary data-[state=active]:text-primary-foreground data-[state=active]:bg-primary border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 text-gray-600 hover:text-gray-800">
                                        <LayoutDashboard className="h-4 w-4 mr-2" />
                                        Atendimento
                                    </TabsTrigger>
                                    <TabsTrigger value="timeline" className="data-[state=active]:border-primary data-[state=active]:text-primary-foreground data-[state=active]:bg-primary border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800">
                                        <Heart className="h-4 w-4 mr-2" />
                                        Histórico do Paciente
                                    </TabsTrigger>
                                    <TabsTrigger value="prescricoes" className="data-[state=active]:border-primary data-[state=active]:text-primary-foreground data-[state=active]:bg-primary border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800">
                                        <Pill className="h-4 w-4 mr-2" />
                                        Prescrição
                                    </TabsTrigger>
                                    <TabsTrigger value="laboratorial" className="data-[state=active]:border-primary data-[state=active]:text-primary-foreground data-[state=active]:bg-primary border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800">
                                        <LineChart className="h-4 w-4 mr-2" />
                                        Exames
                                    </TabsTrigger>
                                    <FeatureGate>
                                        <TabsTrigger value="evolution" className="data-[state=active]:border-primary data-[state=active]:text-primary-foreground data-[state=active]:bg-primary border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800">
                                            <TrendingUp className="h-4 w-4 mr-2" />
                                            Evolução
                                        </TabsTrigger>
                                    </FeatureGate>
                                    <TabsTrigger value="atestados" className="data-[state=active]:border-primary data-[state=active]:text-primary-foreground data-[state=active]:bg-primary border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800">
                                        <FileSignature className="h-4 w-4 mr-2" />
                                        Atestados
                                    </TabsTrigger>
                                </TabsList>
                            )}

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
                                                    <BrandLoader className="w-8 h-8 text-blue-600 animate-spin" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-blue-900">Processando seus exames...</h3>
                                                    <p className="text-blue-700">Nossa IA está analisando seus documentos. Isso pode levar alguns segundos.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grid: Solicitação de Exames | Upload + Lista */}
                                        {(() => {
                                            const uploadAndExamsCards = (
                                                <div className="space-y-6">
                                                    <ExamUploadLauncher
                                                        exams={exams}
                                                        title="Enviar resultados"
                                                        description="Envie exames e laudos deste paciente. O status e a leitura rápida aparecem abaixo sem sair do atendimento."
                                                        buttonLabel="Abrir central"
                                                    />

                                                    <AppointmentExamWorkspace
                                                        profileId={activeProfile?.id}
                                                        exams={exams}
                                                        healthMetrics={healthMetrics}
                                                        onOpenExam={openExamReportFromAppointment}
                                                        onOpenHistory={openExamHistoryFromAppointment}
                                                        onOpenEvolution={() => setActiveTab("evolution")}
                                                    />
                                                </div>
                                            );

                                            return isMobile ? (
                                                /* Mobile: single column, upload injected between Nova Solicitação and Histórico */
                                                <div className="space-y-6">
                                                    <Suspense fallback={<TabLoadingSkeleton />}>
                                                        <VitaSolicitacaoExames patient={activeProfile} middleSlot={uploadAndExamsCards} />
                                                    </Suspense>
                                                </div>
                                            ) : (
                                                /* Desktop: exams workspace + request management */
                                                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-6">
                                                    <div className="space-y-6">
                                                        {uploadAndExamsCards}
                                                    </div>
                                                    <div>
                                                        <Suspense fallback={<TabLoadingSkeleton />}>
                                                            <VitaSolicitacaoExames patient={activeProfile} />
                                                        </Suspense>
                                                    </div>
                                                </div>
                                            );
                                        })()}
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
                                                <Card className="overflow-hidden border-red-200/80 bg-gradient-to-br from-red-50 via-white to-red-50/70 shadow-sm dark:border-red-900/60 dark:from-red-950/40 dark:via-slate-950 dark:to-zinc-950">
                                                    <CardHeader className="pb-3 border-b border-red-100/80 dark:border-red-900/40">
                                                        <CardTitle className="text-red-800 dark:text-red-100 flex items-center gap-3 text-base">
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-200">
                                                                <AlertTriangle className="h-4.5 w-4.5" />
                                                            </span>
                                                            Alerta de alterações relevantes
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="pt-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                            {alertMetrics.map((metric: any) => (
                                                                <div
                                                                    key={metric.id}
                                                                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 shadow-sm ${getAlertMetricCardClassName(metric.status)}`}
                                                                >
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-foreground text-sm">{formatMetricDisplayName(metric.name)}</p>
                                                                        <p className="text-xs text-muted-foreground">{metric.value} {metric.unit}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {getTrendIcon(metric.change)}
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-[10px] h-5 capitalize ${getAlertMetricBadgeClassName(metric.status)}`}
                                                                        >
                                                                            {metric.status}
                                                                        </Badge>
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


                            {activeProfile && (
                                <RegisterDeathDialog
                                    open={isDeathDialogOpen}
                                    onOpenChange={setIsDeathDialogOpen}
                                    patient={activeProfile}
                                />
                            )}

                            {activeProfile && (
                                <AppointmentExamHistoryDialog
                                    open={isExamHistoryDialogOpen}
                                    onOpenChange={setIsExamHistoryDialogOpen}
                                    exams={exams}
                                    patientName={activeProfile.name}
                                    onOpenExam={openExamReportFromAppointment}
                                />
                            )}

                        </Tabs>
                </div>
            </main>
        </div>
    );
}
