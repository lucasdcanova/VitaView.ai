import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertCircle,
    User,
    Users,
    FileText,
    Clock,
    Plus,
    Calendar,
    Upload,
    ArrowRight,
    Lightbulb,
    CheckCircle2,
    TrendingUp,
    Activity,
    Stethoscope
} from "lucide-react";
import PatientHeader from "@/components/patient-header";
import { AgendaWidget } from "@/components/agenda/agenda-widget";
import FloatingPatientBar from "@/components/floating-patient-bar";
import CreatePatientDialog from "@/components/create-patient-dialog";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { useProfiles } from "@/hooks/use-profiles";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

/**
 * VitaView AI Doctor View Dashboard - Redesigned
 * 
 * Features:
 * - Quick Actions: New Patient, Schedule, Upload Exam
 * - Real stats with data
 * - Getting Started guide for new users
 * - Agenda Widget
 * - Alerts for patients needing attention
 */

interface DoctorViewProps {
    stats: any;
    isLoading: boolean;
}

export function DoctorView({ stats, isLoading }: DoctorViewProps) {
    const { activeProfile, profiles } = useProfiles();
    const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);

    // Fetch recent exams
    const { data: recentExams } = useQuery({
        queryKey: ["/api/exams/recent"],
        queryFn: async () => {
            const res = await fetch("/api/exams?limit=5");
            if (!res.ok) return [];
            const data = await res.json();
            return data.exams || [];
        },
    });

    const isNewUser = !profiles || profiles.length === 0;
    const hasExams = recentExams && recentExams.length > 0;

    // Quick Actions
    const quickActions = [
        {
            icon: <Plus className="h-5 w-5" />,
            label: "Novo Paciente",
            description: "Cadastrar paciente",
            href: "/dashboard",
            onClick: () => {
                setIsCreatePatientOpen(true);
            },
            color: "bg-[#212121] hover:bg-[#424242] text-white"
        },
        {
            icon: <Calendar className="h-5 w-5" />,
            label: "Agendar",
            description: "Nova consulta",
            href: "/agenda",
            color: "bg-white hover:bg-[#F4F4F4] text-[#212121] border border-[#E0E0E0]"
        },
        {
            icon: <Upload className="h-5 w-5" />,
            label: "Enviar Exame",
            description: "Upload de PDF",
            href: "/upload",
            color: "bg-white hover:bg-[#F4F4F4] text-[#212121] border border-[#E0E0E0]"
        },
        {
            icon: <Activity className="h-5 w-5" />,
            label: "Vita Timeline",
            description: "Ver paciente",
            href: "/exam-timeline",
            color: "bg-white hover:bg-[#F4F4F4] text-[#212121] border border-[#E0E0E0]"
        }
    ];

    // Getting Started Steps
    const gettingStartedSteps = [
        {
            step: 1,
            title: "Cadastre seu primeiro paciente",
            description: "Clique no botão para adicionar um novo paciente.",
            completed: profiles && profiles.length > 0,
            action: "Adicionar Paciente",
            href: "/dashboard",
            onClick: () => setIsCreatePatientOpen(true)
        },
        {
            step: 2,
            title: "Envie um exame",
            description: "Faça upload de um PDF de exame laboratorial para análise automática.",
            completed: hasExams,
            action: "Enviar Exame",
            href: "/upload",
            onClick: undefined
        },
        {
            step: 3,
            title: "Visualize a Timeline",
            description: "Acesse a Vita Timeline para ver o histórico completo do paciente.",
            completed: false,
            action: "Ver Timeline",
            href: "/exam-timeline",
            onClick: undefined
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
            {/* Floating Patient Bar - Shows when patient is active */}
            <FloatingPatientBar />

            <div className="flex flex-1 relative">
                <main className="flex-1 px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <PatientHeader
                            title="Bem-vindo ao VitaView AI"
                            description="Gerencie seus pacientes, exames e consultas em um só lugar."
                            patient={undefined}
                            lastExamDate={null}
                            showTitleAsMain={true}
                        />

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                {[...Array(4)].map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-6">
                                            <Skeleton className="h-12 w-12 rounded-lg bg-[#E0E0E0] mb-4" />
                                            <Skeleton className="h-4 w-24 bg-[#E0E0E0]" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Quick Actions */}
                                <section data-tour="quick-actions">
                                    <h2 className="text-lg font-heading font-bold text-[#212121] mb-4">
                                        Ações Rápidas
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {quickActions.map((action, index) => (
                                            <motion.div
                                                key={action.label}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                {action.onClick ? (
                                                    <button
                                                        onClick={action.onClick}
                                                        className={`w-full p-4 rounded-xl flex flex-col items-center text-center transition-all duration-200 ${action.color}`}
                                                    >
                                                        <div className="mb-2">{action.icon}</div>
                                                        <span className="font-heading font-bold text-sm">{action.label}</span>
                                                        <span className="text-xs opacity-70 mt-1">{action.description}</span>
                                                    </button>
                                                ) : (
                                                    <Link href={action.href}>
                                                        <div className={`p-4 rounded-xl flex flex-col items-center text-center transition-all duration-200 cursor-pointer ${action.color}`}>
                                                            <div className="mb-2">{action.icon}</div>
                                                            <span className="font-heading font-bold text-sm">{action.label}</span>
                                                            <span className="text-xs opacity-70 mt-1">{action.description}</span>
                                                        </div>
                                                    </Link>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>

                                {/* Stats Row */}
                                <section>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Total Patients Card */}
                                        <Card className="border-[#E0E0E0]">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-body text-[#9E9E9E]">
                                                        Total de Pacientes
                                                    </CardTitle>
                                                    <Users className="h-5 w-5 text-[#9E9E9E]" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-heading font-bold text-[#212121]">
                                                    {stats?.totalPatients || profiles?.length || 0}
                                                </div>
                                                <p className="text-xs text-[#9E9E9E] mt-1 font-body">
                                                    Cadastrados na plataforma
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Patients Needing Checkup Card */}
                                        <Card className={`border-[#E0E0E0] ${stats?.patientsNeedingCheckup > 0
                                            ? "border-l-4 border-l-[#D32F2F]"
                                            : ""
                                            }`}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-body text-[#9E9E9E]">
                                                        Check-up Pendente
                                                    </CardTitle>
                                                    <Clock className="h-5 w-5 text-[#9E9E9E]" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className={`text-3xl font-heading font-bold ${stats?.patientsNeedingCheckup > 0
                                                    ? "text-[#D32F2F]"
                                                    : "text-[#212121]"
                                                    }`}>
                                                    {stats?.patientsNeedingCheckup || 0}
                                                </div>
                                                <p className={`text-xs mt-1 font-body ${stats?.patientsNeedingCheckup > 0
                                                    ? "text-[#D32F2F]"
                                                    : "text-[#9E9E9E]"
                                                    }`}>
                                                    Sem exames há mais de 1 ano
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Recent Exams Card */}
                                        <Card className="border-[#E0E0E0]">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-body text-[#9E9E9E]">
                                                        Exames Recentes
                                                    </CardTitle>
                                                    <FileText className="h-5 w-5 text-[#9E9E9E]" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-heading font-bold text-[#212121]">
                                                    {recentExams?.length || 0}
                                                </div>
                                                <p className="text-xs text-[#9E9E9E] mt-1 font-body">
                                                    Últimos 30 dias
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </section>

                                {/* Getting Started Guide - Show for new users */}
                                {isNewUser && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="border-2 border-[#212121] bg-gradient-to-br from-white to-[#F4F4F4]">
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-[#212121] rounded-lg">
                                                        <Lightbulb className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="font-heading text-[#212121]">
                                                            Comece por aqui!
                                                        </CardTitle>
                                                        <CardDescription className="text-[#9E9E9E]">
                                                            Siga os passos abaixo para começar a usar o VitaView AI
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {gettingStartedSteps.map((item, index) => (
                                                        <div
                                                            key={item.step}
                                                            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${item.completed
                                                                ? "bg-green-50 border border-green-200"
                                                                : "bg-white border border-[#E0E0E0]"
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed
                                                                ? "bg-green-500 text-white"
                                                                : "bg-[#E0E0E0] text-[#212121]"
                                                                }`}>
                                                                {item.completed ? (
                                                                    <CheckCircle2 className="h-5 w-5" />
                                                                ) : (
                                                                    <span className="font-bold">{item.step}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className={`font-heading font-bold ${item.completed ? "text-green-700" : "text-[#212121]"
                                                                    }`}>
                                                                    {item.title}
                                                                </h4>
                                                                <p className="text-sm text-[#9E9E9E]">
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                            {!item.completed && (
                                                                item.onClick ? (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-[#212121] hover:bg-[#424242] text-white"
                                                                        onClick={item.onClick}
                                                                    >
                                                                        {item.action}
                                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Link href={item.href}>
                                                                        <Button size="sm" className="bg-[#212121] hover:bg-[#424242] text-white">
                                                                            {item.action}
                                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                                        </Button>
                                                                    </Link>
                                                                )
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.section>
                                )}

                                {/* Agenda Widget */}
                                <AgendaWidget />

                                {/* Recent Exams List */}
                                {hasExams && (
                                    <Card className="border-[#E0E0E0]">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="font-heading text-[#212121]">
                                                        Últimos Exames
                                                    </CardTitle>
                                                    <CardDescription className="text-[#9E9E9E] font-body">
                                                        Exames enviados recentemente
                                                    </CardDescription>
                                                </div>
                                                <Link href="/history">
                                                    <Button variant="outline" size="sm">
                                                        Ver Todos
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {recentExams.slice(0, 5).map((exam: any) => (
                                                    <div
                                                        key={exam.id}
                                                        className="flex items-center justify-between p-3 border border-[#E0E0E0] rounded-lg hover:bg-[#F4F4F4] transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-lg bg-[#E0E0E0] flex items-center justify-center">
                                                                <FileText className="h-5 w-5 text-[#9E9E9E]" />
                                                            </div>
                                                            <div>
                                                                <p className="font-heading font-bold text-[#212121] text-sm">
                                                                    {exam.examType || "Exame"}
                                                                </p>
                                                                <p className="text-xs text-[#9E9E9E] font-body">
                                                                    {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Link href={`/results/${exam.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                Ver
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Patients Needing Attention List */}
                                {stats?.patientsList && stats.patientsList.length > 0 && (
                                    <Card className="border-[#E0E0E0]">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 font-heading text-[#212121]">
                                                <AlertCircle className="h-5 w-5 text-[#D32F2F]" />
                                                Pacientes Precisando de Atenção
                                            </CardTitle>
                                            <CardDescription className="text-[#9E9E9E] font-body">
                                                Pacientes que não realizam exames há mais de 1 ano.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {stats.patientsList.map((patient: any) => (
                                                    <div
                                                        key={patient.id}
                                                        className="flex items-center justify-between p-4 border border-[#E0E0E0] rounded-lg bg-white hover:bg-[#F4F4F4] transition-all duration-200"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#E0E0E0] flex items-center justify-center">
                                                                <User className="h-5 w-5 text-[#9E9E9E]" />
                                                            </div>
                                                            <div>
                                                                <p className="font-heading font-bold text-[#212121]">
                                                                    {patient.name}
                                                                </p>
                                                                <p className="text-sm text-[#9E9E9E] font-body">
                                                                    Último exame: {patient.lastExamDate
                                                                        ? new Date(patient.lastExamDate).toLocaleDateString()
                                                                        : "Nunca"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/patients?id=${patient.id}`}>
                                                                Ver Detalhes
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Patient Dialog */}
            <CreatePatientDialog
                open={isCreatePatientOpen}
                onOpenChange={setIsCreatePatientOpen}
            />

            {/* Onboarding Tour */}
            <OnboardingTour />
        </div>
    );
}
