import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeRow = Record<string, any>;

const {
  fakeState,
  fakeDb,
  s3Mock,
  loggerMock,
} = vi.hoisted(() => {
  const fakeState = {
    consultation_recording_sessions: [] as FakeRow[],
    consultation_recording_segments: [] as FakeRow[],
    counters: {
      consultation_recording_sessions: 1,
      consultation_recording_segments: 1,
    },
  };

  const getTableName = (table: unknown) => {
    const symbol = Object.getOwnPropertySymbols(table as object).find(
      (entry) => String(entry) === "Symbol(drizzle:Name)"
    );
    if (!symbol) {
      throw new Error("Table name symbol not found");
    }
    return String((table as any)[symbol]);
  };

  const snakeToCamel = (value: string) =>
    value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

  const getChunkText = (chunk: any) =>
    Array.isArray(chunk?.value) ? chunk.value.join("") : "";

  const isSql = (value: any) => Array.isArray(value?.queryChunks);
  const isStringChunk = (value: any) => Array.isArray(value?.value);
  const isParam = (value: any) => value && "value" in value && "encoder" in value;
  const isColumn = (value: any) => value && typeof value.name === "string" && value.table;

  const normalizeChunks = (chunks: any[]) =>
    chunks.filter((chunk) => !(isStringChunk(chunk) && getChunkText(chunk) === ""));

  const matchesCondition = (row: FakeRow, condition: any): boolean => {
    if (!condition) return true;
    if (!isSql(condition)) return true;

    const chunks = normalizeChunks(condition.queryChunks);
    if (chunks.length === 0) return true;

    if (
      chunks.length >= 3 &&
      isStringChunk(chunks[0]) &&
      getChunkText(chunks[0]) === "(" &&
      isStringChunk(chunks[chunks.length - 1]) &&
      getChunkText(chunks[chunks.length - 1]) === ")"
    ) {
      const parts = chunks.slice(1, -1).filter(isSql);
      return parts.every((part) => matchesCondition(row, part));
    }

    if (chunks.some((chunk) => isStringChunk(chunk) && getChunkText(chunk).trim() === "and")) {
      const parts = chunks.filter(isSql);
      return parts.every((part) => matchesCondition(row, part));
    }

    if (chunks.length === 1 && isSql(chunks[0])) {
      return matchesCondition(row, chunks[0]);
    }

    if (chunks.length === 3 && isColumn(chunks[0]) && isStringChunk(chunks[1])) {
      const key = snakeToCamel(chunks[0].name);
      const operator = getChunkText(chunks[1]).trim();

      if (isParam(chunks[2])) {
        if (operator === "=") {
          return row[key] === chunks[2].value;
        }
        if (operator === "<=") {
          return row[key] <= chunks[2].value;
        }
      }

      if (Array.isArray(chunks[2]) && operator === "in") {
        const values = chunks[2].map((entry) => entry.value);
        return values.includes(row[key]);
      }
    }

    return true;
  };

  const getRows = (table: unknown) => fakeState[getTableName(table) as keyof typeof fakeState] as FakeRow[];

  const cloneRows = (rows: FakeRow[]) => rows.map((row) => structuredClone(row));

  const buildSelectBuilder = (table: unknown) => {
    let rows = [...getRows(table)];
    let limitValue: number | null = null;

    const builder: any = {
      where(condition: any) {
        rows = rows.filter((row) => matchesCondition(row, condition));
        return builder;
      },
      orderBy(orderExpression: any) {
        const chunks = normalizeChunks(orderExpression.queryChunks);
        const column = chunks.find(isColumn);
        const directionChunk = chunks.find(isStringChunk);
        const key = column ? snakeToCamel(column.name) : "id";
        const descending = directionChunk
          ? getChunkText(directionChunk).toLowerCase().includes("desc")
          : false;
        rows = [...rows].sort((left, right) => {
          if (left[key] === right[key]) return 0;
          const result = left[key] > right[key] ? 1 : -1;
          return descending ? -result : result;
        });
        return builder;
      },
      limit(value: number) {
        limitValue = value;
        return builder;
      },
      then(resolve: any, reject: any) {
        const finalRows = limitValue === null ? rows : rows.slice(0, limitValue);
        return Promise.resolve(cloneRows(finalRows)).then(resolve, reject);
      },
    };

    return builder;
  };

  const fakeDb = {
    execute: vi.fn(async () => undefined),
    select: vi.fn(() => ({
      from: (table: unknown) => buildSelectBuilder(table),
    })),
    insert: vi.fn((table: unknown) => ({
      values: (value: FakeRow | FakeRow[]) => ({
        returning: async () => {
          const tableName = getTableName(table) as keyof typeof fakeState.counters;
          const rows = Array.isArray(value) ? value : [value];
          const target = getRows(table);
          const inserted = rows.map((row) => {
            const now = new Date();
            const record = {
              id: fakeState.counters[tableName]++,
              createdAt: now,
              updatedAt: now,
              ...row,
            };
            target.push(record);
            return structuredClone(record);
          });
          return inserted;
        },
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: (changes: FakeRow) => ({
        where: (condition: any) => ({
          returning: async () => {
            const target = getRows(table);
            const updated = target
              .filter((row) => matchesCondition(row, condition))
              .map((row) => {
                Object.assign(row, changes);
                return structuredClone(row);
              });
            return updated;
          },
        }),
      }),
    })),
    delete: vi.fn((table: unknown) => ({
      where: async (condition: any) => {
        const target = getRows(table);
        const survivors = target.filter((row) => !matchesCondition(row, condition));
        target.splice(0, target.length, ...survivors);
      },
    })),
  };

  const s3Mock = {
    putFile: vi.fn(async ({ key, buffer, mimeType }: any) => ({
      key,
      bucket: "local",
      url: `/uploads/${key}`,
      size: buffer.length,
      mimeType,
    })),
    getFile: vi.fn(async (key: string) => Buffer.from(`audio:${key}`)),
    deleteFile: vi.fn(async () => undefined),
  };

  const loggerMock = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  return { fakeState, fakeDb, s3Mock, loggerMock };
});

vi.mock("../db", () => ({ db: fakeDb }));
vi.mock("./s3.service", () => ({ S3Service: s3Mock }));
vi.mock("../logger", () => ({ default: loggerMock }));

import { consultationAudioRetentionService } from "./consultation-audio-retention";

describe("consultationAudioRetentionService", () => {
  beforeEach(() => {
    fakeState.consultation_recording_sessions.splice(
      0,
      fakeState.consultation_recording_sessions.length
    );
    fakeState.consultation_recording_segments.splice(
      0,
      fakeState.consultation_recording_segments.length
    );
    fakeState.counters.consultation_recording_sessions = 1;
    fakeState.counters.consultation_recording_segments = 1;
    vi.clearAllMocks();
  });

  it("stores long-recording segments and recovers only the missing transcriptions", async () => {
    const sessionId = "sessao-longa";

    for (const segmentIndex of [0, 1, 2]) {
      await consultationAudioRetentionService.storeSegment({
        sessionId,
        segmentIndex,
        userId: 42,
        clinicId: 7,
        profileId: 9,
        patientName: "Maria",
        buffer: Buffer.from(`audio-${segmentIndex}`),
        mimeType: "audio/webm",
        originalName: `segment-${segmentIndex}.webm`,
        sizeBytes: 1024 + segmentIndex,
      });
    }

    await consultationAudioRetentionService.markSegmentTranscribed(
      sessionId,
      0,
      "trecho 0"
    );

    const transcribeSegment = vi
      .fn()
      .mockResolvedValueOnce("trecho 1")
      .mockRejectedValueOnce(new Error("timeout no whisper"));

    const recovered = await consultationAudioRetentionService.recoverMissingSegmentTranscriptions({
      sessionId,
      userId: 42,
      transcribeSegment: (audioBuffer, mimeType, userId) =>
        transcribeSegment(audioBuffer, mimeType, userId),
    });

    expect(s3Mock.putFile).toHaveBeenCalledTimes(3);
    expect(transcribeSegment).toHaveBeenCalledTimes(2);
    expect(recovered).toHaveLength(3);
    expect(recovered[0].transcription).toBe("trecho 0");
    expect(recovered[0].status).toBe("transcribed");
    expect(recovered[1].transcription).toBe("trecho 1");
    expect(recovered[1].status).toBe("transcribed");
    expect(recovered[2].transcription).toBeUndefined();
    expect(recovered[2].status).toBe("failed");
    expect(recovered[2].lastError).toContain("timeout no whisper");

    const finalized = await consultationAudioRetentionService.finalizeSession({
      sessionId,
      userId: 42,
      clinicId: 7,
      profileId: 9,
      patientName: "Maria",
      transcription: "trecho 0 trecho 1",
      anamnesis: "Anamnese consolidada",
      extractedData: {
        summary: "Resumo",
        diagnoses: [],
        medications: [],
        allergies: [],
        comorbidities: [],
        surgeries: [],
      },
    });

    expect(finalized.status).toBe("finalized");
    expect(finalized.transcription).toBe("trecho 0 trecho 1");
    expect(finalized.anamnesis).toBe("Anamnese consolidada");
  });

  it("removes expired audio and metadata after retention window", async () => {
    const sessionId = "sessao-expirada";

    await consultationAudioRetentionService.storeSegment({
      sessionId,
      segmentIndex: 0,
      userId: 77,
      clinicId: 1,
      profileId: 2,
      patientName: "Joao",
      buffer: Buffer.from("audio-expirado"),
      mimeType: "audio/mp4",
      originalName: "segment-0.mp4",
      sizeBytes: 2048,
    });

    fakeState.consultation_recording_sessions[0].retentionExpiresAt = new Date(
      Date.now() - 60_000
    );
    fakeState.consultation_recording_segments[0].retentionExpiresAt = new Date(
      Date.now() - 60_000
    );

    const storedKey = fakeState.consultation_recording_segments[0].storageKey;

    await consultationAudioRetentionService.cleanupExpiredData();

    expect(s3Mock.deleteFile).toHaveBeenCalledWith(storedKey);
    expect(fakeState.consultation_recording_segments).toHaveLength(0);
    expect(fakeState.consultation_recording_sessions).toHaveLength(0);
  });
});
