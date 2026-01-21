import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    Printer,
    AlertTriangle,
    Pill,
    Search,
    Shield,
    FileWarning,
    Info
} from "lucide-react";
import type { Profile } from "@shared/schema";
import jsPDF from "jspdf";
import { CONTROLLED_MEDICATIONS } from "@/components/dialogs";

// Tipos de receituário especial no Brasil
const PRESCRIPTION_TYPES = {
    A: {
        name: "Receita A",
        color: "#FFC107",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-400",
        textColor: "text-yellow-800",
        description: "Entorpecentes (Opioides)",
        validity: "30 dias",
        copies: "1 via retida na farmácia + 1 via para paciente"
    },
    B1: {
        name: "Receita B1",
        color: "#2196F3",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-400",
        textColor: "text-blue-800",
        description: "Psicotrópicos (Ansiolíticos, Antidepressivos)",
        validity: "30 dias",
        copies: "1 via retida na farmácia + 1 via para paciente"
    },
    B2: {
        name: "Receita B2",
        color: "#3F51B5",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-400",
        textColor: "text-indigo-800",
        description: "Psicotrópicos Anorexígenos",
        validity: "30 dias",
        copies: "1 via retida na farmácia + 1 via para paciente"
    },
    C: {
        name: "Receita C",
        color: "#9C27B0",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-400",
        textColor: "text-purple-800",
        description: "Retinoides, Imunossupressores",
        validity: "30 dias",
        copies: "2 vias (branca)"
    },
};



interface VitaReceituariosEspeciaisProps {
    patient: Profile;
}

interface PrescriptionItem {
    name: string;
    dosage: string;
    frequency: string;
    quantity: string;
    notes?: string;
}

