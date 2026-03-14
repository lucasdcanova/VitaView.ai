import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import { JSDOM } from "jsdom";

const { Pool } = pg;

type CsvRow = Record<string, string>;

type DoctorContext = {
  id: number;
  email: string | null;
  username: string;
  full_name: string | null;
  clinic_id: number | null;
  clinic_role: string | null;
};

type LegacyPatient = {
  patientId: string;
  name: string;
  gender: string | null;
  birthDate: string | null;
  cpf: string | null;
  rg: string | null;
  phone: string | null;
  landline: string | null;
  profession: string | null;
  maritalStatus: string | null;
  insurancePlanName: string | null;
  insuranceCompanyName: string | null;
  insurancePlanNumber: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  cep: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  createdAt: Date | null;
};

type LegacyAppointment = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  medicalRecordId: string | null;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  createdAt: Date | null;
};

type LegacyEvolution = {
  medicalRecordId: string;
  patientId: string;
  text: string;
  professionalName: string | null;
  date: Date;
  createdAt: Date;
};

const args = process.argv.slice(2);
const doctorEmail = args.find((arg) => !arg.startsWith("--"));
const execute = args.includes("--execute");
const exportDirArg = args.find((arg) => arg.startsWith("--export-dir="))?.split("=")[1];

if (!doctorEmail) {
  console.error("Usage: npx tsx scripts/import-legacy-doctor-data.ts <doctor-email> [--execute] [--export-dir=/path/to/export]");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const exportDir = exportDirArg
  ? path.resolve(exportDirArg)
  : path.resolve(process.cwd(), "Importacao de sitema antigo", "export-11426176");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

function parseDelimited(content: string, delimiter = ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (!inQuotes && char === "\r") {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((value) => value !== ""));
}

function parseCsvFile(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf8");
  const rows = parseDelimited(content, ";");
  if (rows.length === 0) return [];

  const header = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) => {
    const record: CsvRow = {};
    header.forEach((column, index) => {
      record[column] = (values[index] ?? "").trim();
    });
    return record;
  });
}

function cleanValue(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned === "[object Object]") return null;
  return cleaned;
}

function normalizeCpf(value?: string | null): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length !== 11) return cleaned;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function normalizePhone(value?: string | null): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;

  let digits = cleaned.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return cleaned;
}

function normalizeCep(value?: string | null): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return cleaned;
}

function normalizeDateOnly(value?: string | null): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return null;
}

function parseLegacyTimestamp(value?: string | null): Date | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;

  const normalized = cleaned
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseCityState(value?: string | null): { city: string | null; state: string | null } {
  const cleaned = cleanValue(value);
  if (!cleaned) return { city: null, state: null };

  const match = cleaned.match(/^(.*?)\s*\(([A-Z]{2})\)$/);
  if (match) {
    return {
      city: cleanValue(match[1]),
      state: cleanValue(match[2]),
    };
  }

  return { city: cleaned, state: null };
}

function normalizeGender(value?: string | null): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const lowered = cleaned.toLowerCase();
  if (lowered.startsWith("masc") || lowered === "m") return "masculino";
  if (lowered.startsWith("fem") || lowered === "f") return "feminino";
  return lowered;
}

function diffMinutes(start: string | null, end: string | null): number {
  if (!start || !end) return 30;
  const startDate = parseLegacyTimestamp(start);
  const endDate = parseLegacyTimestamp(end);
  if (!startDate || !endDate) return 30;

  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  return minutes > 0 ? minutes : 30;
}

function mapAppointmentType(row: CsvRow): string {
  const description = (cleanValue(row.description) || "").toLowerCase();
  const legacyType = (cleanValue(row.type_desc) || "").toLowerCase();

  if (description.includes("retorno") || row.is_follow_up === "t") return "retorno";
  if (description.includes("exame")) return "exames";
  if (legacyType.includes("proced")) return "procedimento";
  return "consulta";
}

