import cron from "node-cron";
import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  consultationRecordingSegments,
  consultationRecordingSessions,
  type ConsultationRecordingSession,
} from "@shared/schema";
import { db } from "../db";
import logger from "../logger";
import { S3Service } from "./s3.service";

const CONSULTATION_AUDIO_RETENTION_HOURS = 24;

type EnsureSessionInput = {
  sessionId: string;
  userId: number;
  clinicId?: number | null;
  profileId?: number | null;
  patientName?: string | null;
};

type StoreSegmentInput = EnsureSessionInput & {
  segmentIndex: number;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
};

type FinalizeSessionInput = EnsureSessionInput & {
  transcription: string;
  anamnesis: string;
  extractedData: Record<string, unknown>;
};

const getRetentionExpiry = () =>
  new Date(Date.now() + CONSULTATION_AUDIO_RETENTION_HOURS * 60 * 60 * 1000);

const sanitizeFileName = (filename: string) =>
  (filename || "segment-audio")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

const buildSegmentStorageKey = (
  userId: number,
  sessionId: string,
  segmentIndex: number,
  originalName: string
) =>
  [
    "consultation-audio",
    String(userId),
    sessionId,
    `segment-${String(segmentIndex).padStart(4, "0")}-${sanitizeFileName(
      originalName
    )}`,
  ].join("/");

class ConsultationAudioRetentionService {
  private hasStarted = false;

