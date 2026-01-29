import { Shield, AlertTriangle, FileWarning } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSpecialPrescription } from "@/hooks/use-special-prescription";
import { PRESCRIPTION_TYPES } from "@/constants/special-prescription-types";
import { MedicationList } from "@/components/special-prescription/MedicationList";
import { PrescriptionForm } from "@/components/special-prescription/PrescriptionForm";
import type { Profile } from "@shared/schema";

interface VitaReceituariosEspeciaisProps {
    patient: Profile;
}

export default function VitaReceituariosEspeciais({ patient }: VitaReceituariosEspeciaisProps) {
    const {
        selectedType, setSelectedType,
        searchQuery, setSearchQuery,
        prescriptionItem, setPrescriptionItem,
        filteredMedications,
        handleSelectMedication,
        handleGeneratePDF,
        user
    } = useSpecialPrescription(patient);

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
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
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
                                    <MedicationList
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        filteredMedications={filteredMedications}
                                        selectedMedicationName={prescriptionItem.name}
                                        onSelectMedication={handleSelectMedication}
                                        selectedType={selectedType}
                                    />

                                    {/* Formulário de prescrição */}
                                    <PrescriptionForm
                                        prescriptionItem={prescriptionItem}
                                        setPrescriptionItem={setPrescriptionItem}
                                        onGeneratePDF={handleGeneratePDF}
                                        selectedType={selectedType}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