function mapAppointmentStatus(row: CsvRow): string {
  const legacyStatus = (cleanValue(row.status_desc) || "").toLowerCase();
  const medicalRecordStatus = (cleanValue(row.medical_record_status_desc) || "").toLowerCase();

  if (legacyStatus === "cancelado") return "cancelled";
  if (medicalRecordStatus === "atendido") return "completed";
  if (medicalRecordStatus === "atendendo") return "in_progress";
  if (medicalRecordStatus === "em espera") return "waiting";
  if (medicalRecordStatus === "faltou") return "cancelled";
  return "scheduled";
}

function composeNotes(parts: Array<string | null | undefined>): string | null {
  const normalized = parts
    .map((part) => cleanValue(part))
    .filter((part): part is string => Boolean(part));

  if (normalized.length === 0) return null;
  return normalized.join("\n\n");
}

function htmlToPlainText(html: string): string {
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(ul|ol)>/gi, "\n");

  const dom = new JSDOM(`<body>${withLineBreaks}</body>`);
  return (dom.window.document.body.textContent || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getDoctorName(doctor: DoctorContext): string {
  return doctor.full_name || doctor.username || doctor.email || "Profissional";
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function buildLegacyPatients(): LegacyPatient[] {
  const patients = parseCsvFile(path.join(exportDir, "pacientes.csv"));
  const phones = parseCsvFile(path.join(exportDir, "pacientes_telefones.csv"));

  const phonesByPatientId = new Map<string, CsvRow[]>();
  for (const row of phones) {
    const patientId = cleanValue(row.patient_id);
    const number = cleanValue(row.number);
    if (!patientId || !number) continue;
    const current = phonesByPatientId.get(patientId) || [];
    current.push(row);
    phonesByPatientId.set(patientId, current);
  }

  return patients.map((row) => {
    const patientId = row.patient_id;
    const phoneRows = (phonesByPatientId.get(patientId) || []).sort((left, right) => {
      const leftMain = left.main === "t" ? 1 : 0;
      const rightMain = right.main === "t" ? 1 : 0;
      if (leftMain !== rightMain) return rightMain - leftMain;

      const weight = (value: string) => {
        switch ((cleanValue(value) || "").toLowerCase()) {
          case "celular":
            return 4;
          case "contato":
            return 3;
          case "residencial":
            return 2;
          case "comercial":
            return 1;
          default:
            return 0;
        }
      };

      return weight(right.type_desc) - weight(left.type_desc);
    });

    const normalizedPhones = phoneRows
      .map((phoneRow) => ({
        type: cleanValue(phoneRow.type_desc) || "",
        number: normalizePhone(phoneRow.number),
      }))
      .filter((phoneRow): phoneRow is { type: string; number: string } => Boolean(phoneRow.number));

    const primaryPhone = normalizedPhones[0]?.number || null;
    const secondaryPhone = normalizedPhones.find((phoneRow) => phoneRow.number !== primaryPhone)?.number || null;
    const extraPhones = normalizedPhones
      .map((phoneRow) => phoneRow.number)
      .filter((number, index, allNumbers) => number !== primaryPhone && number !== secondaryPhone && allNumbers.indexOf(number) === index);

    const { city, state } = parseCityState(row.address_city_desc);
    const legacyObservation = cleanValue(row.observation);
    const bmi = cleanValue(row.bmi);

    return {
      patientId,
      name: cleanValue(row.name) || cleanValue(row.patient_name) || `Paciente ${patientId}`,
      gender: normalizeGender(row.gender_desc),
      birthDate: normalizeDateOnly(row.birth_date),
      cpf: normalizeCpf(row.cpf),
      rg: cleanValue(row.rg),
      phone: primaryPhone,
      landline: secondaryPhone,
      profession: cleanValue(row.occupation),
      maritalStatus: cleanValue(row.marital_status_desc),
      insurancePlanName: cleanValue(row.insurance_plan_name),
      insuranceCompanyName: cleanValue(row.insurance_company_name),
      insurancePlanNumber: cleanValue(row.insurance_plan_number),
      street: cleanValue(row.address_line1),
      number: cleanValue(row.address_number),
      complement: cleanValue(row.address_complement),
      neighborhood: cleanValue(row.address_line2),
      cep: normalizeCep(row.address_zip_code),
      city,
      state,
      notes: composeNotes([
        legacyObservation ? `Observação do cadastro legado: ${legacyObservation}` : null,
        bmi ? `IMC legado: ${bmi}` : null,
        extraPhones.length > 0 ? `Telefones adicionais do legado: ${extraPhones.join(", ")}` : null,
      ]),
      createdAt: parseLegacyTimestamp(row.inserted_date),
    };
  });
}

function buildLegacyAppointments(): LegacyAppointment[] {
  const appointments = parseCsvFile(path.join(exportDir, "agendamentos.csv"));

  return appointments.map((row) => {
    const startDate = cleanValue(row.start_date_hour) || "";
    const date = startDate.slice(0, 10);
    const time = startDate.slice(11, 16) || "00:00";
    const legacyMedicalRecordStatus = cleanValue(row.medical_record_status_desc);

    return {
      appointmentId: row.appointment_id,
      patientId: row.patient_id,
      patientName: cleanValue(row.patient_name) || "Paciente sem nome",
      medicalRecordId: cleanValue(row.medical_record_id),
      date,
      time,
      duration: diffMinutes(row.start_date_hour, row.end_date_hour),
      type: mapAppointmentType(row),
      status: mapAppointmentStatus(row),
      notes: composeNotes([
        cleanValue(row.description),
        cleanValue(row.observation),
        legacyMedicalRecordStatus === "Faltou" ? "Status legado: faltou à consulta." : null,
      ]),
      createdAt: parseLegacyTimestamp(row.inserted_date) || parseLegacyTimestamp(row.start_date_hour),
    };
  });
}

function buildLegacyEvolutions(): LegacyEvolution[] {
  const medicalRecords = parseCsvFile(path.join(exportDir, "prontuarios.csv"));
  const answers = parseCsvFile(path.join(exportDir, "prontuarios_respostas.csv"));

  const answersByMedicalRecordId = new Map<string, CsvRow>();
  for (const row of answers) {
    const medicalRecordId = cleanValue(row.medical_record_id);
    if (!medicalRecordId) continue;
    answersByMedicalRecordId.set(medicalRecordId, row);
  }

  return medicalRecords
    .map((row) => {
      const medicalRecordId = cleanValue(row.medical_record_id);
      if (!medicalRecordId) return null;
      const answerRow = answersByMedicalRecordId.get(medicalRecordId);
      const answer = cleanValue(answerRow?.answer);
      if (!answer) return null;

      const text = htmlToPlainText(answer);
      if (!text) return null;

      const date = parseLegacyTimestamp(row.start_date_hour);
      if (!date) return null;

      return {
        medicalRecordId,
        patientId: row.patient_id,
        text,
        professionalName: cleanValue(row.doctor_name),
        date,
        createdAt: date,
      } satisfies LegacyEvolution;
    })
    .filter((row): row is LegacyEvolution => Boolean(row));
}

async function getDoctor(email: string): Promise<DoctorContext> {
  const result = await pool.query<DoctorContext>(
    `
      select id, email, username, full_name, clinic_id, clinic_role
      from users
      where lower(email) = lower($1)
      limit 1
    `,
    [email],
  );

  const doctor = result.rows[0];
  if (!doctor) {
    throw new Error(`Doctor not found for email ${email}`);
  }

  return doctor;
}

async function auditTarget(doctor: DoctorContext) {
  const counts: Record<string, number> = {};
  const queries: Array<[string, string, number | null]> = [
    ["profiles", "select count(*)::int as count from profiles where user_id = $1", doctor.id],
    ["appointments", "select count(*)::int as count from appointments where user_id = $1", doctor.id],
    ["evolutions", "select count(*)::int as count from evolutions where user_id = $1", doctor.id],
    ["diagnoses", "select count(*)::int as count from diagnoses where user_id = $1", doctor.id],
    ["allergies", "select count(*)::int as count from allergies where user_id = $1", doctor.id],
    ["notifications", "select count(*)::int as count from notifications where user_id = $1", doctor.id],
    ["clinic_profiles", "select count(*)::int as count from profiles where clinic_id = $1", doctor.clinic_id],
    ["clinic_appointments", "select count(*)::int as count from appointments where clinic_id = $1", doctor.clinic_id],
  ];

  for (const [key, query, value] of queries) {
    if (value === null) {
      counts[key] = 0;
      continue;
    }

    const result = await pool.query<{ count: number }>(query, [value]);
    counts[key] = Number(result.rows[0]?.count ?? 0);
  }

  return counts;
}

async function run() {
  const doctor = await getDoctor(doctorEmail);
  if (!doctor.clinic_id) {
    throw new Error(`Doctor ${doctorEmail} does not have clinic_id configured.`);
  }

  const targetAudit = await auditTarget(doctor);
  const patients = buildLegacyPatients();
  const appointments = buildLegacyAppointments();
  const evolutions = buildLegacyEvolutions();

  const patientIdSet = new Set(patients.map((patient) => patient.patientId));
  const appointmentsWithoutPatient = appointments.filter((appointment) => !patientIdSet.has(appointment.patientId));
  const evolutionsWithoutPatient = evolutions.filter((evolution) => !patientIdSet.has(evolution.patientId));

  const summary = {
    mode: execute ? "execute" : "dry-run",
    exportDir,
    doctor: {
      id: doctor.id,
      email: doctor.email,
      clinicId: doctor.clinic_id,
      name: getDoctorName(doctor),
    },
    targetAudit,
    sourceCounts: {
      patients: patients.length,
      appointments: appointments.length,
      evolutions: evolutions.length,
      appointmentsWithoutPatient: appointmentsWithoutPatient.length,
      evolutionsWithoutPatient: evolutionsWithoutPatient.length,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  const targetNotEmpty = Object.entries(targetAudit)
    .filter(([key]) => !key.startsWith("clinic_"))
    .some(([, value]) => value > 0);
  const clinicNotEmpty = (targetAudit.clinic_profiles || 0) > 0 || (targetAudit.clinic_appointments || 0) > 0;

  if (targetNotEmpty || clinicNotEmpty) {
    throw new Error("Target account or clinic is not empty. Aborting import to avoid duplicates.");
  }

  if (appointmentsWithoutPatient.length > 0 || evolutionsWithoutPatient.length > 0) {
    throw new Error("Legacy source has appointments or evolutions without matching patient records.");
  }

  if (!execute) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const profileIdByLegacyPatientId = new Map<string, number>();
    let importedPatients = 0;
    for (const patientChunk of chunkArray(patients, 100)) {
      const values: unknown[] = [];
      const placeholders = patientChunk.map((patient, patientIndex) => {
        const insuranceName = patient.insuranceCompanyName || patient.insurancePlanName;
        const baseIndex = patientIndex * 24;
        values.push(
          doctor.id,
          doctor.clinic_id,
          patient.name,
          "paciente",
          patient.birthDate,
          patient.gender,
          patient.insurancePlanName,
          patient.cpf,
          patient.rg,
          patient.phone,
          patient.landline,
          patient.cep,
          patient.street,
          patient.number,
          patient.complement,
          patient.neighborhood,
          patient.city,
          patient.state,
          patient.profession,
          patient.maritalStatus,
          patient.insurancePlanNumber,
          insuranceName,
          patient.notes,
          patient.createdAt,
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, false, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15}, $${baseIndex + 16}, $${baseIndex + 17}, $${baseIndex + 18}, $${baseIndex + 19}, $${baseIndex + 20}, $${baseIndex + 21}, $${baseIndex + 22}, $${baseIndex + 23}, coalesce($${baseIndex + 24}, now()))`;
      });

      const result = await client.query<{ id: number }>(
        `
          insert into profiles (
            user_id,
            clinic_id,
            name,
            relationship,
            birth_date,
            gender,
            plan_type,
            is_default,
            cpf,
            rg,
            phone,
            landline,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            profession,
            marital_status,
            insurance_card_number,
            insurance_name,
            notes,
            created_at
          )
          values ${placeholders.join(", ")}
          returning id
        `,
        values,
      );

      result.rows.forEach((row, index) => {
        profileIdByLegacyPatientId.set(patientChunk[index].patientId, row.id);
      });

      importedPatients += patientChunk.length;
      console.log(`Imported patients: ${importedPatients}/${patients.length}`);
    }

    let importedAppointments = 0;
    for (const appointmentChunk of chunkArray(appointments, 150)) {
      const values: unknown[] = [];
      const placeholders = appointmentChunk.map((appointment, appointmentIndex) => {
        const profileId = profileIdByLegacyPatientId.get(appointment.patientId);
        if (!profileId) {
          throw new Error(`Missing profile mapping for legacy patient ${appointment.patientId}`);
        }

        const baseIndex = appointmentIndex * 11;
        values.push(
          doctor.id,
          doctor.clinic_id,
          profileId,
          appointment.patientName,
          appointment.date,
          appointment.time,
          appointment.type,
          appointment.status,
          appointment.duration,
          appointment.notes,
          appointment.createdAt,
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, null, $${baseIndex + 9}, false, false, null, $${baseIndex + 10}, null, coalesce($${baseIndex + 11}, now()))`;
      });

      await client.query(
        `
          insert into appointments (
            user_id,
            clinic_id,
            profile_id,
            patient_name,
            date,
            time,
            type,
            status,
            price,
            duration,
            is_all_day,
            is_telemedicine,
            meeting_link,
            notes,
            checked_in_at,
            created_at
          )
          values ${placeholders.join(", ")}
        `,
        values,
      );

      importedAppointments += appointmentChunk.length;
      console.log(`Imported appointments: ${importedAppointments}/${appointments.length}`);
    }

    let importedEvolutions = 0;
    for (const evolutionChunk of chunkArray(evolutions, 150)) {
      const values: unknown[] = [];
      const placeholders = evolutionChunk.map((evolution, evolutionIndex) => {
        const profileId = profileIdByLegacyPatientId.get(evolution.patientId);
        if (!profileId) {
          throw new Error(`Missing profile mapping for legacy patient ${evolution.patientId}`);
        }

        const baseIndex = evolutionIndex * 6;
        values.push(
          doctor.id,
          profileId,
          evolution.text,
          evolution.professionalName || getDoctorName(doctor),
          evolution.date,
          evolution.createdAt,
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, false, null, null, $${baseIndex + 6})`;
      });

      await client.query(
        `
          insert into evolutions (
            user_id,
            profile_id,
            text,
            professional_name,
            date,
            is_signed,
            signature_hash,
            signed_at,
            created_at
          )
          values ${placeholders.join(", ")}
        `,
        values,
      );

      importedEvolutions += evolutionChunk.length;
      console.log(`Imported evolutions: ${importedEvolutions}/${evolutions.length}`);
    }

    await client.query("COMMIT");

    const finalAudit = await auditTarget(doctor);
    console.log(JSON.stringify({
      imported: {
        patients: importedPatients,
        appointments: importedAppointments,
        evolutions: importedEvolutions,
      },
      finalAudit,
    }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
