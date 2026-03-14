import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

type DoctorContext = {
  id: number;
  email: string | null;
  username: string;
  full_name: string | null;
  clinic_id: number | null;
  clinic_role: string | null;
};

type AuditSummary = {
  doctor: DoctorContext;
  counts: Record<string, number>;
  memberships: Array<{
    id: number;
    role: string;
    user_id: number;
    email: string | null;
    username: string;
    full_name: string | null;
  }>;
  profileOwners: Array<{
    user_id: number;
    email: string | null;
    username: string | null;
    count: number;
  }>;
};

const args = process.argv.slice(2);
const emailArg = args.find((arg) => !arg.startsWith("--"));
const execute = args.includes("--execute");
const removeDemoSecretaries = args.includes("--remove-demo-secretaries");

if (!emailArg) {
  console.error("Usage: npx tsx scripts/reset-doctor-account.ts <doctor-email> [--execute] [--remove-demo-secretaries]");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function getDoctor(client: pg.Pool | pg.PoolClient, email: string): Promise<DoctorContext> {
  const result = await client.query<DoctorContext>(
    `
      select id, email, username, full_name, clinic_id, clinic_role
      from users
      where lower(email) = lower($1)
      limit 1
    `,
    [email],
  );

  if (!result.rows[0]) {
    throw new Error(`Doctor not found for email ${email}`);
  }

  return result.rows[0];
}

async function auditDoctor(client: pg.Pool | pg.PoolClient, doctor: DoctorContext): Promise<AuditSummary> {
  const userId = doctor.id;
  const clinicId = doctor.clinic_id;

  const countQueries: Array<[string, string, number | null]> = [
    ["profiles_by_user", "select count(*)::int as count from profiles where user_id = $1", userId],
    ["profiles_by_clinic", "select count(*)::int as count from profiles where clinic_id = $1", clinicId],
    ["appointments_by_user", "select count(*)::int as count from appointments where user_id = $1", userId],
    ["appointments_by_clinic", "select count(*)::int as count from appointments where clinic_id = $1", clinicId],
    ["diagnoses_by_user", "select count(*)::int as count from diagnoses where user_id = $1", userId],
    ["allergies_by_user", "select count(*)::int as count from allergies where user_id = $1", userId],
    ["medications_by_user", "select count(*)::int as count from medications where user_id = $1", userId],
    ["surgeries_by_user", "select count(*)::int as count from surgeries where user_id = $1", userId],
    ["evolutions_by_user", "select count(*)::int as count from evolutions where user_id = $1", userId],
    ["habits_by_user", "select count(*)::int as count from habits where user_id = $1", userId],
    ["exams_by_user", "select count(*)::int as count from exams where user_id = $1", userId],
    ["exam_requests_by_user", "select count(*)::int as count from exam_requests where user_id = $1", userId],
    ["prescriptions_by_user", "select count(*)::int as count from prescriptions where user_id = $1", userId],
    ["certificates_by_user", "select count(*)::int as count from certificates where user_id = $1", userId],
    ["triage_by_doctor", "select count(*)::int as count from triage_records where performed_by_user_id = $1", userId],
    ["ai_conversations_by_user", "select count(*)::int as count from ai_conversations where user_id = $1", userId],
    ["notifications_by_user", "select count(*)::int as count from notifications where user_id = $1", userId],
    ["custom_medications_by_user", "select count(*)::int as count from custom_medications where user_id = $1", userId],
    ["custom_exams_by_user", "select count(*)::int as count from custom_exams where user_id = $1", userId],
    ["exam_protocols_by_user", "select count(*)::int as count from exam_protocols where user_id = $1", userId],
    ["doctors_by_user", "select count(*)::int as count from doctors where user_id = $1", userId],
    ["team_members_by_owner", "select count(*)::int as count from team_members where owner_id = $1", userId],
    ["clinic_memberships_by_clinic", "select count(*)::int as count from clinic_memberships where clinic_id = $1", clinicId],
    ["clinic_invitations_by_clinic", "select count(*)::int as count from clinic_invitations where clinic_id = $1", clinicId],
  ];

  const counts: Record<string, number> = {};

  for (const [key, query, value] of countQueries) {
    if (value === null) {
      counts[key] = 0;
      continue;
    }

    const result = await client.query<{ count: number }>(query, [value]);
    counts[key] = Number(result.rows[0]?.count ?? 0);
  }

  const membershipsResult = clinicId === null
    ? { rows: [] }
    : await client.query<AuditSummary["memberships"][number]>(
        `
          select cm.id, cm.role, u.id as user_id, u.email, u.username, u.full_name
          from clinic_memberships cm
          join users u on u.id = cm.user_id
          where cm.clinic_id = $1
          order by cm.role, cm.id
        `,
        [clinicId],
      );

  const profileOwnersResult = clinicId === null
    ? { rows: [] }
    : await client.query<AuditSummary["profileOwners"][number]>(
        `
          select p.user_id, u.email, u.username, count(*)::int as count
          from profiles p
          left join users u on u.id = p.user_id
          where p.clinic_id = $1 or p.user_id = $2
          group by p.user_id, u.email, u.username
          order by count desc, p.user_id
        `,
        [clinicId, userId],
      );

  return {
    doctor,
    counts,
    memberships: membershipsResult.rows,
    profileOwners: profileOwnersResult.rows.map((row) => ({ ...row, count: Number(row.count) })),
  };
}

async function selectIds(client: pg.PoolClient, doctor: DoctorContext) {
  const profileIdQuery = doctor.clinic_id === null
    ? "select id from profiles where user_id = $1"
    : "select id from profiles where user_id = $1 or clinic_id = $2";
  const profileParams = doctor.clinic_id === null ? [doctor.id] : [doctor.id, doctor.clinic_id];
  const profileIds = (await client.query<{ id: number }>(profileIdQuery, profileParams)).rows.map((row) => row.id);

  const appointmentIdQuery = doctor.clinic_id === null
    ? "select id from appointments where user_id = $1 or profile_id = any($2::int[])"
    : "select id from appointments where user_id = $1 or clinic_id = $2 or profile_id = any($3::int[])";
  const appointmentParams = doctor.clinic_id === null
    ? [doctor.id, profileIds]
    : [doctor.id, doctor.clinic_id, profileIds];
  const appointmentIds = (await client.query<{ id: number }>(appointmentIdQuery, appointmentParams)).rows.map((row) => row.id);

  const examIds = (
    await client.query<{ id: number }>(
      "select id from exams where user_id = $1 or profile_id = any($2::int[])",
      [doctor.id, profileIds],
    )
  ).rows.map((row) => row.id);

  const conversationIds = (
    await client.query<{ id: number }>(
      "select id from ai_conversations where user_id = $1 or profile_id = any($2::int[])",
      [doctor.id, profileIds],
    )
  ).rows.map((row) => row.id);

  const demoSecretaries = doctor.clinic_id === null
    ? []
    : (
        await client.query<{ id: number }>(
          `
            select u.id
            from clinic_memberships cm
            join users u on u.id = cm.user_id
            where cm.clinic_id = $1
              and cm.role = 'secretary'
              and (
                lower(coalesce(u.email, '')) like '%@vitaview.app'
                or lower(u.username) like 'secretaria\\_%\\_demo' escape '\\'
              )
          `,
          [doctor.clinic_id],
        )
      ).rows.map((row) => row.id);

  return { profileIds, appointmentIds, examIds, conversationIds, demoSecretaries };
}

async function runReset(email: string) {
  const initialAudit = await auditDoctor(pool, await getDoctor(pool, email));
  console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", initialAudit }, null, 2));

  if (!execute) {
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const doctor = await getDoctor(client, email);
    const { profileIds, appointmentIds, examIds, conversationIds, demoSecretaries } = await selectIds(client, doctor);

    const deleteWhereIds = async (table: string, column: string, ids: number[]) => {
      if (ids.length === 0) return 0;
      const result = await client.query(`delete from ${table} where ${column} = any($1::int[])`, [ids]);
      return result.rowCount ?? 0;
    };

    const deleted: Record<string, number> = {};

    deleted.storage_logs = await deleteWhereIds("storage_logs", "exam_id", examIds);
    deleted.exam_results = await deleteWhereIds("exam_results", "exam_id", examIds);
    deleted.ai_messages = await deleteWhereIds("ai_messages", "conversation_id", conversationIds);
    deleted.triage_records_by_appointment = await deleteWhereIds("triage_records", "appointment_id", appointmentIds);

    if (profileIds.length > 0) {
      deleted.triage_records_by_profile =
        (await client.query("delete from triage_records where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.health_metrics_by_profile =
        (await client.query("delete from health_metrics where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.ai_conversations_by_profile =
        (await client.query("delete from ai_conversations where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.diagnoses_by_profile =
        (await client.query("delete from diagnoses where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.allergies_by_profile =
        (await client.query("delete from allergies where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.evolutions_by_profile =
        (await client.query("delete from evolutions where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.habits_by_profile =
        (await client.query("delete from habits where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.exam_requests_by_profile =
        (await client.query("delete from exam_requests where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.prescriptions_by_profile =
        (await client.query("delete from prescriptions where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.certificates_by_profile =
        (await client.query("delete from certificates where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.appointments_by_profile =
        (await client.query("delete from appointments where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
      deleted.exams_by_profile =
        (await client.query("delete from exams where profile_id = any($1::int[])", [profileIds])).rowCount ?? 0;
    } else {
      deleted.triage_records_by_profile = 0;
      deleted.health_metrics_by_profile = 0;
      deleted.ai_conversations_by_profile = 0;
      deleted.diagnoses_by_profile = 0;
      deleted.allergies_by_profile = 0;
      deleted.evolutions_by_profile = 0;
      deleted.habits_by_profile = 0;
      deleted.exam_requests_by_profile = 0;
      deleted.prescriptions_by_profile = 0;
      deleted.certificates_by_profile = 0;
      deleted.appointments_by_profile = 0;
      deleted.exams_by_profile = 0;
    }

    deleted.triage_records_by_doctor =
      (await client.query("delete from triage_records where performed_by_user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.health_metrics_by_exam = examIds.length > 0
      ? (await client.query("delete from health_metrics where exam_id = any($1::int[])", [examIds])).rowCount ?? 0
      : 0;
    deleted.health_metrics_by_user =
      (await client.query("delete from health_metrics where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.ai_conversations_by_user =
      (await client.query("delete from ai_conversations where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.notifications =
      (await client.query("delete from notifications where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.diagnoses_by_user =
      (await client.query("delete from diagnoses where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.allergies_by_user =
      (await client.query("delete from allergies where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.medications =
      (await client.query("delete from medications where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.surgeries =
      (await client.query("delete from surgeries where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.evolutions_by_user =
      (await client.query("delete from evolutions where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.habits_by_user =
      (await client.query("delete from habits where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.exams_by_user =
      (await client.query("delete from exams where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.exam_requests_by_user =
      (await client.query("delete from exam_requests where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.prescriptions_by_user =
      (await client.query("delete from prescriptions where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.certificates_by_user =
      (await client.query("delete from certificates where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.ai_usage =
      (await client.query("delete from ai_usage where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.custom_medications =
      (await client.query("delete from custom_medications where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.custom_exams =
      (await client.query("delete from custom_exams where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.exam_protocols =
      (await client.query("delete from exam_protocols where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.certificate_templates =
      (await client.query("delete from certificate_templates where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.doctors =
      (await client.query("delete from doctors where user_id = $1", [doctor.id])).rowCount ?? 0;

    deleted.appointments_by_user =
      (await client.query("delete from appointments where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.appointments_by_clinic = doctor.clinic_id === null
      ? 0
      : (await client.query("delete from appointments where clinic_id = $1", [doctor.clinic_id])).rowCount ?? 0;
    deleted.profiles_by_user =
      (await client.query("delete from profiles where user_id = $1", [doctor.id])).rowCount ?? 0;
    deleted.profiles_by_clinic = doctor.clinic_id === null
      ? 0
      : (await client.query("delete from profiles where clinic_id = $1", [doctor.clinic_id])).rowCount ?? 0;

    deleted.user_active_profile_reset =
      (await client.query("update users set active_profile_id = null where id = $1", [doctor.id])).rowCount ?? 0;

    if (removeDemoSecretaries && demoSecretaries.length > 0) {
      deleted.secretary_audit_logs =
        (await client.query("delete from audit_logs where user_id = any($1::int[]) or target_user_id = any($1::int[])", [demoSecretaries])).rowCount ?? 0;
      deleted.secretary_memberships =
        (await client.query("delete from clinic_memberships where user_id = any($1::int[])", [demoSecretaries])).rowCount ?? 0;
      deleted.secretary_users =
        (await client.query("delete from users where id = any($1::int[])", [demoSecretaries])).rowCount ?? 0;
    } else {
      deleted.secretary_audit_logs = 0;
      deleted.secretary_memberships = 0;
      deleted.secretary_users = 0;
    }

    await client.query("COMMIT");

    const finalAudit = await auditDoctor(pool, await getDoctor(pool, email));
    console.log(JSON.stringify({ deleted, finalAudit }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

runReset(emailArg)
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
