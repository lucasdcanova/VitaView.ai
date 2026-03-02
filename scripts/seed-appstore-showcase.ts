import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import pg from "pg";
import fs from "fs";
import path from "path";

const scryptAsync = promisify(scrypt);
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/^DATABASE_URL=(.*)$/m);
    if (match?.[1]) {
      const raw = match[1].trim();
      process.env.DATABASE_URL = raw.replace(/^['"]|['"]$/g, "");
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment or .env file.");
}

const shouldUseSsl = !process.env.DATABASE_URL.includes("localhost");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

const DOCTOR_EMAIL = "dr@lucascanova.com";
const DEMO_TAG = "[APP_STORE_DEMO_2026]";
const DEFAULT_SECRETARY_PASSWORD = "Vitaview@123";

type SecretarySeed = {
  fullName: string;
  email: string;
  usernameBase: string;
  photoSeed: string;
};

type PatientSeed = {
  name: string;
  email: string;
  birthDate: string;
  gender: "male" | "female";
  cpf: string;
  phone: string;
  city: string;
  state: string;
  profession: string;
  planType: string;
  insuranceName: string;
  avatarUrl: string;
  notes: string;
};

type AppointmentSeed = {
  profileId: number | null;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  price: number | null;
  duration: number;
  isTelemedicine: boolean;
  notes: string;
};

const SECRETARIES: SecretarySeed[] = [
  {
    fullName: "Camila Duarte",
    email: "camila.secretaria.demo@vitaview.app",
    usernameBase: "secretaria_camila_demo",
    photoSeed: "secretaria-camila",
  },
  {
    fullName: "Fernanda Moraes",
    email: "fernanda.secretaria.demo@vitaview.app",
    usernameBase: "secretaria_fernanda_demo",
    photoSeed: "secretaria-fernanda",
  },
  {
    fullName: "Juliana Rocha",
    email: "juliana.secretaria.demo@vitaview.app",
    usernameBase: "secretaria_juliana_demo",
    photoSeed: "secretaria-juliana",
  },
  {
    fullName: "Renata Almeida",
    email: "renata.secretaria.demo@vitaview.app",
    usernameBase: "secretaria_renata_demo",
    photoSeed: "secretaria-renata",
  },
];

const PATIENT_NAMES = [
  "Ana Silva",
  "Bruno Costa",
  "Carla Mendes",
  "Daniel Pereira",
  "Elisa Ramos",
  "Felipe Martins",
  "Gabriela Souza",
  "Henrique Nunes",
  "Isabela Rocha",
  "Joao Oliveira",
  "Karen Araujo",
  "Lucas Teixeira",
  "Marina Campos",
  "Nicolas Dias",
  "Olivia Freitas",
  "Paulo Batista",
  "Quezia Barros",
  "Rafael Lima",
  "Sabrina Farias",
  "Tiago Cardoso",
  "Ursula Monteiro",
  "Vitor Moreira",
  "Wesley Pinheiro",
  "Yasmin Borges",
  "Zeca Fonseca",
  "Amanda Torres",
  "Beatriz Pires",
  "Caio Vidal",
  "Debora Medeiros",
  "Eduardo Rangel",
  "Fabiana Chaves",
  "Gustavo Alves",
  "Helena Coelho",
  "Igor Dantas",
  "Jessica Prado",
  "Leandro Moura",
  "Melissa Rezende",
  "Natalia Aquino",
  "Otavio Amaral",
  "Priscila Neves",
  "Raissa Tavares",
  "Samuel Guedes",
];

const INSURANCE_OPTIONS = [
  "Unimed",
  "SulAmerica",
  "Bradesco Saude",
  "Amil",
  "Porto Seguro Saude",
  "Particular",
];

const PROFESSIONS = [
  "Advogada",
  "Engenheiro",
  "Professora",
  "Designer",
  "Administrador",
  "Empresaria",
  "Arquiteto",
  "Nutricionista",
  "Analista de Sistemas",
  "Fisioterapeuta",
];

const CITY_STATE = [
  { city: "Sao Paulo", state: "SP" },
  { city: "Campinas", state: "SP" },
  { city: "Santo Andre", state: "SP" },
  { city: "Santos", state: "SP" },
  { city: "Ribeirao Preto", state: "SP" },
  { city: "Sao Jose dos Campos", state: "SP" },
];

const CID_CODES = ["I10", "E11", "E78.0", "J45", "G43", "F41.1", "K29", "M54.5"];

const ALLERGY_POOL = [
  { allergen: "Dipirona", reaction: "Urticaria", severity: "moderada" },
  { allergen: "Penicilina", reaction: "Rash", severity: "grave" },
  { allergen: "Latex", reaction: "Dermatite", severity: "leve" },
  { allergen: "Camaron", reaction: "Prurido", severity: "moderada" },
  { allergen: "Ibuprofeno", reaction: "Broncoespasmo", severity: "grave" },
];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number): Date {
  const next = new Date(baseDate);
  next.setDate(baseDate.getDate() + days);
  return next;
}

function formatCpf(index: number): string {
  const raw = String(91000000000 + index).padStart(11, "0").slice(-11);
  return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
}

function formatPhone(index: number): string {
  const first = String((7300 + index) % 10000).padStart(4, "0");
  const second = String((1500 + index * 7) % 10000).padStart(4, "0");
  return `(11) 9${first}-${second}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function ensureUniqueUsername(base: string): Promise<string> {
  let attempt = base;
  let suffix = 1;

  while (true) {
    const result = await pool.query("SELECT id FROM users WHERE username = $1 LIMIT 1", [attempt]);
    if (result.rows.length === 0) return attempt;
    suffix += 1;
    attempt = `${base}_${suffix}`;
  }
}

async function ensureClinicForDoctor(doctorId: number): Promise<number> {
  const directClinic = await pool.query("SELECT id FROM clinics WHERE admin_user_id = $1 LIMIT 1", [doctorId]);
  if (directClinic.rows.length > 0) {
    return Number(directClinic.rows[0].id);
  }

  const created = await pool.query(
    `
      INSERT INTO clinics (name, admin_user_id, max_professionals, max_secretaries, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `,
    ["Clinica VitaView Showcase", doctorId, 10, 6]
  );

  return Number(created.rows[0].id);
}

async function ensureClinicMembership(clinicId: number, userId: number, role: "admin" | "member" | "secretary") {
  const existing = await pool.query(
    "SELECT id, role FROM clinic_memberships WHERE clinic_id = $1 AND user_id = $2 LIMIT 1",
    [clinicId, userId]
  );

  if (existing.rows.length === 0) {
    await pool.query(
      `
        INSERT INTO clinic_memberships (clinic_id, user_id, role, created_at)
        VALUES ($1, $2, $3, NOW())
      `,
      [clinicId, userId, role]
    );
    return;
  }

  if (existing.rows[0].role !== role) {
    await pool.query("UPDATE clinic_memberships SET role = $1 WHERE id = $2", [role, existing.rows[0].id]);
  }
}

function buildPatientSeeds(): PatientSeed[] {
  return PATIENT_NAMES.map((name, index) => {
    const slug = slugify(name);
    const age = 22 + ((index * 3) % 57);
    const currentYear = new Date().getFullYear();
    const year = currentYear - age;
    const month = String((index % 12) + 1).padStart(2, "0");
    const day = String((index % 27) + 1).padStart(2, "0");
    const insurance = INSURANCE_OPTIONS[index % INSURANCE_OPTIONS.length];
    const profession = PROFESSIONS[index % PROFESSIONS.length];
    const cityState = CITY_STATE[index % CITY_STATE.length];
    const gender = index % 2 === 0 ? "female" : "male";
    const avatarUrl = `https://picsum.photos/seed/vitaview-demo-patient-${index + 1}/320/320`;

    return {
      name,
      email: `${slug}.${index + 1}@demo.vitaview.app`,
      birthDate: `${year}-${month}-${day}`,
      gender,
      cpf: formatCpf(index + 1),
      phone: formatPhone(index + 1),
      city: cityState.city,
      state: cityState.state,
      profession,
      planType: insurance,
      insuranceName: insurance,
      avatarUrl,
      notes: `${DEMO_TAG}\navatar:${avatarUrl}\nPaciente ficticio para screenshots da App Store.`,
    };
  });
}

