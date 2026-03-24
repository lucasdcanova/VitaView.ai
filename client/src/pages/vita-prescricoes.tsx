import { usePrescriptionLogic, useCustomMedications } from "@/hooks/use-prescription-logic";
import { useContinuousMedications } from "@/hooks/use-continuous-medications";
import { usePrescriptionHistory } from "@/hooks/use-prescription-history";
import { AlertTriangle } from "lucide-react";

import { MedicationDialog } from "@/components/dialogs";
import type { Profile } from "@shared/schema";

// Sub-components
import { ContinuousMedicationsCard } from "@/components/prescriptions/ContinuousMedicationsCard";
import { MedicationSelector } from "@/components/prescriptions/MedicationSelector";
import { ActivePrescriptionForm } from "@/components/prescriptions/ActivePrescriptionForm";
import { PrescriptionHistory } from "@/components/prescriptions/PrescriptionHistory";
import { MedicationTreatmentSummary } from "@/components/prescriptions/MedicationTreatmentSummary";

interface VitaPrescriptionsProps {
    patient: Profile;
    medications?: any[];
    allergies?: any[];
}

export default function VitaPrescriptions({ patient, medications: propMedications, allergies: propAllergies }: VitaPrescriptionsProps) {
    const logic = usePrescriptionLogic(patient);
    const customMedLogic = useCustomMedications();
    const continuousMedsLogic = useContinuousMedications(patient.id);
    const historyLogic = usePrescriptionHistory(patient.id);

    const displayMedications = continuousMedsLogic.medications.length > 0 ? continuousMedsLogic.medications : (propMedications || []);

    return (
        <div className="space-y-6 pb-20">
            {/* Allergies Warning */}
            {propAllergies && propAllergies.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-red-800 font-semibold text-sm">Alergias Conhecidas</h3>
                        <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                            {propAllergies.map((allergy: any) => (
                                <li key={allergy.id}>
                                    <span className="font-medium">{allergy.allergen}</span>
                                    {allergy.reaction && <span className="text-red-600"> - {allergy.reaction}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <MedicationTreatmentSummary
                medications={displayMedications}
                history={continuousMedsLogic.history}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ContinuousMedicationsCard
                    medications={displayMedications}
                    selectedMedications={continuousMedsLogic.selectedMedications}
                    onToggleSelection={continuousMedsLogic.toggleSelection}
                    onToggleSelectAll={continuousMedsLogic.toggleSelectAll}
                    onAddMedication={continuousMedsLogic.openAddDialog}
                    onEditMedication={continuousMedsLogic.openEditDialog}
                    onDeleteMedication={continuousMedsLogic.handleDelete}
                    onRenewPrescription={() => {
                        // Filter selected meds
                        const selected = displayMedications.filter(m => continuousMedsLogic.selectedMedications.has(m.id));
                        logic.handleRenewPrescription(selected);
                    }}
                />

                <div className="space-y-6">
                    <MedicationSelector
                        onAdd={logic.addMedicationToReceituario}
                        searchValue={logic.receituarioSearchValue}
                        setSearchValue={logic.setReceituarioSearchValue}
                        daysOfUse={logic.receituarioDaysOfUse}
                        setDaysOfUse={logic.setReceituarioDaysOfUse}
                        notes={logic.receituarioNotes}
                        setNotes={logic.setReceituarioNotes}
                        dose={logic.receituarioDose}
                        setDose={logic.setReceituarioDose}
                        doseUnit={logic.receituarioDoseUnit}
                        setDoseUnit={logic.setReceituarioDoseUnit}
                        quantity={logic.receituarioQuantity}
                        setQuantity={logic.setReceituarioQuantity}
                        onAddCustomMedication={(name) => customMedLogic.createCustomMedication({ name })}
                        customMedications={customMedLogic.customMedications}
                        onDeleteCustomMedication={customMedLogic.deleteCustomMedication}
                    />

                    <ActivePrescriptionForm
                        items={logic.acuteItems}
                        observations={logic.prescriptionObservations}
                        onObservationsChange={logic.setPrescriptionObservations}
                        onRemoveItem={logic.removeAcuteItem}
                        onEditItem={logic.editAcuteItem}
                        onSaveAndPrint={logic.handleSaveAndPrintPrescription}
                        onFinalize={logic.handleFinalizePrescription}
                        isEditing={!!logic.editingPrescriptionId}
                    />
                </div>
            </div>

            <PrescriptionHistory
                prescriptions={historyLogic.prescriptions}
                onReprint={(p) => {
                    logic.handleEditPrescription(p);
                }}
                onEdit={logic.handleEditPrescription}
            />

            <MedicationDialog
                open={continuousMedsLogic.isDialogOpen}
                onOpenChange={(open) => {
                    continuousMedsLogic.setIsDialogOpen(open);
                }}
                form={continuousMedsLogic.editingMedication ? continuousMedsLogic.editMedicationForm : continuousMedsLogic.medicationForm}
                onSubmit={continuousMedsLogic.handleSubmit}
                isPending={continuousMedsLogic.isPending}
                mode={continuousMedsLogic.editingMedication ? "edit" : "create"}
                onRemove={continuousMedsLogic.handleDelete}
                isRemovePending={continuousMedsLogic.isPending}
            />
        </div>
    );
}
