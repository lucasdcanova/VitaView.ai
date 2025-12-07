import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, User, Users, FileText, Clock } from "lucide-react";
import PatientHeader from "@/components/patient-header";
import { AgendaWidget } from "@/components/agenda/agenda-widget";
import FloatingPatientBar from "@/components/floating-patient-bar";
import { useProfiles } from "@/hooks/use-profiles";

/**
 * VitaView AI Doctor View Dashboard
 * 
 * Design Language:
 * - Fundo Background Gray (#F4F4F4)
 * - Cards brancos com bordas Light Gray (#E0E0E0)
 * - Tipografia: Montserrat Bold para títulos, Open Sans para corpo
 * - Ícones de linha (outline) em Charcoal Gray (#212121)
 * - Gráficos usando tons de cinza
 */

interface DoctorViewProps {
    stats: any;
    isLoading: boolean;
}

export function DoctorView({ stats, isLoading }: DoctorViewProps) {
    const { activeProfile } = useProfiles();

    return (
        <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
            {/* Floating Patient Bar - Shows when patient is active */}
            <FloatingPatientBar />

            <div className="flex flex-1 relative">
                <main className="flex-1 px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <PatientHeader
                            title="Visão Geral"
                            description="Resumo dos seus pacientes e atividades recentes."
                            patient={undefined}
                            lastExamDate={null}
                            showTitleAsMain={true}
                        />

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i}>
                                        <CardHeader className="pb-2">
                                            <Skeleton className="h-4 w-24 bg-[#E0E0E0]" />
                                        </CardHeader>
                                        <CardContent>
                                            <Skeleton className="h-8 w-16 bg-[#E0E0E0]" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Stats Cards */}
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
                                                {stats?.totalPatients || 0}
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
                                            <div className="text-3xl font-heading font-bold text-[#212121]">-</div>
                                            <p className="text-xs text-[#9E9E9E] mt-1 font-body">
                                                Últimos 30 dias
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Agenda Widget */}
                                <AgendaWidget />

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

                                {/* Empty State / Info Card */}
                                <Card className="border border-dashed border-[#9E9E9E]">
                                    <CardContent className="p-10 text-center">
                                        <h2 className="text-lg font-heading font-bold text-[#212121]">
                                            Visão geral do consultório
                                        </h2>
                                        <p className="text-sm text-[#9E9E9E] mt-2 font-body">
                                            Acesse "Vita Timeline" no menu para visualizar informações detalhadas de um paciente específico.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