function buildDemoAppointments(
  clinicId: number,
  patientRefs: Array<{ id: number; name: string }>,
  today: Date
): AppointmentSeed[] {
  const agenda: AppointmentSeed[] = [];
  const weekdaySlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
  const saturdaySlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"];
  const types = ["consulta", "retorno", "exames", "procedimento", "urgencia"];

  let patientCursor = 0;

  for (let offset = -7; offset <= 21; offset += 1) {
    const date = addDays(today, offset);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0) {
      continue;
    }

    const dateStr = formatDate(date);
    const slots = dayOfWeek === 6 ? saturdaySlots : weekdaySlots;
    const maxSlots = dayOfWeek === 6 ? 5 : 10;

    for (let i = 0; i < maxSlots; i += 1) {
      const time = slots[i];
      const type = types[(offset + i + types.length * 3) % types.length];
      const price =
        type === "consulta"
          ? 29000
          : type === "retorno"
            ? 19000
            : type === "exames"
              ? 21000
              : type === "procedimento"
                ? 42000
                : 52000;

      let status = "scheduled";
      if (offset < -1) {
        status = i % 7 === 0 ? "cancelled" : "completed";
      } else if (offset === -1) {
        status = i % 5 === 0 ? "waiting" : "completed";
      } else if (offset === 0) {
        if (i === 0) status = "in_progress";
        else if (i <= 2) status = "waiting";
        else status = "scheduled";
      }

      const patient = patientRefs[patientCursor % patientRefs.length];
      patientCursor += 1;

      agenda.push({
        profileId: patient.id,
        patientName: patient.name,
        date: dateStr,
        time,
        type,
        status,
        price,
        duration: type === "procedimento" ? 50 : 30,
        isTelemedicine: i % 6 === 0,
        notes: `${DEMO_TAG} | Consulta ficticia para vitrine da App Store.`,
      });
    }

    if (dayOfWeek !== 6) {
      agenda.push({
        profileId: null,
        patientName: "Horario Bloqueado",
        date: dateStr,
        time: "12:00",
        type: "blocked",
        status: "scheduled",
        price: null,
        duration: 60,
        isTelemedicine: false,
        notes: `${DEMO_TAG} | Bloqueio automatico de agenda.`,
      });
    }
  }

  return agenda;
}

