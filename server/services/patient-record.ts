import { pool } from "../db";
import logger from "../logger";
import { ensureMedicationSchema } from "./medication-management";

type PatientRecordLists = {
  diagnoses: any[];
  medications: any[];
  allergies: any[];
};

const uniqueList = (items: (string | null | undefined)[]) => {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim()))));
};

export async function fetchPatientRecord(userId: number, profileId?: number | null): Promise<PatientRecordLists> {
  try {
    await ensureMedicationSchema();

    const [diagnosesResult, medicationsResult, allergiesResult] = await Promise.all([
      profileId
        ? pool.query(
            `SELECT id, cid_code, diagnosis_date, status, notes
               FROM diagnoses
              WHERE user_id = $1
                AND profile_id = $2
              ORDER BY diagnosis_date DESC`,
            [userId, profileId]
          )
        : pool.query(
            `SELECT id, cid_code, diagnosis_date, status, notes
               FROM diagnoses
              WHERE user_id = $1
              ORDER BY diagnosis_date DESC`,
            [userId]
          ),
      profileId
        ? pool.query(
            `SELECT id, name, format, dosage, frequency, notes, start_date, end_date, is_active
               FROM medications
              WHERE profile_id = $1
                AND is_active = true
              ORDER BY created_at DESC`,
            [profileId]
          )
        : pool.query(
            `SELECT id, name, format, dosage, frequency, notes, start_date, end_date, is_active
               FROM medications
              WHERE user_id = $1
                AND is_active = true
              ORDER BY created_at DESC`,
            [userId]
          ),
      profileId
        ? pool.query(
            `SELECT id, allergen, allergen_type, reaction, severity, notes
               FROM allergies
              WHERE user_id = $1
                AND profile_id = $2
              ORDER BY created_at DESC`,
            [userId, profileId]
          )
        : pool.query(
            `SELECT id, allergen, allergen_type, reaction, severity, notes
               FROM allergies
              WHERE user_id = $1
              ORDER BY created_at DESC`,
            [userId]
          )
    ]);
    
    return {
      diagnoses: diagnosesResult.rows || [],
      medications: medicationsResult.rows || [],
      allergies: allergiesResult.rows || []
    };
  } catch (error) {
    logger.error("[PatientRecord] Falha ao buscar prontuário do paciente", {
      userId,
      error
    });
    return { diagnoses: [], medications: [], allergies: [] };
  }
}

export async function buildPatientRecordContext(userId: number, baseData: any = {}) {
  const requestedProfileId = Number.parseInt(String(baseData?.profileId ?? ""), 10);
  const record = await fetchPatientRecord(userId, Number.isFinite(requestedProfileId) ? requestedProfileId : null);
  
  const diagnosisLabels = record.diagnoses.map((diagnosis) => {
    const status = diagnosis.status ? ` (${diagnosis.status})` : "";
    return `${diagnosis.cid_code}${status}`.trim();
  });
  
  const medicationLabels = record.medications.map((medication) => {
    if (!medication.name) return null;
    const dosage = medication.dosage ? ` - ${medication.dosage}` : "";
    const frequency = medication.frequency ? ` (${medication.frequency})` : "";
    return `${medication.name}${dosage}${frequency}`.trim();
  });
  
  const allergyLabels = record.allergies.map((allergy) => {
    const severity = allergy.severity ? ` (${allergy.severity})` : "";
    return `${allergy.allergen}${severity}`.trim();
  });
  
  const mergedDiseases = uniqueList([...(baseData?.diseases || []), ...diagnosisLabels]);
  const mergedAllergies = uniqueList([...(baseData?.allergies || []), ...allergyLabels]);
  const mergedMedications = uniqueList([...(baseData?.medications || []), ...medicationLabels]);
  
  return {
    ...(baseData || {}),
    diseases: mergedDiseases,
    allergies: mergedAllergies,
    medications: mergedMedications,
    medicalRecord: record
  };
}