export default function VitaReceituariosEspeciais({ patient }: VitaReceituariosEspeciaisProps) {
    const { toast } = useToast();
    const { user } = useAuth();

    const [selectedType, setSelectedType] = useState<keyof typeof PRESCRIPTION_TYPES>("B1");
    const [searchQuery, setSearchQuery] = useState("");
    const [prescriptionItem, setPrescriptionItem] = useState<Partial<PrescriptionItem>>({});

    // Filtrar medicamentos por tipo e busca
    const filteredMedications = useMemo(() => {
        return CONTROLLED_MEDICATIONS
            .filter(med => med.prescriptionType === selectedType)
            .filter(med =>
                med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [selectedType, searchQuery]);

    const selectedTypeInfo = PRESCRIPTION_TYPES[selectedType];

    const handleSelectMedication = (medName: string) => {
        setPrescriptionItem(prev => ({ ...prev, name: medName }));
    };

    const generateSpecialPrescriptionPDF = () => {
        if (!prescriptionItem.name || !prescriptionItem.dosage || !prescriptionItem.frequency || !prescriptionItem.quantity) {
            toast({
                title: "Campos incompletos",
                description: "Preencha todos os campos obrigatórios.",
                variant: "destructive"
            });
            return;
        }

        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado.", variant: "destructive" });
            return;
        }

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a5" // A5 para receituário especial
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        let y = 15;

        // Cor de fundo do tipo de receita
        doc.setFillColor(selectedTypeInfo.color);
        doc.rect(0, 0, pageWidth, 25, 'F');

        // Título do receituário
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`RECEITUÁRIO ${selectedTypeInfo.name.toUpperCase()}`, pageWidth / 2, 12, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(selectedTypeInfo.description, pageWidth / 2, 18, { align: "center" });
        doc.text(`Validade: ${selectedTypeInfo.validity}`, pageWidth / 2, 22, { align: "center" });

        y = 35;

        // Dados do médico
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("IDENTIFICAÇÃO DO EMITENTE", margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Nome: ${user.fullName || user.username}`, margin, y);
        y += 4;
        doc.text(`CRM: ${user.crm || "___________"}`, margin, y);
        y += 4;
        doc.text(`Endereço: ___________________________________`, margin, y);
        y += 4;
        doc.text(`Cidade/UF: _____________ Tel: ______________`, margin, y);
        y += 8;

        // Dados do paciente
        doc.setFont("helvetica", "bold");
        doc.text("IDENTIFICAÇÃO DO PACIENTE", margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.text(`Nome: ${patient.name}`, margin, y);
        y += 4;
        doc.text(`Endereço: ___________________________________`, margin, y);
        y += 4;
        doc.text(`Cidade/UF: _____________`, margin, y);
        y += 8;

        // Prescrição
        doc.setFont("helvetica", "bold");
        doc.text("PRESCRIÇÃO", margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        const prescText = `${prescriptionItem.name} - ${prescriptionItem.dosage}`;
        doc.text(prescText, margin, y);
        y += 5;

        doc.setFontSize(9);
        doc.text(`Quantidade: ${prescriptionItem.quantity}`, margin, y);
        y += 4;
        doc.text(`Posologia: ${prescriptionItem.frequency}`, margin, y);
        y += 4;

        if (prescriptionItem.notes) {
            doc.text(`Obs: ${prescriptionItem.notes}`, margin, y);
            y += 4;
        }

        y += 10;

        // Data e assinatura
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        doc.text(`Data: ${dateStr}`, margin, y);
        y += 15;

        doc.line(margin, y, pageWidth - margin, y);
        y += 3;
        doc.setFontSize(8);
        doc.text("Assinatura e Carimbo do Prescritor", pageWidth / 2, y, { align: "center" });

        // Aviso legal
        y += 10;
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text("Este documento deve ser preenchido manualmente pelo profissional de saúde.", pageWidth / 2, y, { align: "center" });
        y += 3;
        doc.text("Modelo para controle interno - A receita física oficial deve ser emitida em formulário apropriado.", pageWidth / 2, y, { align: "center" });

        // Abrir PDF
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');

        toast({ title: "Sucesso", description: "Modelo de receituário gerado!" });
        setPrescriptionItem({});
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Shield className="h-8 w-8 text-blue-600" />
                        Receituários Especiais
                    </h1>
                    <p className="text-gray-500">
                        Modelos para medicamentos controlados de
                        <span className="font-semibold text-primary"> {patient.name}</span>
                    </p>
                </div>

                {/* Doctor Info */}
                <div className="w-full md:w-auto min-w-[250px] bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Médico Prescritor</span>
                    <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.username || "Profissional"}</p>
                    {user?.crm && <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">CRM: {user.crm}</span>}
                </div>
            </div>

            {/* Aviso importante */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-amber-800 font-semibold text-sm">Importante</h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Os receituários especiais (A, B1, B2, C) devem ser emitidos em formulários oficiais
                        específicos fornecidos pela Vigilância Sanitária. Este sistema gera apenas um
                        <strong> modelo para controle interno</strong> e referência do paciente.
                    </p>
                </div>
            </div>

            {/* Tipo de Receituário */}
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as keyof typeof PRESCRIPTION_TYPES)}>
                <TabsList className="grid grid-cols-4 w-full">
                    {Object.entries(PRESCRIPTION_TYPES).map(([key, info]) => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className={`data-[state=active]:${info.bgColor} data-[state=active]:${info.textColor}`}
                        >
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: info.color }}
                                />
                                <span className="hidden sm:inline">{info.name}</span>
                                <span className="sm:hidden">{key}</span>
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {Object.entries(PRESCRIPTION_TYPES).map(([key, info]) => (
                    <TabsContent key={key} value={key} className="mt-4">
                        <Card className={`${info.borderColor} border-2`}>
                            <CardHeader className={`${info.bgColor} border-b ${info.borderColor}`}>
                                <CardTitle className={`text-lg ${info.textColor} flex items-center gap-2`}>
                                    <FileWarning className="h-5 w-5" />
                                    {info.name} - {info.description}
                                </CardTitle>
                                <CardDescription>
                                    Validade: {info.validity} • {info.copies}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Lista de medicamentos */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Search className="h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Buscar medicamento..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>

                                        <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                                            {filteredMedications.length > 0 ? (
                                                filteredMedications.map((med) => (
                                                    <button
                                                        key={med.name}
                                                        onClick={() => handleSelectMedication(med.name)}
                                                        className={`p-3 text-left rounded-lg border transition-all ${prescriptionItem.name === med.name
                                                            ? `${info.bgColor} ${info.borderColor} border-2`
                                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="font-medium text-gray-900">{med.name}</span>
                                                                <span className="text-xs text-gray-500 ml-2">{med.category}</span>
                                                            </div>
                                                            {prescriptionItem.name === med.name && (
                                                                <Badge variant="secondary" className={info.textColor}>Selecionado</Badge>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">Nenhum medicamento encontrado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Formulário de prescrição */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Dados da Prescrição
                                        </h3>

                                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Medicamento</label>
                                                <Input
                                                    value={prescriptionItem.name || ""}
                                                    onChange={(e) => setPrescriptionItem(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Selecione ou digite o medicamento"
                                                    className="h-9 text-sm mt-1"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Dosagem</label>
                                                    <Input
                                                        value={prescriptionItem.dosage || ""}
                                                        onChange={(e) => setPrescriptionItem(prev => ({ ...prev, dosage: e.target.value }))}
                                                        placeholder="Ex: 50mg"
                                                        className="h-9 text-sm mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Quantidade</label>
                                                    <Input
                                                        value={prescriptionItem.quantity || ""}
                                                        onChange={(e) => setPrescriptionItem(prev => ({ ...prev, quantity: e.target.value }))}
                                                        placeholder="Ex: 30 comp"
                                                        className="h-9 text-sm mt-1"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Posologia</label>
                                                <Input
                                                    value={prescriptionItem.frequency || ""}
                                                    onChange={(e) => setPrescriptionItem(prev => ({ ...prev, frequency: e.target.value }))}
                                                    placeholder="Ex: 1 comprimido 1x ao dia"
                                                    className="h-9 text-sm mt-1"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Observações (opcional)</label>
                                                <Input
                                                    value={prescriptionItem.notes || ""}
                                                    onChange={(e) => setPrescriptionItem(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Instruções adicionais"
                                                    className="h-9 text-sm mt-1"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={generateSpecialPrescriptionPDF}
                                            disabled={!prescriptionItem.name || !prescriptionItem.dosage || !prescriptionItem.frequency || !prescriptionItem.quantity}
                                            className="w-full"
                                            style={{ backgroundColor: info.color }}
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Gerar Modelo de Receituário
                                        </Button>

                                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <p>
                                                Este modelo serve apenas como referência. A prescrição oficial deve ser
                                                feita em formulário físico apropriado e assinada pelo médico.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