async function ensureSecretaries(clinicId: number, doctorId: number) {
  const hashedPassword = await hashPassword(DEFAULT_SECRETARY_PASSWORD);

  for (const secretary of SECRETARIES) {
    const photoUrl = `https://picsum.photos/seed/${secretary.photoSeed}/320/320`;
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [secretary.email]);

    let userId: number;

    if (existing.rows.length === 0) {
      const username = await ensureUniqueUsername(secretary.usernameBase);
      const inserted = await pool.query(
        `
          INSERT INTO users (
            username,
            password,
            full_name,
            email,
            role,
            clinic_id,
            clinic_role,
            profile_photo_url,
            preferences,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::json, NOW())
          RETURNING id
        `,
        [
          username,
          hashedPassword,
          secretary.fullName,
          secretary.email,
          "user",
          clinicId,
          "secretary",
          photoUrl,
          JSON.stringify({
            delegateForUserId: doctorId,
            delegateType: "secretary",
            appStoreDemo: true,
          }),
        ]
      );
      userId = Number(inserted.rows[0].id);
    } else {
      userId = Number(existing.rows[0].id);
      await pool.query(
        `
          UPDATE users
          SET
            password = $1,
            full_name = $2,
            role = $3,
            clinic_id = $4,
            clinic_role = $5,
            profile_photo_url = $6,
            preferences = (
              COALESCE(preferences::jsonb, '{}'::jsonb) ||
              jsonb_build_object('delegateForUserId', $7, 'delegateType', 'secretary', 'appStoreDemo', true)
            )::json
          WHERE id = $8
        `,
        [hashedPassword, secretary.fullName, "user", clinicId, "secretary", photoUrl, doctorId, userId]
      );
    }

    await ensureClinicMembership(clinicId, userId, "secretary");
  }
}

async function upsertPatients(doctorId: number, clinicId: number): Promise<Array<{ id: number; name: string }>> {
  const patientSeeds = buildPatientSeeds();
  const refs: Array<{ id: number; name: string }> = [];

  for (const patient of patientSeeds) {
    const existing = await pool.query(
      "SELECT id FROM profiles WHERE user_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1",
      [doctorId, patient.email]
    );

    if (existing.rows.length > 0) {
      const profileId = Number(existing.rows[0].id);
      await pool.query(
        `
          UPDATE profiles
          SET
            clinic_id = $1,
            name = $2,
            birth_date = $3,
            gender = $4,
            plan_type = $5,
            cpf = $6,
            phone = $7,
            city = $8,
            state = $9,
            profession = $10,
            insurance_name = $11,
            notes = $12
          WHERE id = $13
        `,
        [
          clinicId,
          patient.name,
          patient.birthDate,
          patient.gender,
          patient.planType,
          patient.cpf,
          patient.phone,
          patient.city,
          patient.state,
          patient.profession,
          patient.insuranceName,
          patient.notes,
          profileId,
        ]
      );
      refs.push({ id: profileId, name: patient.name });
      continue;
    }

    const inserted = await pool.query(
      `
        INSERT INTO profiles (
          user_id,
          clinic_id,
          name,
          birth_date,
          gender,
          plan_type,
          is_default,
          cpf,
          phone,
          email,
          city,
          state,
          profession,
          insurance_name,
          notes,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING id
      `,
      [
        doctorId,
        clinicId,
        patient.name,
        patient.birthDate,
        patient.gender,
        patient.planType,
        patient.cpf,
        patient.phone,
        patient.email,
        patient.city,
        patient.state,
        patient.profession,
        patient.insuranceName,
        patient.notes,
      ]
    );

    refs.push({ id: Number(inserted.rows[0].id), name: patient.name });
  }

  return refs;
}

