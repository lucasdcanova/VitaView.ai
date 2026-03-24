import { pool } from "../db";

type MedicationRow = {
  id: number;
  user_id: number;
  profile_id: number | null;
  name: string;
  format: string | null;
  dosage: string | null;
  dosage_unit: string | null;
  frequency: string | null;
  dose_amount: number | null;
  prescription_type: string | null;
  quantity: string | null;
  administration_route: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: Date | string;
};

type MedicationHistoryRow = {
  id: number;
  medication_id: number | null;
  user_id: number;
  profile_id: number;
  event_type: string;
  name: string;
  format: string | null;
  dosage: string | null;
  dosage_unit: string | null;
  frequency: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  occurred_at: Date | string;
  metadata: unknown;
};

export type MedicationHistoryEventPayload = {
  medicationId?: number | null;
  userId: number;
  profileId: number;
  eventType: "started" | "stopped" | "updated";
  name: string;
  format?: string | null;
  dosage?: string | null;
  dosageUnit?: string | null;
  frequency?: string | null;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  metadata?: unknown;
};

let ensureMedicationSchemaPromise: Promise<void> | null = null;

export function ensureMedicationSchema() {
  if (!ensureMedicationSchemaPromise) {
    ensureMedicationSchemaPromise = (async () => {
      await pool.query(
        "ALTER TABLE medications ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id)"
      );
      await pool.query(
        "ALTER TABLE medications ADD COLUMN IF NOT EXISTS end_date TEXT"
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS idx_medications_profile_id ON medications(profile_id)"
      );
      await pool.query(
        `CREATE TABLE IF NOT EXISTS medication_history (
          id SERIAL PRIMARY KEY,
          medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          name TEXT NOT NULL,
          format TEXT,
          dosage TEXT,
          dosage_unit TEXT DEFAULT 'mg',
          frequency TEXT,
          notes TEXT,
          start_date TEXT,
          end_date TEXT,
          occurred_at TIMESTAMP DEFAULT NOW() NOT NULL,
          metadata JSONB
        )`
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS idx_medication_history_profile_id ON medication_history(profile_id, occurred_at DESC)"
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS idx_medication_history_medication_id ON medication_history(medication_id)"
      );
    })().catch((error) => {
      ensureMedicationSchemaPromise = null;
      throw error;
    });
  }

  return ensureMedicationSchemaPromise;
}

export function serializeMedication(row: MedicationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    name: row.name,
    format: row.format,
    dosage: row.dosage,
    dosageUnit: row.dosage_unit,
    frequency: row.frequency,
    doseAmount: row.dose_amount,
    prescriptionType: row.prescription_type,
    quantity: row.quantity,
    administrationRoute: row.administration_route,
    notes: row.notes,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function serializeMedicationHistory(row: MedicationHistoryRow) {
  return {
    id: row.id,
    medicationId: row.medication_id,
    userId: row.user_id,
    profileId: row.profile_id,
    eventType: row.event_type,
    name: row.name,
    format: row.format,
    dosage: row.dosage,
    dosageUnit: row.dosage_unit,
    frequency: row.frequency,
    notes: row.notes,
    startDate: row.start_date,
    endDate: row.end_date,
    occurredAt: row.occurred_at,
    metadata: row.metadata,
  };
}

export async function createMedicationHistoryEvent(payload: MedicationHistoryEventPayload) {
  await ensureMedicationSchema();

  await pool.query(
    `INSERT INTO medication_history (
      medication_id,
      user_id,
      profile_id,
      event_type,
      name,
      format,
      dosage,
      dosage_unit,
      frequency,
      notes,
      start_date,
      end_date,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      payload.medicationId ?? null,
      payload.userId,
      payload.profileId,
      payload.eventType,
      payload.name,
      payload.format ?? null,
      payload.dosage ?? null,
      payload.dosageUnit ?? "mg",
      payload.frequency ?? null,
      payload.notes ?? null,
      payload.startDate ?? null,
      payload.endDate ?? null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ]
  );
}

export async function getMedicationHistoryForProfile(profileId: number) {
  await ensureMedicationSchema();

  const [historyResult, medicationResult] = await Promise.all([
    pool.query<MedicationHistoryRow>(
      `SELECT *
         FROM medication_history
        WHERE profile_id = $1
        ORDER BY occurred_at DESC, id DESC`,
      [profileId]
    ),
    pool.query<MedicationRow>(
      `SELECT *
         FROM medications
        WHERE profile_id = $1
        ORDER BY created_at DESC, id DESC`,
      [profileId]
    ),
  ]);

  const historyRows = historyResult.rows;
  const historyByMedicationId = new Map<number, Set<string>>();

  for (const row of historyRows) {
    if (!row.medication_id) continue;
    const events = historyByMedicationId.get(row.medication_id) ?? new Set<string>();
    events.add(row.event_type);
    historyByMedicationId.set(row.medication_id, events);
  }

  const synthesizedRows: Array<ReturnType<typeof serializeMedicationHistory> & { synthetic: boolean }> = [];

  for (const medication of medicationResult.rows) {
    const knownEvents = historyByMedicationId.get(medication.id) ?? new Set<string>();

    if (!knownEvents.has("started")) {
      synthesizedRows.push({
        id: -medication.id,
        medicationId: medication.id,
        userId: medication.user_id,
        profileId: medication.profile_id ?? profileId,
        eventType: "started",
        name: medication.name,
        format: medication.format,
        dosage: medication.dosage,
        dosageUnit: medication.dosage_unit,
        frequency: medication.frequency,
        notes: medication.notes,
        startDate: medication.start_date,
        endDate: medication.end_date,
        occurredAt: medication.created_at,
        metadata: { source: "medications_table" },
        synthetic: true,
      });
    }

    if (!medication.is_active && medication.end_date && !knownEvents.has("stopped")) {
      synthesizedRows.push({
        id: -(medication.id * 1000),
        medicationId: medication.id,
        userId: medication.user_id,
        profileId: medication.profile_id ?? profileId,
        eventType: "stopped",
        name: medication.name,
        format: medication.format,
        dosage: medication.dosage,
        dosageUnit: medication.dosage_unit,
        frequency: medication.frequency,
        notes: medication.notes,
        startDate: medication.start_date,
        endDate: medication.end_date,
        occurredAt: medication.end_date,
        metadata: { source: "medications_table" },
        synthetic: true,
      });
    }
  }

  return [...historyRows.map(serializeMedicationHistory), ...synthesizedRows].sort((left, right) => {
    const leftDate = new Date(left.occurredAt).getTime();
    const rightDate = new Date(right.occurredAt).getTime();
    return rightDate - leftDate;
  });
}