  async start() {
    if (this.hasStarted) {
      return;
    }

    await this.ensureTables();
    await this.cleanupExpiredData();

    cron.schedule("0 * * * *", async () => {
      try {
        await this.cleanupExpiredData();
      } catch (error) {
        logger.error("[ConsultationAudio] Falha ao limpar áudios expirados", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    this.hasStarted = true;
    logger.info("[ConsultationAudio] Retenção temporária de áudio iniciada", {
      retentionHours: CONSULTATION_AUDIO_RETENTION_HOURS,
    });
  }

  private async ensureTables() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS consultation_recording_sessions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
        profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
        patient_name TEXT,
        status TEXT NOT NULL DEFAULT 'recording',
        transcription TEXT,
        anamnesis TEXT,
        extracted_data JSONB,
        last_error TEXT,
        retention_expires_at TIMESTAMP NOT NULL,
        finalized_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS consultation_recording_segments (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES consultation_recording_sessions(session_id) ON DELETE CASCADE,
        segment_index INTEGER NOT NULL,
        storage_key TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        transcription TEXT,
        status TEXT NOT NULL DEFAULT 'stored',
        last_error TEXT,
        retention_expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS consultation_recording_segments_session_segment_idx
      ON consultation_recording_segments(session_id, segment_index)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS consultation_recording_sessions_retention_idx
      ON consultation_recording_sessions(retention_expires_at)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS consultation_recording_segments_retention_idx
      ON consultation_recording_segments(retention_expires_at)
    `);
  }

  private async getSessionRecord(
    sessionId: string,
    userId: number
  ): Promise<ConsultationRecordingSession | undefined> {
    const [session] = await db
      .select()
      .from(consultationRecordingSessions)
      .where(
        and(
          eq(consultationRecordingSessions.sessionId, sessionId),
          eq(consultationRecordingSessions.userId, userId)
        )
      )
      .limit(1);

    return session;
  }

  async ensureSession(input: EnsureSessionInput) {
    const existing = await this.getSessionRecord(input.sessionId, input.userId);
    const retentionExpiresAt = getRetentionExpiry();

    if (existing) {
      const [updated] = await db
        .update(consultationRecordingSessions)
        .set({
          clinicId: input.clinicId ?? existing.clinicId ?? null,
          profileId:
            input.profileId === undefined ? existing.profileId ?? null : input.profileId,
          patientName: input.patientName ?? existing.patientName ?? null,
          retentionExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(consultationRecordingSessions.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(consultationRecordingSessions)
      .values({
        sessionId: input.sessionId,
        userId: input.userId,
        clinicId: input.clinicId ?? null,
        profileId: input.profileId ?? null,
        patientName: input.patientName ?? null,
        status: "recording",
        retentionExpiresAt,
      })
      .returning();

    return created;
  }

  async storeSegment(input: StoreSegmentInput) {
    await this.ensureSession(input);

    const storageKey = buildSegmentStorageKey(
      input.userId,
      input.sessionId,
      input.segmentIndex,
      input.originalName
    );
    const retentionExpiresAt = getRetentionExpiry();

    await S3Service.putFile({
      key: storageKey,
      buffer: input.buffer,
      mimeType: input.mimeType,
      metadata: {
        userId: String(input.userId),
        clinicId: input.clinicId ? String(input.clinicId) : "",
        profileId: input.profileId ? String(input.profileId) : "",
        sessionId: input.sessionId,
        segmentIndex: String(input.segmentIndex),
        retentionExpiresAt: retentionExpiresAt.toISOString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    const [existing] = await db
      .select()
      .from(consultationRecordingSegments)
      .where(
        and(
          eq(consultationRecordingSegments.sessionId, input.sessionId),
          eq(consultationRecordingSegments.segmentIndex, input.segmentIndex)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(consultationRecordingSegments)
        .set({
          storageKey,
          mimeType: input.mimeType,
          originalName: input.originalName,
          sizeBytes: input.sizeBytes,
          status: "stored",
          lastError: null,
          retentionExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(consultationRecordingSegments.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(consultationRecordingSegments)
      .values({
        sessionId: input.sessionId,
        segmentIndex: input.segmentIndex,
        storageKey,
        mimeType: input.mimeType,
        originalName: input.originalName,
        sizeBytes: input.sizeBytes,
        status: "stored",
        retentionExpiresAt,
      })
      .returning();

    return created;
  }

  async getSegment(
    sessionId: string,
    userId: number,
    segmentIndex: number
  ) {
    const session = await this.getSessionRecord(sessionId, userId);
    if (!session) {
      return undefined;
    }

    const [segment] = await db
      .select()
      .from(consultationRecordingSegments)
      .where(
        and(
          eq(consultationRecordingSegments.sessionId, sessionId),
          eq(consultationRecordingSegments.segmentIndex, segmentIndex)
        )
      )
      .limit(1);

    return segment;
  }

  async markSegmentTranscribed(
    sessionId: string,
    segmentIndex: number,
    transcription: string
  ) {
    const [updated] = await db
      .update(consultationRecordingSegments)
      .set({
        transcription,
        status: "transcribed",
        lastError: null,
        retentionExpiresAt: getRetentionExpiry(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(consultationRecordingSegments.sessionId, sessionId),
          eq(consultationRecordingSegments.segmentIndex, segmentIndex)
        )
      )
      .returning();

    return updated;
  }

  async markSegmentFailed(
    sessionId: string,
    segmentIndex: number,
    errorMessage: string
  ) {
    const [updated] = await db
      .update(consultationRecordingSegments)
      .set({
        status: "failed",
        lastError: errorMessage,
        retentionExpiresAt: getRetentionExpiry(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(consultationRecordingSegments.sessionId, sessionId),
          eq(consultationRecordingSegments.segmentIndex, segmentIndex)
        )
      )
      .returning();

    return updated;
  }

  async getSegmentsForSession(sessionId: string, userId: number) {
    const session = await this.getSessionRecord(sessionId, userId);
    if (!session) {
      return [];
    }

    return db
      .select()
      .from(consultationRecordingSegments)
      .where(eq(consultationRecordingSegments.sessionId, sessionId))
      .orderBy(asc(consultationRecordingSegments.segmentIndex));
  }

  async recoverMissingSegmentTranscriptions(options: {
    sessionId: string;
    userId: number;
    transcribeSegment: (
      audioBuffer: Buffer,
      mimeType: string,
      userId: number
    ) => Promise<string>;
  }) {
    const segments = await this.getSegmentsForSession(
      options.sessionId,
      options.userId
    );

    for (const segment of segments) {
      if (segment.transcription?.trim()) {
        continue;
      }

      try {
        const audioBuffer = await S3Service.getFile(segment.storageKey);
        const transcription = await options.transcribeSegment(
          audioBuffer,
          segment.mimeType,
          options.userId
        );
        await this.markSegmentTranscribed(
          options.sessionId,
          segment.segmentIndex,
          transcription
        );
      } catch (error) {
        await this.markSegmentFailed(
          options.sessionId,
          segment.segmentIndex,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return this.getSegmentsForSession(options.sessionId, options.userId);
  }

  async finalizeSession(input: FinalizeSessionInput) {
    const session = await this.ensureSession(input);

    const [updated] = await db
      .update(consultationRecordingSessions)
      .set({
        clinicId: input.clinicId ?? session.clinicId ?? null,
        profileId:
          input.profileId === undefined ? session.profileId ?? null : input.profileId,
        patientName: input.patientName ?? session.patientName ?? null,
        transcription: input.transcription,
        anamnesis: input.anamnesis,
        extractedData: input.extractedData,
        lastError: null,
        status: "finalized",
        retentionExpiresAt: getRetentionExpiry(),
        finalizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRecordingSessions.id, session.id))
      .returning();

    return updated;
  }

  async markSessionFailed(
    sessionId: string,
    userId: number,
    errorMessage: string
  ) {
    const session = await this.getSessionRecord(sessionId, userId);
    if (!session) {
      return undefined;
    }

    const [updated] = await db
      .update(consultationRecordingSessions)
      .set({
        status: "failed",
        lastError: errorMessage,
        retentionExpiresAt: getRetentionExpiry(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRecordingSessions.id, session.id))
      .returning();

    return updated;
  }

  async cleanupExpiredData() {
    const now = new Date();
    const expiredSegments = await db
      .select()
      .from(consultationRecordingSegments)
      .where(lte(consultationRecordingSegments.retentionExpiresAt, now));

    for (const segment of expiredSegments) {
      try {
        await S3Service.deleteFile(segment.storageKey);
      } catch (error) {
        logger.warn("[ConsultationAudio] Falha ao excluir segmento expirado", {
          storageKey: segment.storageKey,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (expiredSegments.length > 0) {
      const segmentIds = expiredSegments.map((segment) => segment.id);
      await db
        .delete(consultationRecordingSegments)
        .where(inArray(consultationRecordingSegments.id, segmentIds));
    }

    const expiredSessions = await db
      .select()
      .from(consultationRecordingSessions)
      .where(lte(consultationRecordingSessions.retentionExpiresAt, now));

    if (expiredSessions.length > 0) {
      const sessionIds = expiredSessions.map((session) => session.id);
      await db
        .delete(consultationRecordingSessions)
        .where(inArray(consultationRecordingSessions.id, sessionIds));
    }

    if (expiredSegments.length > 0 || expiredSessions.length > 0) {
      logger.info("[ConsultationAudio] Limpeza de retenção concluída", {
        deletedSegments: expiredSegments.length,
        deletedSessions: expiredSessions.length,
      });
    }
  }
}

export const consultationAudioRetentionService =
  new ConsultationAudioRetentionService();