async function seedClinicalContext(doctorId: number, patientRefs: Array<{ id: number; name: string }>) {
  await pool.query("DELETE FROM diagnoses WHERE user_id = $1 AND notes ILIKE $2", [doctorId, `%${DEMO_TAG}%`]);
  await pool.query("DELETE FROM allergies WHERE user_id = $1 AND notes ILIKE $2", [doctorId, `%${DEMO_TAG}%`]);

  for (let i = 0; i < patientRefs.length; i += 1) {
    const patient = patientRefs[i];
    const cidCode = CID_CODES[i % CID_CODES.length];
    const diagnosisStatus = i % 3 === 0 ? "cronico" : i % 3 === 1 ? "em_tratamento" : "ativo";
    const allergy = ALLERGY_POOL[i % ALLERGY_POOL.length];
    const diagnosisDate = formatDate(addDays(new Date(), -20 - i));

    await pool.query(
      `
        INSERT INTO diagnoses (user_id, profile_id, cid_code, diagnosis_date, status, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      [doctorId, patient.id, cidCode, diagnosisDate, diagnosisStatus, `${DEMO_TAG} | Diagnostico ficticio.`]
    );

    await pool.query(
      `
        INSERT INTO allergies (user_id, profile_id, allergen, allergen_type, reaction, severity, notes, created_at)
        VALUES ($1, $2, $3, 'medication', $4, $5, $6, NOW())
      `,
      [doctorId, patient.id, allergy.allergen, allergy.reaction, allergy.severity, `${DEMO_TAG} | Alergia ficticia.`]
    );
  }
}

async function seedAgenda(doctorId: number, clinicId: number, patientRefs: Array<{ id: number; name: string }>) {
  await pool.query("DELETE FROM appointments WHERE user_id = $1 AND notes ILIKE $2", [doctorId, `%${DEMO_TAG}%`]);

  const today = new Date();
  const appointments = buildDemoAppointments(clinicId, patientRefs, today);

  for (const appointment of appointments) {
    await pool.query(
      `
        INSERT INTO appointments (
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
          is_telemedicine,
          notes,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `,
      [
        doctorId,
        clinicId,
        appointment.profileId,
        appointment.patientName,
        appointment.date,
        appointment.time,
        appointment.type,
        appointment.status,
        appointment.price,
        appointment.duration,
        appointment.isTelemedicine,
        appointment.notes,
      ]
    );
  }
}

async function main() {
  console.log("Starting App Store showcase seed...");

  const doctorResult = await pool.query(
    "SELECT id, full_name, username FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [DOCTOR_EMAIL]
  );

  if (doctorResult.rows.length === 0) {
    throw new Error(`Doctor user not found: ${DOCTOR_EMAIL}`);
  }

  const doctorId = Number(doctorResult.rows[0].id);
  const doctorName = doctorResult.rows[0].full_name || doctorResult.rows[0].username || DOCTOR_EMAIL;
  console.log(`Using doctor: ${doctorName} (id=${doctorId})`);

  const clinicId = await ensureClinicForDoctor(doctorId);
  await pool.query("UPDATE users SET clinic_id = $1, clinic_role = 'admin' WHERE id = $2", [clinicId, doctorId]);
  await ensureClinicMembership(clinicId, doctorId, "admin");
  console.log(`Clinic ready: id=${clinicId}`);

  await ensureSecretaries(clinicId, doctorId);
  console.log(`Secretaries ready: ${SECRETARIES.length}`);

  const patientRefs = await upsertPatients(doctorId, clinicId);
  console.log(`Patients ready: ${patientRefs.length}`);

  await seedClinicalContext(doctorId, patientRefs);
  console.log("Clinical context ready (diagnoses + allergies).");

  await seedAgenda(doctorId, clinicId, patientRefs);
  console.log("Agenda ready.");

  const [profilesCount, appointmentsCount, secretariesCount] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM profiles WHERE user_id = $1 AND notes ILIKE $2", [doctorId, `%${DEMO_TAG}%`]),
    pool.query("SELECT COUNT(*)::int AS count FROM appointments WHERE user_id = $1 AND notes ILIKE $2", [doctorId, `%${DEMO_TAG}%`]),
    pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM clinic_memberships
        WHERE clinic_id = $1 AND role = 'secretary'
      `,
      [clinicId]
    ),
  ]);

  console.log("Done.");
  console.log(`Profiles tagged for showcase: ${profilesCount.rows[0].count}`);
  console.log(`Appointments tagged for showcase: ${appointmentsCount.rows[0].count}`);
  console.log(`Secretaries in clinic: ${secretariesCount.rows[0].count}`);
  console.log(`Default secretary password: ${DEFAULT_SECRETARY_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
