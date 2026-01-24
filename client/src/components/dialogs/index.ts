// Dialog components extracted from health-trends-new.tsx
export { DiagnosisDialog, diagnosisSchema, type DiagnosisFormData } from "./diagnosis-dialog";
export {
    MedicationDialog,
    medicationSchema,
    type MedicationFormData,
    ALL_MEDICATIONS_WITH_PRESENTATIONS,
    FREQUENCIES,
    getMedicationIcon,
    PrescriptionTypeBadge,
    MEDICATION_DATABASE,
    MEDICATION_FORMATS,
    DOSAGE_UNITS,
    PRESCRIPTION_TYPES,
    CONTROLLED_MEDICATIONS,
} from "./medication-dialog";
export { AllergyDialog, allergySchema, type AllergyFormData } from "./allergy-dialog";
export { SurgeryDialog, surgerySchema, type SurgeryFormData } from "./surgery-dialog";
export { ManageAllergiesDialog } from "./manage-allergies-dialog";
export { DoctorDialog, doctorSchema, type DoctorFormData } from "./doctor-dialog";
export { PrescriptionDialog } from "./prescription-dialog";
