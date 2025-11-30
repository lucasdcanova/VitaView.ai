import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, User } from "lucide-react";
import PatientHeader from "@/components/patient-header";

interface DoctorViewProps {
    stats: any;
    isLoading: boolean;
}

export function DoctorView({ stats, isLoading }: DoctorViewProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-1 relative">
                <main className="flex-1 bg-gray-50 px-6 py-8">
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
                                            <Skeleton className="h-4 w-24" />
                                        </CardHeader>
                                        <CardContent>
                                            <Skeleton className="h-8 w-16" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Total de Pacientes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{stats?.totalPatients || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Cadastrados na plataforma
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className={stats?.patientsNeedingCheckup > 0 ? "border-red-200 bg-red-50" : ""}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Check-up Pendente
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-3xl font-bold ${stats?.patientsNeedingCheckup > 0 ? "text-red-600" : ""}`}>
                                                {stats?.patientsNeedingCheckup || 0}
                                            </div>
                                            <p className={`text-xs mt-1 ${stats?.patientsNeedingCheckup > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                                Sem exames há mais de 1 ano
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Exames Recentes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">-</div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Últimos 30 dias
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Patients Needing Attention List */}
                                {stats?.patientsList && stats.patientsList.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                                Pacientes Precisando de Atenção
                                            </CardTitle>
                                            <CardDescription>
                                                Pacientes que não realizam exames há mais de 1 ano.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {stats.patientsList.map((patient: any) => (
                                                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <User className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{patient.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Último exame: {patient.lastExamDate ? new Date(patient.lastExamDate).toLocaleDateString() : "Nunca"}
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

                                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-600">
                                    <h2 className="text-lg font-semibold text-gray-800">Visão geral do consultório</h2>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Acesse "Prontuário do paciente" no menu para visualizar informações detalhadas de um paciente específico.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
