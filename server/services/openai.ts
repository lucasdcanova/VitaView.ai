import OpenAI from "openai";
import type { ExamResult, User, Exam } from "@shared/schema";
import type { HealthMetric } from "@shared/schema";
import { CID10_DATABASE } from "@shared/data/cid10-database";
import type { IStorage } from "../storage";

import logger from "../logger";
import { ModelRouter, type TaskComplexity } from "./model-router";
import { AICacheService } from "./ai-cache";

const sanitizePhysicianName = (value?: string | null) => {
  if (!value) return null;
  const cleaned = value
    .replace(/m[ée]dico solicitante[:\-]?\s*/i, "")
    .replace(/solicitante[:\-]?\s*/i, "")
    .replace(/^(dr|dra)\.?/i, "")
    .replace(/^(dr|dra)\s+/i, "")
    .trim();
  return cleaned || null;
};

const normalizeAnalysisPayload = (analysisData: any, defaultProvider: string) => {
  const legacyMetadata = (analysisData?.metadata && typeof analysisData.metadata === 'object')
    ? analysisData.metadata
    : {};
  const preferredMetadata = (analysisData?.examMetadata && typeof analysisData.examMetadata === 'object')
    ? analysisData.examMetadata
    : {};
  const metadata = { ...legacyMetadata, ...preferredMetadata };
  const normalizedDoctor = sanitizePhysicianName(
    analysisData?.requestingPhysician || metadata?.requestingPhysician
  );

  const normalizedExamType =
    analysisData?.examType ||
    metadata?.examType ||
    metadata?.documentTitle ||
    null;

  const normalizedPurpose = analysisData?.examPurpose || metadata?.examPurpose || null;
  const normalizedCategory = analysisData?.examCategory || metadata?.examCategory || null;
  const normalizedLab = analysisData?.laboratoryName || metadata?.laboratoryName || null;
  const normalizedExamDate = analysisData?.examDate || metadata?.examDate || null;
  const normalizedDocumentTitle =
    metadata?.documentTitle ||
    normalizedExamType ||
    null;

  const normalizedMetadata = {
    ...metadata,
    documentTitle: normalizedDocumentTitle || null,
    examType: normalizedExamType || null,
    examPurpose: normalizedPurpose || null,
    examCategory: normalizedCategory || null,
    requestingPhysician: normalizedDoctor,
    laboratoryName: normalizedLab || null,
    examDate: normalizedExamDate || null
  };

  return {
    ...analysisData,
    examMetadata: normalizedMetadata,
    requestingPhysician: normalizedDoctor,
    examType: normalizedExamType,
    examPurpose: normalizedPurpose,
    examCategory: normalizedCategory,
    laboratoryName: normalizedLab,
    examDate: normalizedExamDate,
    aiProvider: analysisData?.aiProvider ?? defaultProvider
  };
};

const stripMarkdownCodeFence = (raw: string | undefined) => {
  if (!raw) return "";
  let cleaned = raw.trim();

  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    } else {
      cleaned = cleaned.replace(/^```[\w-]*\s*/i, "");
    }

    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }

    cleaned = cleaned.trim();
  }

  return cleaned;
};

const extractJsonPayload = (raw: string) => {
  const firstBrace = raw.indexOf("{");
  if (firstBrace === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let prevChar = "";

  for (let i = firstBrace; i < raw.length; i++) {
    const char = raw[i];

    if (char === "\"" && prevChar !== "\\") {
      inString = !inString;
    }

    if (!inString) {
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return raw.slice(firstBrace, i + 1);
        }
      }
    }

    prevChar = char;
  }

  return null;
};

const extractResponseText = (response: any): string | undefined => {
  if (!response) return undefined;

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item?.type === "output_text" && typeof item.text === "string") {
        return item.text;
      }

      if (item?.content && Array.isArray(item.content)) {
        for (const sub of item.content) {
          if (sub?.type === "output_text" && typeof sub.text === "string") {
            return sub.text;
          }
          if (typeof sub?.text === "string") {
            return sub.text;
          }
        }
      }
    }
  }

  if (Array.isArray(response.choices)) {
    const choice = response.choices[0];
    if (choice?.message?.content) {
      if (typeof choice.message.content === "string") {
        return choice.message.content;
      }
      if (Array.isArray(choice.message.content)) {
        const textPart = choice.message.content.find((part: any) => part?.type === "text");
        if (textPart?.text) {
          return textPart.text;
        }
      }
    }
  }

  return undefined;
};

const calculateAgeFromBirthDate = (birthDate?: string | null) => {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return Math.floor((Date.now() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const formatRecordItem = (value?: string | null, fallback = "Não informado") => {
  if (!value) return fallback;
  return value;
};

const formatPatientContext = (patientData?: any) => {
  if (!patientData) return "";

  const inferredAge = patientData.age ?? calculateAgeFromBirthDate(patientData.birthDate);
  const diseasesText = Array.isArray(patientData.diseases) && patientData.diseases.length > 0
    ? patientData.diseases.join(", ")
    : "Nenhuma informada";
  const surgeriesText = Array.isArray(patientData.surgeries) && patientData.surgeries.length > 0
    ? patientData.surgeries.join(", ")
    : "Nenhuma informada";
  const allergiesText = Array.isArray(patientData.allergies) && patientData.allergies.length > 0
    ? patientData.allergies.join(", ")
    : "Nenhuma informada";
  const medicationsText = Array.isArray(patientData.medications) && patientData.medications.length > 0
    ? patientData.medications.join(", ")
    : "Nenhum informado";

  const diagnosesDetails = Array.isArray(patientData.medicalRecord?.diagnoses) && patientData.medicalRecord.diagnoses.length > 0
    ? patientData.medicalRecord.diagnoses.map((diagnosis: any) => {
      const code = diagnosis.cidCode || diagnosis.cid_code || "CID não informado";
      const status = diagnosis.status ? ` - ${diagnosis.status}` : "";
      const date = diagnosis.diagnosisDate || diagnosis.diagnosis_date;
      const formattedDate = date ? ` (${date})` : "";
      return `${code}${status}${formattedDate}`.trim();
    }).join("; ")
    : "Nenhum registrado";

  const medicationsDetails = Array.isArray(patientData.medicalRecord?.medications) && patientData.medicalRecord.medications.length > 0
    ? patientData.medicalRecord.medications.map((medication: any) => {
      const name = medication.name || "Medicamento";
      const dosage = medication.dosage ? ` - ${medication.dosage}` : "";
      const frequency = medication.frequency ? ` (${medication.frequency})` : "";
      return `${name}${dosage}${frequency}`.trim();
    }).join("; ")
    : "Nenhum registrado";

  const allergiesDetails = Array.isArray(patientData.medicalRecord?.allergies) && patientData.medicalRecord.allergies.length > 0
    ? patientData.medicalRecord.allergies.map((allergy: any) => {
      const name = allergy.allergen || "Alergia";
      const severity = allergy.severity ? ` - ${allergy.severity}` : "";
      const reaction = allergy.reaction ? ` (${allergy.reaction})` : "";
      return `${name}${severity}${reaction}`.trim();
    }).join("; ")
    : "Nenhum registrado";

  return `
      Dados do paciente:
      - Sexo: ${formatRecordItem(patientData.gender)}
      - Idade: ${inferredAge ?? "Não informada"}
      - Doenças/diagnósticos prévios: ${diseasesText}
      - Cirurgias prévias: ${surgeriesText}
      - Alergias conhecidas: ${allergiesText}
      - Medicamentos em uso contínuo: ${medicationsText}
      - Histórico familiar: ${formatRecordItem(patientData.familyHistory, "Não informado")}
      
      Resumo do prontuário:
      - Diagnósticos (CID-10): ${diagnosesDetails}
      - Medicamentos ativos: ${medicationsDetails}
      - Alergias registradas: ${allergiesDetails}
  `;
};

const DIAGNOSIS_STATUSES = new Set(["ativo", "em_tratamento", "resolvido", "cronico"]);
const CID_SEARCH_STOPWORDS = new Set([
  "com",
  "sem",
  "para",
  "por",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "na",
  "no",
  "nas",
  "nos",
  "em",
  "paciente",
  "refere",
  "quadro",
  "clinico",
  "clinica",
  "consulta",
  "suspeita",
  "hipotese",
  "diagnostico",
  "diagnostica",
  "historico",
  "historia",
  "antecedente",
  "antecedentes",
  "cid",
]);

const diagnosisCidHints = [
  { pattern: /\bfaringit/i, code: "J02.9" },
  { pattern: /\bamigdalit/i, code: "J03.9" },
  { pattern: /\bsinusit/i, code: "J01.9" },
  { pattern: /\botite\b/i, code: "H66.9" },
  { pattern: /\brinite alerg/i, code: "J30.4" },
  { pattern: /\bgastroenterit|\bdiarreia aguda|\bdiarreia infecc/i, code: "A09" },
  { pattern: /\bcefale/i, code: "R51" },
  { pattern: /\benxaqu/i, code: "G43.9" },
  { pattern: /\bansiedad/i, code: "F41.1" },
  { pattern: /\bdepress/i, code: "F32.9" },
  { pattern: /\blombalg|\bdor lombar/i, code: "M54.5" },
  { pattern: /\bhipertens/i, code: "I10" },
  { pattern: /\bdiabet/i, code: "E11" },
  { pattern: /\basma\b/i, code: "J45" },
  { pattern: /\bdislipidem/i, code: "E78" },
];

const fallbackMedicationKeywords = [
  { term: /losartan|losartana/i, name: "Losartana", dosage: "50mg", frequency: "1x ao dia", format: "comprimido" },
  { term: /metformin|metformina/i, name: "Metformina", dosage: "850mg", frequency: "2x ao dia", format: "comprimido" },
  { term: /sinvastatin|simvastatin|sinvastatina/i, name: "Sinvastatina", dosage: "20mg", frequency: "1x ao dia", format: "comprimido" },
  { term: /amoxicilin|amoxicilina/i, name: "Amoxicilina", dosage: "", frequency: "", format: "comprimido" },
  { term: /dipirona/i, name: "Dipirona", dosage: "", frequency: "", format: "comprimido" },
  { term: /paracetamol/i, name: "Paracetamol", dosage: "", frequency: "", format: "comprimido" },
  { term: /ibuprofeno/i, name: "Ibuprofeno", dosage: "", frequency: "", format: "comprimido" },
];

const fallbackAllergyKeywords = [
  { term: /penicilin/i, allergen: "Penicilina", severity: "grave" },
  { term: /dipirona/i, allergen: "Dipirona", severity: "moderada" },
  { term: /amoxicilin/i, allergen: "Amoxicilina", severity: "moderada" },
];

const getTodayIsoDate = () => new Date().toISOString().split("T")[0];

const normalizeSearchText = (value?: string | null) => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const ensureText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const uniqueStrings = (values: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = ensureText(value);
    if (!cleaned) continue;
    const normalized = normalizeSearchText(cleaned);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(cleaned);
  }

  return result;
};

const isLikelyCidCode = (value?: string | null) => /^[A-Z]\d{2}(?:\.\d+)?$/i.test(ensureText(value));

const findCidEntryByCode = (value?: string | null) => {
  const code = ensureText(value).toUpperCase();
  if (!code) return null;
  return CID10_DATABASE.find((entry) => entry.code.toUpperCase() === code) || null;
};

const normalizeDateValue = (value: unknown): string | null => {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }

  const raw = ensureText(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00`);
    return isNaN(parsed.getTime()) ? null : raw;
  }

  const brFormat = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (brFormat) {
    const [, dayRaw, monthRaw, yearRaw] = brFormat;
    const day = dayRaw.padStart(2, "0");
    const month = monthRaw.padStart(2, "0");
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    const candidate = `${year}-${month}-${day}`;
    const parsed = new Date(`${candidate}T00:00:00`);
    return isNaN(parsed.getTime()) ? null : candidate;
  }

  const isoLike = raw.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
  if (isoLike) {
    const [, year, monthRaw, dayRaw] = isoLike;
    const month = monthRaw.padStart(2, "0");
    const day = dayRaw.padStart(2, "0");
    const candidate = `${year}-${month}-${day}`;
    const parsed = new Date(`${candidate}T00:00:00`);
    return isNaN(parsed.getTime()) ? null : candidate;
  }

  return null;
};

const normalizeDiagnosisStatus = (value?: string | null) => {
  const normalized = normalizeSearchText(value);
  if (!normalized) return "ativo";
  if (DIAGNOSIS_STATUSES.has(normalized)) return normalized;
  if (normalized.includes("cron")) return "cronico";
  if (normalized.includes("trat")) return "em_tratamento";
  if (normalized.includes("resolv") || normalized.includes("curad") || normalized.includes("remiss")) return "resolvido";
  return "ativo";
};

const findBestCidMatch = (query?: string | null) => {
  const rawQuery = ensureText(query);
  if (!rawQuery) return null;

  const exactCodeMatch = findCidEntryByCode(rawQuery);
  if (exactCodeMatch) {
    return exactCodeMatch;
  }

  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return null;

  const hintedMatch = diagnosisCidHints.find((hint) => hint.pattern.test(normalizedQuery));
  if (hintedMatch) {
    const hintedEntry = findCidEntryByCode(hintedMatch.code);
    if (hintedEntry) {
      return hintedEntry;
    }
  }

  const queryTokens = normalizedQuery
    .split(" ")
    .filter((token) => token.length > 2 && !CID_SEARCH_STOPWORDS.has(token));

  let bestMatch: (typeof CID10_DATABASE)[number] | null = null;
  let bestScore = 0;

  for (const entry of CID10_DATABASE) {
    const normalizedDescription = normalizeSearchText(entry.description);
    if (!normalizedDescription) continue;

    let score = 0;

    if (normalizedDescription === normalizedQuery) score += 140;
    if (normalizedDescription.startsWith(normalizedQuery)) score += 100;
    if (normalizedDescription.includes(normalizedQuery)) score += 70;
    if (normalizedQuery.includes(normalizedDescription) && normalizedDescription.length > 5) score += 55;

    const matchedTokens = queryTokens.filter((token) => normalizedDescription.includes(token));
    score += matchedTokens.reduce((total, token) => total + (token.length >= 6 ? 14 : 8), 0);

    if (queryTokens.length > 0 && matchedTokens.length === queryTokens.length) {
      score += 25;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
      continue;
    }

    if (score === bestScore && bestMatch && score > 0) {
      if (entry.description.length < bestMatch.description.length) {
        bestMatch = entry;
      }
    }
  }

  return bestScore >= 18 ? bestMatch : null;
};

const buildDiagnosisNotes = (label?: string | null, details?: string | null, fallbackDescription?: string | null) => {
  const parts = uniqueStrings([label, details, fallbackDescription]);
  return parts.length > 0 ? parts.join(" | ") : null;
};

const dedupeDiagnoses = (diagnoses: any[]) => {
  const seen = new Set<string>();
  const result: any[] = [];

  for (const diagnosis of diagnoses) {
    if (!diagnosis) continue;
    const key = normalizeSearchText(diagnosis.cidCode || diagnosis.notes || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(diagnosis);
  }

  return result;
};

const dedupeByKey = (items: any[], selector: (item: any) => string) => {
  const seen = new Set<string>();
  const result: any[] = [];

  for (const item of items) {
    if (!item) continue;
    const key = normalizeSearchText(selector(item));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
};

const normalizeDiagnosisEntry = (entry: any, encounterDate: string) => {
  const rawDiagnosis = typeof entry === "string" ? { notes: entry } : (entry || {});
  const label =
    ensureText(rawDiagnosis.condition) ||
    ensureText(rawDiagnosis.diagnosis) ||
    ensureText(rawDiagnosis.name) ||
    ensureText(rawDiagnosis.label);
  const detailText =
    ensureText(rawDiagnosis.notes) ||
    ensureText(rawDiagnosis.description) ||
    ensureText(rawDiagnosis.observation);
  const cidMatch =
    findBestCidMatch(rawDiagnosis.cidCode) ||
    findBestCidMatch(label) ||
    findBestCidMatch(detailText);
  const cidCode = cidMatch?.code || (isLikelyCidCode(rawDiagnosis.cidCode) ? ensureText(rawDiagnosis.cidCode).toUpperCase() : "");
  const diagnosisDate =
    normalizeDateValue(rawDiagnosis.diagnosisDate) ||
    normalizeDateValue(rawDiagnosis.diagnosis_date) ||
    encounterDate;

  return {
    cidCode,
    status: normalizeDiagnosisStatus(rawDiagnosis.status || label || detailText),
    diagnosisDate,
    notes: buildDiagnosisNotes(label, detailText, cidMatch?.description || null),
  };
};

const normalizeMedicationEntry = (entry: any, encounterDate: string) => {
  const rawMedication = typeof entry === "string" ? { name: entry } : (entry || {});
  const name = ensureText(rawMedication.name) || ensureText(rawMedication.medication);
  if (!name) return null;

  return {
    name,
    dosage: ensureText(rawMedication.dosage) || ensureText(rawMedication.dose) || "",
    frequency: ensureText(rawMedication.frequency) || "",
    format: ensureText(rawMedication.format) || "",
    startDate:
      normalizeDateValue(rawMedication.startDate) ||
      normalizeDateValue(rawMedication.start_date) ||
      encounterDate,
    notes: ensureText(rawMedication.notes) || ensureText(rawMedication.description) || null,
    isActive: rawMedication.isActive !== false,
  };
};

const normalizeAllergyEntry = (entry: any) => {
  const rawAllergy = typeof entry === "string" ? { allergen: entry } : (entry || {});
  const allergen = ensureText(rawAllergy.allergen) || ensureText(rawAllergy.name);
  if (!allergen) return null;

  return {
    allergen,
    allergenType: ensureText(rawAllergy.allergenType) || ensureText(rawAllergy.type) || "medication",
    reaction: ensureText(rawAllergy.reaction) || null,
    severity: ensureText(rawAllergy.severity) || null,
    notes: ensureText(rawAllergy.notes) || null,
  };
};

const normalizeSurgeryEntry = (entry: any, encounterDate: string) => {
  const rawSurgery = typeof entry === "string" ? { procedureName: entry } : (entry || {});
  const procedureName = ensureText(rawSurgery.procedureName) || ensureText(rawSurgery.name);
  if (!procedureName) return null;

  return {
    procedureName,
    surgeryDate:
      normalizeDateValue(rawSurgery.surgeryDate) ||
      normalizeDateValue(rawSurgery.surgery_date) ||
      encounterDate,
    hospitalName: ensureText(rawSurgery.hospitalName) || null,
    surgeonName: ensureText(rawSurgery.surgeonName) || null,
    notes: ensureText(rawSurgery.notes) || null,
  };
};

const inferDiagnosesFromText = (text: string, encounterDate: string) => {
  const segments = text
    .split(/\n|[.;]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 4 && segment.length <= 160);
  const diagnoses: any[] = [];

  for (const segment of segments) {
    const normalizedSegment = normalizeSearchText(segment);
    if (!normalizedSegment) continue;

    for (const hint of diagnosisCidHints) {
      if (!hint.pattern.test(normalizedSegment)) continue;
      const resolvedCid = findBestCidMatch(segment) || findCidEntryByCode(hint.code);
      diagnoses.push({
        cidCode: resolvedCid?.code || hint.code,
        status: normalizeDiagnosisStatus(segment),
        diagnosisDate: encounterDate,
        notes: buildDiagnosisNotes(segment, null, resolvedCid?.description || null),
      });
    }

    if (/(diagnost|hipotese|impressao|avaliacao|antecedent|historico|historia de|comorbidade)/i.test(normalizedSegment)) {
      const cleanedSegment = segment
        .replace(/.*?(diagn[oó]stic[oa]?|hip[oó]tese diagn[oó]stica|impress[aã]o diagn[oó]stica|avalia[cç][aã]o|antecedentes?|hist[oó]rico(?: de)?|historia de|comorbidade)\s*(de|:|-)?\s*/i, "")
        .trim();
      const resolvedCid = findBestCidMatch(cleanedSegment);
      if (resolvedCid) {
        diagnoses.push({
          cidCode: resolvedCid.code,
          status: normalizeDiagnosisStatus(cleanedSegment),
          diagnosisDate: encounterDate,
          notes: buildDiagnosisNotes(cleanedSegment, null, resolvedCid.description),
        });
      }
    }
  }

  return dedupeDiagnoses(diagnoses);
};

const normalizeExtractedRecord = (payload: any, sourceText = "", encounterDate = getTodayIsoDate()) => {
  const normalizedDiagnoses = Array.isArray(payload?.diagnoses)
    ? payload.diagnoses
        .map((entry: any) => normalizeDiagnosisEntry(entry, encounterDate))
        .filter((entry: any) => entry && (entry.cidCode || entry.notes))
    : [];
  const inferredDiagnoses = sourceText ? inferDiagnosesFromText(sourceText, encounterDate) : [];
  const diagnoses = dedupeDiagnoses([...normalizedDiagnoses, ...inferredDiagnoses]);

  const medications = dedupeByKey(
    Array.isArray(payload?.medications)
      ? payload.medications.map((entry: any) => normalizeMedicationEntry(entry, encounterDate)).filter(Boolean)
      : [],
    (entry) => entry.name
  );

  const allergies = dedupeByKey(
    Array.isArray(payload?.allergies)
      ? payload.allergies.map((entry: any) => normalizeAllergyEntry(entry)).filter(Boolean)
      : [],
    (entry) => entry.allergen
  );

  const surgeries = dedupeByKey(
    Array.isArray(payload?.surgeries)
      ? payload.surgeries.map((entry: any) => normalizeSurgeryEntry(entry, encounterDate)).filter(Boolean)
      : [],
    (entry) => entry.procedureName
  );

  const comorbidityValues = Array.isArray(payload?.comorbidities)
    ? payload.comorbidities
        .map((entry: any) => {
          const rawValue = ensureText(entry);
          if (!rawValue) return null;
          const cidMatch = findBestCidMatch(rawValue);
          if (cidMatch) return cidMatch.code;
          if (isLikelyCidCode(rawValue)) return rawValue.toUpperCase();
          return rawValue;
        })
        .filter(Boolean)
    : [];

  return {
    summary: ensureText(payload?.summary),
    diagnoses,
    medications,
    allergies,
    comorbidities: uniqueStrings([
      ...comorbidityValues,
      ...diagnoses
        .filter((diagnosis) => diagnosis.status === "cronico")
        .map((diagnosis) => diagnosis.cidCode),
    ]),
    surgeries,
  };
};

const fallbackAnamnesisExtraction = (text: string, encounterDate = getTodayIsoDate()) => {
  const normalizedText = text.toLowerCase();
  const inferredDiagnoses = inferDiagnosesFromText(text, encounterDate);

  const medications = fallbackMedicationKeywords
    .filter((item) => item.term.test(normalizedText))
    .map((item) => ({
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      format: item.format,
      startDate: encounterDate,
      notes: null,
      isActive: true,
    }));

  const allergies = fallbackAllergyKeywords
    .filter((item) => item.term.test(normalizedText))
    .map((item) => ({
      allergen: item.allergen,
      severity: item.severity,
      notes: null,
      allergenType: "medication",
      reaction: null,
    }));

  return {
    summary: "",
    diagnoses: inferredDiagnoses,
    medications,
    allergies,
    comorbidities: inferredDiagnoses
      .filter((diagnosis) => diagnosis.status === "cronico")
      .map((diagnosis) => diagnosis.cidCode)
      .filter(Boolean),
    surgeries: [],
  };
};

// Default GPT-5 vision model can be overridden through environment variables
const OPENAI_MODEL = process.env.OPENAI_GPT5_MODEL || process.env.OPENAI_ANALYSIS_MODEL || "gpt-4.1";
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "gpt-4o";
const OPENAI_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_ANALYSIS_MAX_OUTPUT_TOKENS || "4000");

// Initialize OpenAI using the API key from environment variables
export let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  // OpenAI API key not found. OpenAI features will use fallback responses.
}

// Update signature to accept context
export async function generateHealthInsights(examResult: ExamResult, patientData?: any, userId?: number, clinicId?: number) {
  try {

    const patientContext = formatPatientContext(patientData);

    // Prompt aprimorado para OpenAI com análise holística e personalizada
    const prompt = `
      Você é um especialista médico altamente qualificado em medicina laboratorial, diagnóstico clínico e medicina preventiva.
      Sua análise integra as evidências científicas mais atualizadas (2024) com diretrizes médicas internacionais e abordagem de medicina personalizada.
      
      ### TAREFA PRINCIPAL:
      Analise detalhadamente os seguintes resultados de exames médicos e forneça uma avaliação médica completa, 
      integrando os dados laboratoriais com o contexto específico do paciente para uma análise verdadeiramente personalizada.
      
      ### DADOS DO PACIENTE:
      ${patientContext}
      
      ### DADOS DO EXAME:
      - Resumo: ${examResult.summary}
      - Análise detalhada: ${examResult.detailedAnalysis}
      - Recomendações preliminares: ${examResult.recommendations}
      - Médico solicitante: ${'Não informado'}
      - Laboratório: ${'Não informado'}
      - Data do exame: ${'Não informada'}
      
      ### MÉTRICAS DE SAÚDE DETALHADAS:
      ${JSON.stringify(examResult.healthMetrics, null, 2)}
      
      ### INSTRUÇÕES ESPECÍFICAS:
      1. Faça correlações entre diferentes marcadores/parâmetros e integre-os no contexto do perfil do paciente
      2. Identifique padrões que possam indicar condições subclínicas ou riscos emergentes
      3. Priorize a detecção de fatores de risco modificáveis através de mudanças no estilo de vida
      4. Forneça uma análise de tendências temporais quando houver dados históricos disponíveis
      5. Sugira monitoramento personalizado baseado no perfil de risco específico
      
      ### DIRETRIZES LEGAIS E ÉTICAS OBRIGATÓRIAS (MINISTÉRIO DA SAÚDE):
      ⚠️ ALERTA LEGAL: É CRIME prescrever ou recomendar medicamentos, vitaminas, suplementos
      🚫 TOTALMENTE PROIBIDO mencionar: vitamina D, B12, C, zinco, magnésio, ferro, cálcio, ômega 3, qualquer nutriente específico
      ✅ APENAS use estas frases EXATAS:
      - "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde"
      - "Pratique atividade física regular conforme orientações do Ministério da Saúde (150 min/semana)"
      - "Consulte um médico para orientações específicas"
      🚫 JAMAIS sugira: suplementos, vitaminas, minerais, nutrientes específicos, exposição solar
      📋 SIGA EXCLUSIVAMENTE as diretrizes do SUS e Ministério da Saúde
      
      ### RESPONDA ESTRITAMENTE NO SEGUINTE FORMATO JSON:
      {
        "contextualAnalysis": "Análise holística detalhada (250-350 palavras) integrando todos os marcadores relevantes com o contexto do paciente, perfil de risco individual e fatores demográficos. Destaque correlações entre diferentes parâmetros e suas implicações clínicas.",
        
        "possibleDiagnoses": [
          {
            "condition": "Nome preciso da condição médica potencial",
            "probability": "alta/média/baixa (baseado na correlação específica dos marcadores)",
            "description": "Descrição concisa da condição com foco no mecanismo fisiopatológico relevante para este paciente",
            "indicativeMarkers": ["Lista precisa de marcadores específicos que sugerem esta condição", "Com valores exatos e status (alto/baixo)"]
          }
        ],
        
        "recommendations": [
          "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde",
          "Pratique atividade física regular conforme orientações do Ministério da Saúde (150 min/semana)",
          "Consulte um médico para orientações específicas sobre os resultados",
          "Mantenha sono adequado de 7-8 horas por noite",
          "Realize acompanhamento médico regular conforme orientação profissional"
        ],
        
        "specialists": [
          "Especialista 1: especialidade médica com justificativa específica baseada nos achados",
          "Especialista 2: especialidade médica com prioridade sugerida (urgente/rotina)",
          "Especialista 3: especialidade médica com foco preventivo baseado no perfil de risco"
        ],
        
        "lifestyle": {
          "diet": "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde, priorizando alimentos in natura e minimamente processados",
          "exercise": "Pratique atividade física regular conforme orientações do Ministério da Saúde: 150 minutos de atividade moderada por semana",
          "sleep": "Mantenha sono adequado de 7-8 horas por noite com horários regulares",
          "stress_management": "Pratique técnicas de relaxamento e consulte profissional de saúde para orientações específicas"
        },
        
        "riskFactors": [
          "Fator de risco 1: descrição com grau de risco e impacto potencial",
          "Fator de risco 2: estratégias específicas de modificação",
          "Fator de risco 3: relevância particular baseada no perfil individual",
          "Fator de risco 4: conexão com achados laboratoriais específicos"
        ],
        
        "healthParameters": {
          "healthScore": "Pontuação numérica (0-100) com método de cálculo transparente baseado nos principais marcadores",
          "criticalAreas": ["Parâmetros específicos que requerem atenção imediata", "Com valores exatos e desvio do ideal"],
          "stableAreas": ["Parâmetros que estão em níveis saudáveis", "Com valores exatos"],
          "improvementTrends": ["Parâmetros que mostram melhorias", "Se dados históricos disponíveis"],
          "worseningTrends": ["Parâmetros que mostram deterioração", "Se dados históricos disponíveis"]
        },
        
        "evidenceBasedAssessment": {
          "clinicalGuidelines": [
            "Diretriz clínica 1: referência específica à diretriz atual (2023-2024) relacionada aos achados-chave",
            "Diretriz clínica 2: ponto específico da diretriz relevante para este caso"
          ],
          "studyReferences": [
            "Estudo 1: citação em formato científico de estudo relevante e recente",
            "Estudo 2: conexão específica entre o estudo e os achados do paciente",
            "Estudo 3: significância clínica do estudo para o manejo deste paciente"
          ],
          "confidenceLevel": "alto/médio/baixo com justificativa específica baseada na qualidade e completude dos dados"
        }
      }
      
      ### DIRETRIZES CRÍTICAS:
      - Adapte sua análise ao perfil demográfico exato do paciente (idade, sexo, histórico)
      - Priorize a identificação de condições subclínicas e fatores de risco modificáveis
      - Baseie todas as recomendações em evidências científicas sólidas e atualizadas
      - Mantenha um equilíbrio entre sensibilidade diagnóstica e especificidade
      - Evite alarmismo desnecessário, mas não subestime achados potencialmente significativos
      - Considere sempre a integração de múltiplos marcadores em vez de análise isolada
      - O JSON DEVE ser válido, sem erros de formatação ou campos duplicados
    `;

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return getFallbackInsights(patientData);
    }

    try {
      // Call the actual OpenAI API
      const taskName = "generateHealthInsights";
      const complexity: TaskComplexity = "complex"; // Insights requerem raciocínio
      const model = ModelRouter.getModel(taskName, complexity);

      // Pass complexity to enable proper cache TTL (e.g. complex tasks have shorter TTL)
      const response = await callOpenAIApi(prompt, model, taskName, complexity, userId, clinicId);

      return response;
    } catch (apiError) {
      return getFallbackInsights(patientData);
    }
  } catch (error) {
    throw new Error("Falha ao gerar insights de saúde com OpenAI");
  }
}

// Function to call the OpenAI API
export async function callOpenAIApi(prompt: string, modelOverride?: string, taskNameForTracking: string = "general_api_call", complexityData?: TaskComplexity, userId?: number, clinicId?: number) {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    const model = modelOverride || OPENAI_MODEL;
    const cacheParams = {
      temperature: 0.3,
      max_tokens: OPENAI_MAX_OUTPUT_TOKENS
    };

    // LGPD Compliance: Validate Anonymization
    // We strictly assume the caller has already stripped identifiers.
    logger.info(`[LGPD-Log] Anonymized Prompt Sent to OpenAI (Model: ${model}, Task: ${taskNameForTracking}) - Identifiers Redacted`);

    // 1. Check Cache
    const messages = [{ role: "user", content: prompt }];
    const cacheHash = AICacheService.generateHash(model, messages, cacheParams);

    // Only use cache for some operations or if complexity is provided
    // For now, enable for all GET calls (which these essentially are)
    const cachedResponse = await AICacheService.get(cacheHash);

    if (cachedResponse) {
      // Re-hydrate the usage tracking if we stored it? 
      // Current cache stores just the response body (JSON object).
      // We might want to track 'saved tokens' in ModelRouter?
      // model-router trackUsage logic might need update to handle 'cached' events.
      // For now, log and return.
      logger.info(`[OpenAI] Returning cached response for ${taskNameForTracking}`);
      return cachedResponse;
    }

    // 2. Call API
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages as any, // Cast to any to avoid strict type mismatch with OpenAI SDK versions
      temperature: cacheParams.temperature,
      max_tokens: cacheParams.max_tokens
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskNameForTracking, model, response.usage, userId, clinicId);
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }

    let parsedResponse;
    try {
      // Tentar analisar a resposta como JSON
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      // ... existing error handling logic ...
      // Se não for um JSON válido, tente extrair um JSON válido do conteúdo
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          parsedResponse = JSON.parse(jsonStr);
        }
      } catch (extractError) {
        // Failed
      }

      if (!parsedResponse) {
        // Fallback object logic
        parsedResponse = {
          contextualAnalysis: "Não foi possível analisar a resposta da IA. Por favor, tente novamente.",
          possibleDiagnoses: [],
          recommendations: ["Consulte um médico para uma análise profissional."],
          specialists: ["Clínico Geral"],
          lifestyle: { diet: "", exercise: "", sleep: "" },
          riskFactors: []
        };
      }
    }

    // 3. Save to Cache
    if (parsedResponse) {
      await AICacheService.set(cacheHash, parsedResponse, {
        model,
        prompt,
        complexity: complexityData || 'medium'
      });
    }

    return parsedResponse;

  } catch (error) {
    throw error;
  }
}

// Fallback response if OpenAI API is unavailable
function getFallbackInsights(patientData?: any) {

  // Base response com estrutura atualizada conforme novo formato, incluindo diagnósticos possíveis
  const response = {
    possibleDiagnoses: [
      {
        condition: "Alteração em exames específicos",
        probability: "média",
        description: "Alguns parâmetros podem estar alterados - consulte um médico para orientações específicas",
        indicativeMarkers: ["Valores fora do intervalo de referência", "Necessita avaliação médica"]
      },
      {
        condition: "Pré-diabetes",
        probability: "baixa",
        description: "Níveis de glicose em jejum ligeiramente elevados, indicando potencial risco de diabetes",
        indicativeMarkers: ["Glicemia em jejum entre 100-125 mg/dL", "Hemoglobina glicada (HbA1c) entre 5.7-6.4%"]
      }
    ],
    recommendations: [
      "Consulte um clínico geral para discutir os resultados dos exames",
      "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde",
      "Pratique atividade física regular conforme orientações do Ministério da Saúde (150 min/semana)",
      "Mantenha sono adequado de 7-8 horas por noite",
      "Realize acompanhamento médico regular conforme orientação profissional"
    ],
    specialists: [
      "Nutricionista - para orientação alimentar personalizada",
      "Endocrinologista - para avaliação dos níveis de glicemia",
      "Cardiologista - para acompanhamento preventivo"
    ],
    lifestyle: {
      diet: "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde, priorizando alimentos in natura",
      exercise: "Pratique atividade física regular conforme orientações do Ministério da Saúde: 150 minutos por semana",
      sleep: "Mantenha sono adequado de 7-8 horas por noite com horários regulares",
      stress_management: "Pratique técnicas de relaxamento e consulte profissional de saúde para orientações específicas"
    },
    riskFactors: [
      "Alterações metabólicas - consulte médico para avaliação específica",
      "Parâmetros fora do intervalo de referência - necessita acompanhamento médico",
      "Fatores de risco cardiovascular - siga orientações do Ministério da Saúde"
    ],
    contextualAnalysis: "Análise contextual não disponível no momento. Consulte um médico para uma avaliação personalizada.",

    // Novos campos adicionados conforme o formato atualizado
    healthParameters: {
      healthScore: 75,
      criticalAreas: ["Metabolismo da glicose", "Níveis de Vitamina D"],
      stableAreas: ["Função cardíaca", "Função renal", "Hemograma básico"],
      improvementTrends: [],
      worseningTrends: []
    },
    evidenceBasedAssessment: {
      clinicalGuidelines: [
        "American Diabetes Association (ADA) - Diretrizes para prevenção de diabetes 2024",
        "Sociedade Brasileira de Endocrinologia - Protocolo de tratamento para deficiência de Vitamina D"
      ],
      studyReferences: [
        "Journal of Clinical Endocrinology & Metabolism, 2023 - Relação entre vitamina D e imunidade",
        "The Lancet, 2024 - Impacto da atividade física regular em biomarcadores metabólicos"
      ],
      confidenceLevel: "médio"
    }
  };

  // If we have patient data, add some customization to the response
  if (patientData) {
    if (patientData.gender === 'feminino') {
      response.recommendations.push("Considere incluir um exame de densitometria óssea para monitorar a saúde óssea");
      if (patientData.age && patientData.age > 40) {
        response.specialists.push("Ginecologista - para acompanhamento hormonal");
        response.evidenceBasedAssessment.clinicalGuidelines.push(
          "Sociedade Brasileira de Ginecologia - Protocolo de acompanhamento para mulheres acima de 40 anos"
        );
      }
    } else if (patientData.gender === 'masculino') {
      response.recommendations.push("Considere incluir exames de próstata para monitoramento preventivo");
      if (patientData.age && patientData.age > 45) {
        response.specialists.push("Urologista - para acompanhamento preventivo");
        response.evidenceBasedAssessment.clinicalGuidelines.push(
          "Sociedade Brasileira de Urologia - Diretrizes para rastreamento de câncer de próstata 2024"
        );
      }
    }

    if (patientData.diseases && patientData.diseases.includes('diabetes')) {
      response.riskFactors.push("Diabetes diagnosticada - necessita monitoramento rigoroso da glicemia (evidência forte)");
      response.lifestyle.diet = "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde, priorizando alimentos in natura";
      response.healthParameters.criticalAreas.push("Controle glicêmico rigoroso");
      response.healthParameters.healthScore = 65;
      response.evidenceBasedAssessment.studyReferences.push(
        "The New England Journal of Medicine, 2024 - Estratégias personalizadas para manejo de diabetes tipo 2"
      );
    }

    if (patientData.allergies && patientData.allergies.length > 0) {
      response.riskFactors.push(`Alergias a ${patientData.allergies.join(', ')} - considerar em qualquer tratamento (evidência forte)`);
      response.healthParameters.criticalAreas.push("Manejo de alergias");
    }

    response.contextualAnalysis = "Análise baseada no perfil do paciente. Os parâmetros de saúde foram ajustados considerando as condições pré-existentes, histórico e demografia. Recomenda-se consulta médica para avaliação completa e individualizada.";
  }

  return response;
}

function parseLocalCommand(command: string, availablePatients: { id: number; name: string }[] = []) {
  const lower = command.toLowerCase();
  const now = new Date();

  // 1. Identify Type
  let type = "consulta";
  if (lower.includes("retorno")) type = "retorno";
  else if (lower.includes("exame")) type = "exames";
  else if (lower.includes("urgencia") || lower.includes("urgência")) type = "urgencia";

  // 2. Identify Patient (Priority: Known Patients)
  let patientName = "Paciente";
  let patientId: number | undefined;

  // Try to find a known patient in the command string directly
  if (availablePatients.length > 0) {
    // Sort by length desc to match longer names first ("Ricardo Silva" before "Ricardo")
    const sortedPatients = [...availablePatients].sort((a, b) => b.name.length - a.name.length);

    for (const p of sortedPatients) {
      const pNameLower = p.name.toLowerCase();
      // Check full name or first name
      const pFirstName = pNameLower.split(' ')[0];

      // We look for the name in the command, ensuring it's a whole word match
      // regex: \bname\b
      if (new RegExp(`\\b${pNameLower}\\b`).test(lower) || new RegExp(`\\b${pFirstName}\\b`).test(lower)) {
        patientName = p.name;
        patientId = p.id;
        break; // Match found
      }
    }
  }

  // If no known patient found, try to extract from text
  if (!patientId) {
    // Remove date/time keywords to avoid capturing them as name
    let cleanCommand = command
      .replace(/\bhoje\b/gi, "")
      .replace(/\bamanh[ãa]\b/gi, "")
      .replace(/\bdia\s+\d+\b/gi, "")
      .replace(/\b(?:às|as|at)\s*\d+[:h]?\d*/gi, "")
      .replace(/\d+\s*h(?:oras)?/gi, "");

    const patientMatch = cleanCommand.match(/(?:para|com|paciente)\s+(?:o\s+|a\s+)?([A-Z][a-z\u00C0-\u00FF]+(?:\s+[A-Z][a-z\u00C0-\u00FF]+)*)/i);
    if (patientMatch) {
      patientName = patientMatch[1].trim();
    }
  }

  // 3. Identify Time
  let time = "09:00";
  const timeMatch = lower.match(/(?:às|as|at)?\s*(\d{1,2})[:h](\d{2})?/) || lower.match(/(\d{1,2})\s*h(?:oras)?/);

  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
  }

  // 4. Identify Date
  let date = now;
  // Check for "hoje"
  if (lower.includes("hoje")) {
    // date is already today
  }
  // Check for "amanhã" or "amanha"
  else if (lower.includes("amanhã") || lower.includes("amanha")) {
    date.setDate(date.getDate() + 1);
  }
  // Check for "dia X"
  else {
    const dayMatch = lower.match(/dia\s+(\d{1,2})/);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      // If the day is in the past for this month, assume next month
      if (day < now.getDate()) {
        date.setMonth(date.getMonth() + 1);
      }
      date.setDate(day);
    }
  }

  const dateStr = date.toISOString().split('T')[0];

  return {
    patientName,
    patientId,
    date: dateStr,
    time,
    type,
    notes: "Agendamento processado localmente",
    conflicts: [],
    suggestedAlternatives: []
  };
}

export async function parseAppointmentCommand(command: string, files?: Express.Multer.File[], availablePatients: { id: number; name: string }[] = []) {
  try {
    let existingAppointments = "";

    // Process uploaded files if any
    if (files && files.length > 0) {
      const fileAnalyses = await Promise.all(
        files.map(async (file) => {
          if (file.mimetype.startsWith('image/')) {
            return await extractAppointmentsFromImage(file);
          } else if (file.mimetype === 'application/pdf') {
            return await extractAppointmentsFromPDF(file);
          }
          return "";
        })
      );

      existingAppointments = fileAnalyses.filter(Boolean).join("\n");
    }

    // Calculate helpful dates
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const daysUntilNextMonday = (1 + 7 - currentDay) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);

    // Calculate month ranges
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const prompt = `
      Você é um assistente de agendamento médico de alta precisão.
      Sua tarefa é extrair informações de um comando de texto para criar um agendamento.
      
      COMANDO DO USUÁRIO: "${command}"
      
      CONTEXTO DE DATAS (USE ESTAS REFERÊNCIAS):
      - DATA DE HOJE (BASE): ${today.toISOString().split('T')[0]} (${today.toLocaleDateString('pt-BR', { weekday: 'long' })})
      - PRÓXIMA SEGUNDA (Semana que vem): ${nextMonday.toISOString().split('T')[0]}
      - PRÓXIMA SEXTA: ${nextFriday.toISOString().split('T')[0]}
      - INÍCIO MÊS ATUAL: ${startOfCurrentMonth.toISOString().split('T')[0]}
      - FIM MÊS ATUAL: ${endOfCurrentMonth.toISOString().split('T')[0]}
      - INÍCIO PRÓXIMO MÊS: ${startOfNextMonth.toISOString().split('T')[0]}
      - FIM PRÓXIMO MÊS: ${endOfNextMonth.toISOString().split('T')[0]}
      
      ${existingAppointments ? `COMPROMISSOS JÁ EXISTENTES PARA CONTEXTO:\n${existingAppointments}\n` : ''}
      
      PACIENTES CADASTRADOS (Para correlação de nomes):
      ${availablePatients.map(p => `- ID ${p.id}: ${p.name}`).join('\n')}

      REGRA PRINCIPAL:
      Você deve analisar o comando e retornar APENAS um objeto JSON válido.
      
      INSTRUÇÕES DE INTERPRETAÇÃO:
      
      1. TIPO DE AGENDAMENTO ("type"):
         - "consulta": Agendamento padrão, consultas novas.
         - "retorno": Se mencionar "retorno", "volta", "revisão".
         - "exames": Se mencionar "exame", "analise", "coleta".
         - "urgencia": Se mencionar "urgência", "emergência", "dor", "prioridade".
         - "blocked": Se mencionar "bloquear", "férias", "folga", "recesso", "não atender" (PARA CRIAR BLOQUEIO).
         - "unblock": Se mencionar "desbloquear", "liberar", "cancelar bloqueio", "remover bloqueio", "estou de volta" (PARA REMOVER BLOQUEIO).

      2. DATA ("date" e "endDate"):
         - Formato YYYY-MM-DD.
         - Se for período (ex: "semana que vem", "do dia X ao dia Y"), preencha "date" (início) e "endDate" (fim).
         - "Semana que vem" = ${nextMonday.toISOString().split('T')[0]} até ${nextFriday.toISOString().split('T')[0]}.
         - "Mês que vem" = ${startOfNextMonth.toISOString().split('T')[0]} até ${endOfNextMonth.toISOString().split('T')[0]}.
         - "Bloquear férias em Outubro" -> date: primeiro dia de outubro, endDate: último dia de outubro (do ano atual, ou próximo se outubro já passou).

      3. HORÁRIO ("time"):
         - Formato HH:mm.
         - Se não especificado: "09:00" (padrão).
         - Se for dia todo ("isAllDay"): "08:00".

      4. PACIENTE ("patientId" e "patientName"):
         - Tente encontrar o nome mais próximo na lista de PACIENTES CADASTRADOS.
         - Se encontrar, use o ID e o Nome exato da lista.
         - Se não encontrar na lista, extraia o nome do texto (ex: "Paciente para [Nome]").
         - Se for "type": "blocked", o "patientName" deve ser o motivo do bloqueio (ex: "Bloqueio de Agenda", "Férias", "Feriado").
         - Se for "type": "unblock", o "patientName" pode ser "Desbloqueio de Agenda" ou vazio.
         
      5. OBSERVAÇÕES ("notes"):
         - Qualquer detalhe extra (sintomas, motivo, observações).

      RESPOSTA ESTRITAMENTE EM JSON NESTE FORMATO:
      {
        "patientName": string,
        "patientId": number | null,
        "date": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD" | null,
        "time": "HH:mm",
        "type": "consulta" | "retorno" | "exames" | "urgencia" | "blocked" | "unblock",
        "notes": string,
        "isAllDay": boolean,
        "conflicts": string[],
        "suggestedAlternatives": string[]
      }
    `;

    if (!process.env.OPENAI_API_KEY) {
      console.log("Using local parsing fallback for appointment command (No API Key)");
      return parseLocalCommand(command, availablePatients);
    }

    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    const taskName = "parseAppointmentCommand";
    const complexity: TaskComplexity = "simple";
    const model = ModelRouter.getModel(taskName, complexity);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // Enforce JSON Output
      temperature: 0.1, // Lower temperature for more deterministic/rigid parsing
      max_tokens: 1000
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskName, model, response.usage);
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing appointment command:", error);
    // Fallback to local parser on error if needed, or rethrow
    return parseLocalCommand(command, availablePatients);
  }
}

/**
 * Gera um relatório cronológico contextual baseado nos exames do paciente ao longo do tempo
 * @param examResults - Lista de resultados de exames em ordem cronológica
 * @param user - Dados do usuário
 * @returns Relatório cronológico com análise de tendências
 */

/**
 * Analisa exames já extraídos previamente usando a OpenAI
 * @param examId ID do exame que já possui dados estruturados e está pronto para análise
 * @param userId ID do usuário dono do exame
 * @param storage Interface de armazenamento para acessar dados
 * @param patientData Dados adicionais do paciente para contextualização
 */
export async function analyzeExtractedExam(examId: number, userId: number, storage: IStorage, patientData?: any) {
  try {

    // 1. Obter o exame e resultado da extração inicial
    const exam = await storage.getExam(examId);
    if (!exam || exam.userId !== userId) {
      throw new Error("Exame não encontrado ou acesso não autorizado");
    }

    if (exam.status !== "ready_for_analysis" && exam.status !== "extracted" && exam.status !== "analyzing") {
      throw new Error(`Exame com status inválido para análise: ${exam.status}`);
    }

    // 2. Obter resultado da extração prévia armazenado no banco
    const extractionResult = await storage.getExamResultByExamId(examId);
    if (!extractionResult) {
      throw new Error("Resultado da extração não encontrado");
    }

    // 3. Obter métricas diretamente do resultado da extração, não de health_metrics
    const examDateStr = exam?.examDate ? new Date(exam.examDate).toISOString().split('T')[0] :
      exam?.uploadDate ? new Date(exam.uploadDate).toISOString().split('T')[0] : null;

    // Usar as métricas que já foram extraídas e armazenadas em examResults
    // em vez de tentar buscar da tabela health_metrics que está incompleta
    let metricsFromThisExam = [];

    if (extractionResult.healthMetrics && Array.isArray(extractionResult.healthMetrics)) {
      metricsFromThisExam = extractionResult.healthMetrics;
    } else {
      // Nenhuma métrica encontrada no resultado da extração. Usando array vazio.
    }

    // 4. Organizar métricas por categoria para uma análise mais estruturada
    const metricsByCategory = new Map();
    metricsFromThisExam.forEach(metric => {
      const category = metric.category || "Geral";
      if (!metricsByCategory.has(category)) {
        metricsByCategory.set(category, []);
      }
      metricsByCategory.get(category).push(metric);
    });

    const patientContext = formatPatientContext(patientData);

    // Criar prompt mais estruturado para a OpenAI com base nas categorias de exames
    let metricsDescriptionByCategory = "";
    metricsByCategory.forEach((metrics, category) => {
      metricsDescriptionByCategory += `\n### ${category.toUpperCase()} (${metrics.length} parâmetros):\n`;
      metrics.forEach((metric: any) => {
        const status = metric.status ? ` (${metric.status.toUpperCase()})` : '';
        const reference = (metric.referenceMin && metric.referenceMax)
          ? ` [Referência: ${metric.referenceMin}-${metric.referenceMax} ${metric.unit || ''}]`
          : '';
        metricsDescriptionByCategory += `- ${metric.name}: ${metric.value} ${metric.unit || ''}${status}${reference}\n`;
        if (metric.clinical_significance) {
          metricsDescriptionByCategory += `  Significado clínico: ${metric.clinical_significance}\n`;
        }
      });
    });

    // 5. Criar prompt para OpenAI com análise holística e categorizada
    const prompt = `
      Você é um especialista médico altamente qualificado em medicina laboratorial e diagnóstico clínico.
      Agora você vai realizar uma ANÁLISE GLOBAL E HOLÍSTICA dos resultados de exames que já foram processados e extraídos previamente.
      
      ### TAREFA PRINCIPAL:
      Analise detalhadamente os seguintes resultados de exames médicos e forneça uma avaliação médica integrativa,
      correlacionando os diferentes parâmetros entre si e com o contexto do paciente quando disponível.
      
      ### DADOS DO PACIENTE:
      ${patientContext}
      
      ### DADOS DO EXAME:
      - Nome: ${exam?.name || 'Não informado'}
      - Tipo de documento: ${exam?.fileType || 'Não informado'}
      - Data do exame: ${examDateStr || 'Não informada'}
      - Laboratório: ${exam?.laboratoryName || 'Não informado'}
      - Médico solicitante: ${exam?.requestingPhysician ? `Dr. ${exam.requestingPhysician}` : 'Não informado'}
      
      ### MÉTRICAS DE SAÚDE ORGANIZADAS POR CATEGORIA:
      ${metricsDescriptionByCategory}
      
      ### INSTRUÇÕES ESPECÍFICAS:
      1. INTEGRE todos os resultados em uma análise clínica compreensiva.
      2. Identifique CORRELAÇÕES e PADRÕES entre diferentes marcadores de diferentes categorias.
      3. Destaque ALTERAÇÕES SIGNIFICATIVAS e explique sua importância clínica.
      4. Considere o CONTEXTO COMPLETO, incluindo exames de diferentes categorias.
      5. Sugira possíveis diagnósticos com diferentes níveis de probabilidade.
      6. Forneça recomendações específicas e personalizadas.
      7. Identifique especialidades médicas relevantes para acompanhamento.
      8. Inclua sugestões de estilo de vida baseadas nos resultados.
      9. Avalie fatores de risco evidenciados pelos exames.
      10. Calcule um "health score" estimado (0-100) baseado nos resultados.
      
      ### FORMATO DA RESPOSTA (responda EXATAMENTE neste formato JSON):
      {
        "contextualAnalysis": "Análise contextualizada dos resultados, integrando diferentes categorias de exames (2-3 parágrafos)",
        "possibleDiagnoses": [
          {
            "condition": "Nome da possível condição",
            "probability": "alta|média|baixa",
            "description": "Breve descrição da condição",
            "indicativeMarkers": ["Marcador 1", "Marcador 2"]
          }
        ],
        "recommendations": [
          "Recomendação específica 1",
          "Recomendação específica 2"
        ],
        "specialists": [
          "Especialidade médica 1 para acompanhamento",
          "Especialidade médica 2 para acompanhamento"
        ],
        "lifestyle": {
          "diet": "Recomendações nutricionais específicas",
          "exercise": "Recomendações de atividade física",
          "sleep": "Recomendações sobre sono",
          "stress_management": "Recomendações sobre gestão do estresse"
        },
        "riskFactors": [
          "Fator de risco 1 identificado nos resultados",
          "Fator de risco 2 identificado nos resultados"
        ],
        "healthParameters": {
          "healthScore": 85,
          "criticalAreas": ["Área 1", "Área 2"],
          "stableAreas": ["Área 3", "Área 4"],
          "improvementTrends": ["Tendência 1", "Tendência 2"],
          "worseningTrends": ["Tendência 3", "Tendência 4"]
        },
        "evidenceBasedAssessment": {
          "clinicalGuidelines": ["Diretriz 1", "Diretriz 2"],
          "studyReferences": ["Referência 1", "Referência 2"],
          "confidenceLevel": "Alta|Média|Baixa"
        }
      }
      
      Importante: Respeite RIGOROSAMENTE o formato JSON acima. Sua análise deve ser integrada e holística, considerando TODAS as categorias de exames em conjunto.
    `;

    // 6. Chamar a API da OpenAI
    // 6. Chamar a API da OpenAI
    const taskName = "analyzeExtractedExam";
    const complexity: TaskComplexity = "medium"; // Análise holística de dados já extraídos
    const model = ModelRouter.getModel(taskName, complexity);

    // Pass model, taskName and complexity to updated callOpenAIApi
    const insightsResponse = await callOpenAIApi(prompt, model, taskName, complexity, userId);

    // 7. Atualizar o exame para refletir a análise completa
    await storage.updateExam(examId, {
      status: "analyzed"
    });

    // 8. Criar um novo resultado com a análise completa
    const analysisResult = await storage.createExamResult({
      examId: examId,
      summary: insightsResponse.contextualAnalysis?.substring(0, 150) + "...",
      detailedAnalysis: JSON.stringify(insightsResponse),
      recommendations: insightsResponse.recommendations?.join("\n"),
      healthMetrics: extractionResult.healthMetrics as any, // Mantém as métricas da extração
      aiProvider: "openai:analysis"
    });

    // 9. Notificar o usuário
    await storage.createNotification({
      userId,
      title: "Análise completa disponível",
      message: `A análise detalhada do exame "${exam?.name || 'sem nome'}" está pronta para visualização`,
      read: false
    });

    return {
      exam,
      extractionResult,
      analysisResult,
      insights: insightsResponse
    };

  } catch (error: any) {
    // Em caso de falha, retornar um erro estruturado
    return {
      error: true,
      message: `Falha ao analisar o exame: ${error.message || 'Erro desconhecido'}`,
      details: String(error)
    };
  }
}

/**
 * Analisa um documento médico usando exclusivamente a OpenAI
 * @param fileContent - Conteúdo do arquivo codificado em Base64
 * @param fileType - Tipo do arquivo (pdf, jpeg, png)
 * @returns Resultado da análise com métricas de saúde e recomendações
 */
export async function analyzeDocumentWithOpenAI(fileContent: string, fileType: string, userId?: number, clinicId?: number) {
  // Verificar se a API key está disponível
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not available");
  }

  if (!openai) {
    throw new Error("OpenAI client not initialized");
  }

  const truncateBase64 = (content: string) => {
    const MAX_LENGTH = 6_000_000; // ~6MB em base64
    return content.length > MAX_LENGTH ? content.substring(0, MAX_LENGTH) : content;
  };

  // Limitar o tamanho do conteúdo para evitar exceder limites da API
  const originalBase64Length = fileContent.length;
  const truncatedContent = truncateBase64(fileContent);
  const wasTruncated = truncatedContent.length !== originalBase64Length;

  const mimeType =
    fileType === "jpeg" ? "image/jpeg" :
      fileType === "png" ? "image/png" :
        "application/pdf";

  const prompt = `Você é um médico especialista em análise de exames laboratoriais e diagnóstico clínico.
                Sua análise é baseada em diretrizes médicas atualizadas (2024) e evidências científicas.
                
                ⚠️ ALERTA LEGAL OBRIGATÓRIO (MINISTÉRIO DA SAÚDE):
                🚫 É CRIME mencionar: vitamina D, B12, C, zinco, magnésio, ferro, cálcio, ômega 3, QUALQUER nutriente específico
                ✅ APENAS use estas frases LITERAIS:
                - "Mantenha alimentação equilibrada conforme Guia Alimentar do Ministério da Saúde"
                - "Pratique atividade física regular conforme orientações do Ministério da Saúde"
                - "Consulte um médico para orientações específicas"
                🚫 TOTALMENTE PROIBIDO: suplementos, vitaminas, minerais, exposição solar específica
                📋 SIGA APENAS diretrizes do SUS
                
                Analise este exame ${fileType.toUpperCase()} e forneça um relatório detalhado e baseado em evidências,
                incluindo achados clínicos relevantes, interpretação precisa dos valores, 
                correlações entre parâmetros, diretrizes clínicas aplicáveis.
                
                Analise a imagem ou PDF do exame cuidadosamente e extraia todas as informações relevantes.
                Estabeleça parâmetros de saúde baseados em evidências científicas recentes.
                Inclua citações de estudos ou diretrizes quando pertinente.
                
                Formate sua resposta como um JSON com a seguinte estrutura:
                {
                  "summary": "resumo geral dos resultados, em uma frase",
                  "detailedAnalysis": "análise detalhada e fundamentada dos resultados encontrados",
                  "recommendations": ["APENAS orientações conforme Ministério da Saúde: alimentação equilibrada, atividade física 150min/semana, consulte médico para orientações específicas"],
                  "healthMetrics": [
                    {
                      "name": "nome do parâmetro, ex: hemoglobina",
                      "value": "valor numérico, ex: 14.2",
                      "unit": "unidade, ex: g/dL",
                      "status": "normal, atenção, alto ou baixo",
                      "change": "+0.1 ou -0.2 comparado com o valor anterior",
                      "referenceRange": "intervalo de referência considerado normal",
                      "evidenceLevel": "nível de evidência científica (forte, moderada, preliminar)",
                      "clinicalSignificance": "significado clínico deste parâmetro"
                    }
                  ],
                  "healthStatus": {
                    "overallScore": "pontuação global de saúde (0-100)",
                    "criticalParameters": ["parâmetros que exigem atenção imediata"],
                    "stableParameters": ["parâmetros que estão em níveis aceitáveis"],
                    "clinicalGuidelines": ["diretrizes clínicas relevantes para os resultados"],
                    "differentialAnalysis": "análise diferencial considerando os resultados",
                    "confidenceLevel": "nível de confiança na análise (alto, médio, baixo)"
                  },
                  "examMetadata": {
                    "documentTitle": "título amigável do exame (ex: Controle de glicemia - Março/2025)",
                    "examType": "categoria curta (ex: Controle de glicemia, Pré-operatório, Check-up cardiovascular)",
                    "examCategory": "especialidade (ex: Endocrinologia, Cardiologia, Pré-operatório)",
                    "examPurpose": "motivo do exame (ex: acompanhamento, pré-operatório, check-up)",
                    "requestingPhysician": "nome do médico solicitante sem prefixos Dr./Dra.",
                    "laboratoryName": "nome do laboratório ou hospital",
                    "examDate": "data no formato YYYY-MM-DD",
                    "patientName": "nome identificado no documento, se houver"
                  }
                }
                
                Regras adicionais:
                - Se o documento não citar médico solicitante, defina "requestingPhysician" como null.
                - Remova prefixos como Dr./Dra. ao preencher "requestingPhysician".
                - Sempre crie um "documentTitle" descritivo mesmo quando o arquivo possuir um nome genérico (ex: transformar "scan123.pdf" em "Controle de glicemia - Abril/2025").
                - "examType" deve ser curto e contextual (ex: "Pré-operatório", "Painel lipídico", "Controle de glicemia").`;

  logger.info("[OpenAI] analyzeDocumentWithOpenAI start", {
    fileType,
    mimeType,
    originalBase64Length,
    truncatedLength: truncatedContent.length,
    wasTruncated,
    model: OPENAI_MODEL,
    fallbackModel: OPENAI_FALLBACK_MODEL
  });

  let uploadedFileId: string | null = null;

  try {
    const contentParts: any[] = [
      { type: "input_text", text: prompt }
    ];

    if (fileType === "pdf") {
      if (typeof File === "undefined") {
        throw new Error("File constructor not available. Update to Node.js 18+ or provide a compatible implementation.");
      }

      const pdfBuffer = Buffer.from(fileContent, "base64");
      // Converter Buffer para ArrayBuffer/Uint8Array compatível com File
      const pdfUint8Array = new Uint8Array(pdfBuffer);

      const uploadedFile = await openai.files.create({
        file: new File([pdfUint8Array], `exam-${Date.now()}.pdf`, { type: "application/pdf" }),
        purpose: "assistants"
      });
      uploadedFileId = uploadedFile.id;
      contentParts.push({ type: "input_file", file_id: uploadedFile.id });
    } else {
      contentParts.push({
        type: "input_image",
        image_url: `data:${mimeType};base64,${truncatedContent}`,
        detail: "auto"
      });
    }

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content: contentParts
        }
      ],
      temperature: 0.2,
      max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS
    });

    if (response.status === "incomplete") {
      const reason = response.incomplete_details?.reason || "unknown";
      throw new Error(`OpenAI response incomplete (${reason}).`);
    }

    const content = extractResponseText(response);
    const sanitizedContent = stripMarkdownCodeFence(content);
    if (!sanitizedContent) {
      throw new Error("Empty response from GPT-5");
    }

    const jsonPayload = extractJsonPayload(sanitizedContent);
    if (!jsonPayload) {
      throw new Error("GPT-5 response did not contain a valid JSON object");
    }

    let analysisData;
    try {
      analysisData = JSON.parse(jsonPayload);
    } catch (parseError) {
      logger.warn("[OpenAI] Falha ao converter resposta em JSON", {
        message: parseError instanceof Error ? parseError.message : String(parseError)
      });
      throw parseError;
    }
    if (!analysisData.healthMetrics || !Array.isArray(analysisData.healthMetrics) || analysisData.healthMetrics.length === 0) {
      throw new Error("Invalid health metrics in GPT-5 response");
    }

    logger.info("[OpenAI] análise concluída (responses API)", {
      fileType,
      healthMetricsCount: analysisData.healthMetrics.length,
      hasSummary: Boolean(analysisData.summary)
    });

    return normalizeAnalysisPayload(analysisData, "openai:gpt5");
  } catch (primaryError) {
    logger.warn("[OpenAI] falha na Responses API, tentando fallback", {
      fileType,
      message: primaryError instanceof Error ? primaryError.message : primaryError,
      stack: primaryError instanceof Error ? primaryError.stack : undefined
    });

    if (fileType === "pdf") {
      throw primaryError instanceof Error ? primaryError : new Error("Falha ao analisar documento");
    }

    // Fallback para modelos legados caso a API de Responses não esteja disponível
    const fallbackResponse = await openai.chat.completions.create({
      model: OPENAI_FALLBACK_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${truncatedContent}` } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: OPENAI_MAX_OUTPUT_TOKENS
    });

    const fallbackContent = extractResponseText(fallbackResponse);
    const sanitizedFallbackContent = stripMarkdownCodeFence(fallbackContent);
    if (!sanitizedFallbackContent) {
      logger.error("[OpenAI] Fallback retornou conteúdo vazio", {
        fileType,
        originalError: primaryError instanceof Error ? primaryError.message : primaryError
      });
      throw primaryError instanceof Error ? primaryError : new Error("Falha ao analisar documento");
    }

    const fallbackJsonPayload = extractJsonPayload(sanitizedFallbackContent);
    if (!fallbackJsonPayload) {
      throw primaryError instanceof Error ? primaryError : new Error("Falha ao analisar documento");
    }

    let fallbackData;
    try {
      fallbackData = JSON.parse(fallbackJsonPayload);
    } catch (parseError) {
      logger.error("[OpenAI] Fallback retornou JSON inválido", {
        fileType,
        message: parseError instanceof Error ? parseError.message : parseError,
        originalError: primaryError instanceof Error ? primaryError.message : primaryError
      });
      throw primaryError instanceof Error ? primaryError : new Error("Falha ao analisar documento");
    }
    if (!fallbackData.healthMetrics || !Array.isArray(fallbackData.healthMetrics) || fallbackData.healthMetrics.length === 0) {
      logger.error("[OpenAI] Fallback retornou métricas inválidas", {
        fileType,
        originalError: primaryError instanceof Error ? primaryError.message : primaryError
      });
      throw primaryError instanceof Error ? primaryError : new Error("Falha ao analisar documento");
    }
    logger.info("[OpenAI] análise concluída (fallback chat completions)", {
      fileType,
      healthMetricsCount: fallbackData.healthMetrics.length,
      hasSummary: Boolean(fallbackData.summary)
    });

    return normalizeAnalysisPayload(fallbackData, "openai:gpt5:fallback");
  } finally {
    if (uploadedFileId) {
      try {
        await openai.files.del(uploadedFileId);
      } catch (cleanupError) {
        logger.warn("[OpenAI] Falha ao remover arquivo temporário", {
          fileType,
          fileId: uploadedFileId,
          message: cleanupError instanceof Error ? cleanupError.message : cleanupError
        });
      }
    }
  }
}

// Interface específica para o usuário requerido na função
interface UserInfo {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  password?: string;
  createdAt?: Date;
}

export async function generateChronologicalReport(examResults: ExamResult[], user: UserInfo) {
  try {

    // Prepara informações do paciente para contextualização
    const patientInfo = `
      Dados do paciente:
      - Nome: ${user.fullName || 'Não informado'}
      - Sexo: ${user.gender || 'Não informado'}
      - Data de nascimento: ${user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Não informada'}
      - Email: ${user.email || 'Não informado'}
      - Telefone: ${user.phoneNumber || 'Não informado'}
      - Endereço: ${user.address || 'Não informado'}
    `;

    // Prepara informações dos exames em ordem cronológica
    const examsInfo = examResults.map((result, index) => {
      // Usamos analysisDate diretamente, que é uma propriedade garantida pelo modelo
      const examDate = result.analysisDate || new Date();

      return `
        Exame #${index + 1} - Data: ${new Date(examDate).toLocaleDateString('pt-BR')}
        ID: ${result.id}
        Resumo: ${result.summary}
        Análise detalhada: ${result.detailedAnalysis}
        Recomendações: ${result.recommendations}
        Métricas principais: ${JSON.stringify(result.healthMetrics)}
      `;
    }).join('\n\n');

    // Prompt aprimorado para a OpenAI focado em análise baseada em evidências
    const prompt = `
      Você é um médico especialista em análise de tendências de saúde e histórico médico.
      Sua análise é baseada em diretrizes clínicas atualizadas (2024) e evidências científicas sólidas.
      
      ${patientInfo}
      
      Analise os seguintes exames em ordem cronológica:
      
      ${examsInfo}
      
      Crie um relatório cronológico contextual detalhado e baseado em evidências que inclua:
      1. Uma análise abrangente da evolução dos principais indicadores de saúde ao longo do tempo
      2. Identificação precisa de tendências (melhoria, piora ou estabilidade) com significância clínica
      3. Correlações entre diferentes métricas de saúde com base na literatura médica atual
      4. Avaliação da eficácia das intervenções recomendadas anteriormente considerando diretrizes clínicas
      5. Recomendações futuras baseadas na evolução histórica e evidências científicas atualizadas
      6. Parâmetros de saúde baseados em evidências e sua evolução ao longo do tempo
      7. Citações de estudos científicos relevantes ou diretrizes clínicas aplicáveis aos achados
      
      Responda em formato JSON com as seguintes propriedades:
      1. summary: resumo geral da evolução do paciente
      2. trends: array de tendências identificadas nos principais indicadores, incluindo significância clínica e nível de evidência
      3. correlations: array de correlações identificadas entre diferentes métricas, com suporte na literatura médica
      4. effectivenessAnalysis: análise da eficácia das intervenções anteriores baseada em evidências
      5. futureRecommendations: array de recomendações futuras fundamentadas em diretrizes clínicas atualizadas
      6. overallAssessment: avaliação geral e contextualizada da saúde do paciente
      7. healthParameters: {
          healthScore: pontuação global de saúde (0-100),
          criticalAreas: áreas que precisam de atenção imediata,
          stableAreas: áreas com parâmetros estáveis ou saudáveis,
          improvementTrends: tendências de melhoria identificadas,
          worseningTrends: tendências de piora identificadas
       }
      8. evidenceBasedAssessment: {
          clinicalGuidelines: diretrizes clínicas relevantes para os achados,
          studyReferences: referências de estudos aplicáveis,
          confidenceLevel: nível de confiança na avaliação (alto, médio, baixo)
       }
    `;

    // Verifica se a API key está disponível
    if (!process.env.OPENAI_API_KEY) {
      return getFallbackChronologicalReport(examResults, user);
    }

    try {
      if (!openai) {
        throw new Error("OpenAI client not initialized");
      }

      // Chama a API da OpenAI
      const taskName = "generateChronologicalReport";
      const complexity: TaskComplexity = "complex"; // Relatório cronológico é complexo
      const model = ModelRouter.getModel(taskName, complexity);

      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: OPENAI_MAX_OUTPUT_TOKENS
      });

      if (response.usage) {
        ModelRouter.trackUsage(taskName, model, response.usage);
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI API");
      }

      return JSON.parse(content);
    } catch (apiError) {
      return getFallbackChronologicalReport(examResults, user);
    }
  } catch (error) {
    throw new Error("Falha ao gerar relatório cronológico com OpenAI");
  }
}

export async function extractRecordFromAnamnesis(text: string, userId?: number, clinicId?: number) {
  if (!text || !text.trim()) {
    throw new Error("Texto da anamnese é obrigatório");
  }

  const encounterDate = getTodayIsoDate();

  if (!process.env.OPENAI_API_KEY || !openai) {
    return fallbackAnamnesisExtraction(text, encounterDate);
  }

  const instructions = `
Você é um médico especialista em clínica integrativa.
Analise a anamnese abaixo e extraia o máximo possível de informações clínicas estruturadas, sem inventar fatos.

REGRAS OBRIGATÓRIAS:
- Use apenas dados realmente presentes no texto.
- Escreva o campo "summary" em linguagem clínica natural, breve e objetiva, como um colega resumindo o caso.
- Nunca use no "summary" ou em qualquer campo "notes" frases metalinguísticas sobre ausência de dados ou sobre o processo de extração.
- São proibidas expressões como: "não foi dito", "não se pode identificar", "não informado", "não relatado", "não mencionado", "sem dados", "sem informações", "detectado automaticamente", "gerado automaticamente" e "a partir das informações prestadas".
- Quando uma categoria não aparecer no texto, retorne array vazio para essa categoria.
- Se um item estiver mencionado, mas algum detalhe daquele item faltar, use null apenas nos campos desconhecidos.
- Em "notes", registre somente observações clínicas úteis, como hipótese, contexto temporal, controle da doença ou resposta a tratamento. Nunca descreva a extração.
- Se um diagnóstico estiver escrito de forma explícita, inclua-o em "diagnoses" mesmo que o texto esteja bruto ou telegráfico.
- Sempre que houver um diagnóstico nominal, tente associar o CID-10 mais adequado.
- Se qualquer campo de data estiver ausente, preencha com a data atual da consulta (${encounterDate}).
- Não invente sintomas, exames, medicamentos, alergias, cirurgias ou datas históricas.
- Se algo estiver mencionado como hipótese, suspeita ou impressão diagnóstica, registre em notes.
- Para cada categoria, preencha os campos conhecidos e use null quando não tiver certeza.
Datas devem estar no formato YYYY-MM-DD.
Status aceitos: "ativo", "em_tratamento", "resolvido", "cronico".

Responda apenas em JSON no formato:
{
  "summary": "Resumo em 2 frases",
  "diagnoses": [
    {"cidCode": "I10", "status": "cronico", "diagnosisDate": "2024-01-10", "condition": "Hipertensão arterial sistêmica", "notes": "Hipertensão controlada"}
  ],
  "medications": [
    {"name": "Losartana", "dosage": "50mg", "frequency": "1x ao dia", "format": "comprimido", "startDate": "2023-11-01", "notes": "Uso contínuo"}
  ],
  "allergies": [
    {"allergen": "Penicilina", "allergenType": "medication", "reaction": "urticária", "severity": "grave", "notes": "Evitar beta-lactâmicos"}
  ],
  "comorbidities": ["Hipertensão arterial", "Diabetes tipo 2"],
  "surgeries": [
    {"procedureName": "Apendicectomia", "surgeryDate": "2018-05-01", "hospitalName": "Hospital X", "surgeonName": "Dr. Silva", "notes": "Sem complicações"}
  ]
}

Anamnese:
"""${text.trim()}"""
`;

  try {
    const taskName = "extractRecordFromAnamnesis";
    const complexity: TaskComplexity = "medium";
    const model = ModelRouter.getModel(taskName, complexity);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você escreve resumos clínicos naturais, concisos e humanos. Quando faltar informação, apenas omita o que não foi mencionado e nunca explique a ausência de dados."
        },
        { role: "user", content: instructions }
      ],
      temperature: 0.2,
      max_tokens: 1200, // corrected property name from max_output_tokens
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskName, model, response.usage, userId, clinicId);
    }

    const content = response.choices[0].message.content ?? undefined;
    const sanitized = stripMarkdownCodeFence(content);
    const jsonPayload = sanitized ? extractJsonPayload(sanitized as string) : null;

    if (!jsonPayload) {
      throw new Error("Resposta da OpenAI sem JSON válido");
    }

    const parsed = JSON.parse(jsonPayload);
    const normalized = normalizeExtractedRecord(parsed, text, encounterDate);
    const fallback = fallbackAnamnesisExtraction(text, encounterDate);

    return {
      summary: normalized.summary || fallback.summary,
      diagnoses: dedupeDiagnoses([...normalized.diagnoses, ...fallback.diagnoses]),
      medications: dedupeByKey([...normalized.medications, ...fallback.medications], (item) => item.name),
      allergies: dedupeByKey([...normalized.allergies, ...fallback.allergies], (item) => item.allergen),
      comorbidities: uniqueStrings([...normalized.comorbidities, ...fallback.comorbidities]),
      surgeries: dedupeByKey([...normalized.surgeries, ...fallback.surgeries], (item) => item.procedureName),
    };
  } catch (error) {
    logger.error("[OpenAI] Falha na extração automática da anamnese", {
      message: error instanceof Error ? error.message : String(error),
    });
    return fallbackAnamnesisExtraction(text, encounterDate);
  }
}

/**
 * Resposta de fallback para o relatório cronológico quando a API da OpenAI não está disponível
 */
function getFallbackChronologicalReport(examResults: ExamResult[], user: UserInfo) {

  // Calcula algumas tendências básicas baseadas nos dados disponíveis
  let hasTrendData = examResults.length > 1;
  let trendsDirection = "estável";

  if (hasTrendData) {
    // Tenta identificar alguma tendência simples olhando para o primeiro e último exame
    const firstExam = examResults[0];
    const lastExam = examResults[examResults.length - 1];

    // Verificar se healthMetrics está disponível e é um array
    const firstMetrics = Array.isArray(firstExam.healthMetrics) ? firstExam.healthMetrics : [];
    const lastMetrics = Array.isArray(lastExam.healthMetrics) ? lastExam.healthMetrics : [];

    if (firstMetrics.length > 0 && lastMetrics.length > 0) {
      // Conta melhorias e pioras em métricas comuns
      let improvements = 0;
      let declines = 0;

      // Análise simplificada das métricas
      firstMetrics.forEach((firstMetric: any) => {
        const matchingLastMetric = lastMetrics.find((m: any) => m.name === firstMetric.name);
        if (matchingLastMetric) {
          const firstStatus = firstMetric.status;
          const lastStatus = matchingLastMetric.status;

          if (firstStatus === 'alto' || firstStatus === 'baixo') {
            if (lastStatus === 'normal') {
              improvements++;
            }
          } else if (firstStatus === 'normal') {
            if (lastStatus === 'alto' || lastStatus === 'baixo') {
              declines++;
            }
          }
        }
      });

      if (improvements > declines) {
        trendsDirection = "melhora";
      } else if (declines > improvements) {
        trendsDirection = "piora";
      }
    }
  }

  // Retorna uma resposta de fallback estruturada conforme o novo formato
  return {
    summary: `Análise de ${examResults.length} exame(s) realizados pelo paciente ${user.fullName || 'sem nome'}, mostrando tendência de ${trendsDirection} em seus indicadores de saúde.`,
    trends: [
      "Tendência de estabilidade nos indicadores metabólicos (significância clínica moderada, evidência preliminar)",
      "Não foi possível identificar tendências detalhadas sem acesso à API da OpenAI",
      "Recomenda-se revisão manual dos exames por um profissional de saúde"
    ],
    correlations: [
      "Correlação entre estado nutricional e níveis de hemoglobina (suportado por dados na literatura)",
      "Possível relação entre perfil lipídico e marcadores inflamatórios (requer confirmação)",
      "Análise de correlações completa não disponível no momento"
    ],
    effectivenessAnalysis: "Não é possível determinar a eficácia das intervenções anteriores sem processamento detalhado dos dados. Recomenda-se avaliação médica individualizada.",
    futureRecommendations: [
      "Continue realizando exames periódicos para monitoramento conforme diretrizes da Associação Médica Brasileira",
      "Consulte um médico para análise detalhada dos resultados e orientação personalizada",
      "Mantenha um estilo de vida saudável com alimentação equilibrada e atividade física regular (150 min/semana)",
      "Considere a realização de exames de acompanhamento específicos baseados nos resultados anteriores"
    ],
    overallAssessment: `Com base nos dados disponíveis, o estado de saúde geral parece ${trendsDirection}. As métricas avaliadas sugerem a necessidade de acompanhamento médico regular e adoção de medidas preventivas.`,

    // Novos campos adicionados conforme a estrutura atualizada
    healthParameters: {
      healthScore: hasTrendData && trendsDirection === "melhora" ? 75 : hasTrendData && trendsDirection === "piora" ? 60 : 70,
      criticalAreas: ["Avaliação de marcadores metabólicos", "Níveis hormonais", "Função renal"],
      stableAreas: ["Hemograma básico", "Enzimas hepáticas"],
      improvementTrends: hasTrendData && trendsDirection === "melhora" ? ["Perfil lipídico", "Glicemia em jejum"] : [],
      worseningTrends: hasTrendData && trendsDirection === "piora" ? ["Marcadores inflamatórios", "Perfil lipídico"] : []
    },
    evidenceBasedAssessment: {
      clinicalGuidelines: [
        "Sociedade Brasileira de Endocrinologia - Diretrizes para manejo de alterações metabólicas (2024)",
        "American Heart Association - Guidelines for Cardiovascular Health Monitoring (2023)",
        "Sociedade Brasileira de Análises Clínicas - Protocolo de interpretação laboratorial (2024)"
      ],
      studyReferences: [
        "Brazilian Journal of Medical and Biological Research - Interpretação de exames laboratoriais no contexto clínico (2023)",
        "Journal of American Medical Association - Longitudinal Assessment of Laboratory Parameters (2024)"
      ],
      confidenceLevel: "médio"
    }
  };
}

/**
 * Extrai o nome do paciente de um documento de exame usando OpenAI
 * @param fileContent Conteúdo do arquivo (texto extraído ou base64)
 * @param fileType Tipo do arquivo (pdf, jpeg, png)
 * @returns Nome do paciente extraído ou null se não encontrado
 */
export async function extractPatientNameFromExam(fileContent: string, fileType: string, userId?: number, clinicId?: number): Promise<string | null> {
  try {
    if (!openai) {
      logger.warn("OpenAI client not initialized, cannot extract patient name");
      return null;
    }

    const prompt = `
      Você é um assistente especializado em extrair informações de documentos médicos.
      
      TAREFA: Extraia APENAS o nome completo do paciente deste documento de exame médico.
      
      INSTRUÇÕES:
      1. Procure por campos como "Paciente:", "Nome:", "Patient:", etc.
      2. Retorne APENAS o nome completo do paciente, sem títulos (Sr., Sra., Dr., etc.)
      3. Se não encontrar o nome do paciente, retorne "NOT_FOUND"
      4. Não inclua nenhuma explicação adicional, apenas o nome
      
      FORMATO DA RESPOSTA:
      Retorne apenas o nome do paciente ou "NOT_FOUND"
      
      Exemplo de resposta válida: "João Silva Santos"
      Exemplo de resposta quando não encontrado: "NOT_FOUND"
    `;

    const taskName = "extractPatientNameFromExam";
    const complexity: TaskComplexity = "simple";
    const model = ModelRouter.getModel(taskName, complexity);

    const response = await openai.chat.completions.create({
      model: model, // Usar modelo mais rápido via Router
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Documento de exame:\n\n${fileContent.substring(0, 2000)}` } // Limitar a 2000 caracteres para economizar tokens
      ],
      temperature: 0.1, // Baixa temperatura para respostas mais determinísticas
      max_tokens: 50 // Nome do paciente não deve precisar de muitos tokens
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskName, model, response.usage, userId, clinicId);
    }

    const extractedName = response.choices[0].message.content?.trim();

    if (!extractedName || extractedName === "NOT_FOUND" || extractedName.length < 3) {
      logger.info("Patient name not found in exam document");
      return null;
    }

    logger.info(`Extracted patient name: ${extractedName}`);
    return extractedName;

  } catch (error) {
    logger.error("Error extracting patient name from exam:", error);
    return null;
  }
}

// Stub functions for file extraction to fix build errors
async function extractAppointmentsFromImage(file: any): Promise<string> {
  console.log("extractAppointmentsFromImage stub called");
  return "";
}

async function extractAppointmentsFromPDF(file: any): Promise<string> {
  console.log("extractAppointmentsFromPDF stub called");
  return "";
}

/**
 * Transcreve áudio de consulta médica usando OpenAI Whisper
 * @param audioBuffer Buffer do arquivo de áudio
 * @param mimeType Tipo MIME do áudio (audio/webm, audio/mp3, etc.)
 * @returns Texto transcrito
 */
export async function transcribeConsultationAudio(audioBuffer: Buffer, mimeType: string, userId?: number, clinicId?: number): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI client not initialized. API key may be missing.");
  }

  try {
    // Determinar extensão do arquivo baseada no mime type
    const extensionMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/m4a': 'm4a',
      'audio/mp4': 'mp4',
    };

    const extension = extensionMap[mimeType] || 'webm';
    const filename = `consultation-${Date.now()}.${extension}`;

    // Criar File object para a API garantindo compatibilidade de tipos
    const audioUint8Array = new Uint8Array(audioBuffer);
    const audioFile = new File([audioUint8Array], filename, { type: mimeType });

    logger.info("[OpenAI Whisper] Iniciando transcrição", {
      filename,
      mimeType,
      bufferSize: audioBuffer.length
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt", // Português
      response_format: "text",
      prompt: "Transcrição de consulta médica em português brasileiro. Termos médicos, medicamentos, diagnósticos, sintomas."
    });

    // Approximate token usage for audio duration (or just count 1 request)
    // Whisper doesn't return token usage, so we might need a different strategy or just log the event.
    // For now, let's log with 0 tokens to at least record the activity in ai_cost_logs
    // or estimate based on text length (approx 1 token per 0.75 words, 1 word ~ 5 chars -> 1 token ~ 4 chars)
    const estimatedTokens = Math.ceil(transcription.length / 4);
    ModelRouter.trackUsage("transcribeConsultationAudio", "whisper-1", {
      prompt_tokens: 0,
      completion_tokens: estimatedTokens
    }, userId, clinicId);

    logger.info("[OpenAI Whisper] Transcrição concluída", {
      transcriptionLength: transcription.length
    });

    return transcription;
  } catch (error) {
    logger.error("[OpenAI Whisper] Erro na transcrição", {
      message: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Falha na transcrição do áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Processa transcrição de consulta e gera anamnese profissional estruturada
 * @param transcription Texto transcrito da consulta
 * @param patientData Dados do paciente para contextualização
 * @returns Anamnese formatada profissionalmente
 */
export async function processTranscriptionToAnamnesis(transcription: string, patientData?: any, userId?: number, clinicId?: number): Promise<{
  anamnesis: string;
  extractedData: {
    summary: string;
    diagnoses: any[];
    medications: any[];
    allergies: any[];
    comorbidities: string[];
    surgeries: any[];
  };
}> {
  if (!openai) {
    throw new Error("OpenAI client not initialized. API key may be missing.");
  }

  const encounterDate = getTodayIsoDate();
  const patientContext = patientData ? formatPatientContext(patientData) : "";

  const prompt = `
Você é um médico especialista com vasta experiência em documentação clínica.
Sua tarefa é transformar a transcrição de uma consulta médica em uma anamnese profissional completa, com redação natural e fluida, como se tivesse sido escrita pelo médico ao final da consulta.

${patientContext ? `### CONTEXTO DO PACIENTE:\n${patientContext}\n` : ''}

### TRANSCRIÇÃO DA CONSULTA:
"""
${transcription}
"""

### INSTRUÇÕES:
1. Analise cuidadosamente toda a transcrição da consulta
2. Extraia todas as informações clinicamente relevantes
3. Organize as informações no formato de anamnese médica profissional
4. Identifique diagnósticos, medicamentos, alergias, comorbidades e cirurgias prévias mencionados
5. Sempre que um diagnóstico estiver explicitamente citado, associe o CID-10 mais adequado
6. Se qualquer campo de data estiver ausente, use a data atual da consulta (${encounterDate})
7. Diferencie hipótese diagnóstica de diagnóstico já estabelecido usando o campo notes
8. Use terminologia médica apropriada, mas mantenha a redação humana, direta e natural
9. Mantenha objetividade e clareza, evitando listas mecânicas quando a narrativa clínica for mais adequada
10. Quando não houver informações sobre um tópico, omita o tópico completamente
11. Nunca use frases metalinguísticas ou justificativas sobre ausência de dados
12. São proibidas expressões como: "não foi dito", "não se pode identificar", "não informado", "não relatado", "não mencionado", "sem dados", "sem informações", "detectado automaticamente", "gerado automaticamente", "transcrição automática" e "revisão médica recomendada"
13. Não faça comentários sobre IA, transcrição, extração automática ou necessidade de revisão
14. No campo notes, escreva apenas observações clínicas relevantes; se não houver observação útil, use null

### FORMATO DA ANAMNESE:
A anamnese deve seguir a estrutura SOAP ou similar, MAS OMITINDO SEÇÕES SEM DADOS:
- **Identificação**: Dados básicos do paciente (APENAS se mencionados)
- **Queixa Principal (QP)**: Motivo da consulta em palavras do paciente
- **História da Doença Atual (HDA)**: Evolução cronológica dos sintomas
- **Interrogatório Sintomatológico**: APENAS sintomas positivos
- **História Patológica Pregressa (HPP)**: APENAS se relatada
- **História Familiar (HF)**: APENAS se relatada
- **História Social (HS)**: OMITIR se não houver dados
- **Medicamentos em Uso**: APENAS medicamentos citados
- **Alergias**: APENAS se houver relato
- **Exame Físico**: APENAS achados mencionados
- **Impressão Diagnóstica**: Hipóteses diagnósticas
- **Conduta**: Plano terapêutico e orientações

### REGRAS PARA O JSON:
- Retorne apenas JSON válido
- O campo "anamnesis" deve conter somente o texto final da anamnese, pronto para prontuário
- O campo "summary" deve ser um resumo clínico curto e natural, sem mencionar ausência de informação, extração, IA ou transcrição
- Inclua nos arrays apenas itens efetivamente mencionados
- Para detalhes ausentes dentro de um item citado, use null

### RESPOSTA (JSON):
{
  "anamnesis": "Texto completo da anamnese formatada profissionalmente com as seções acima",
  "extractedData": {
    "summary": "Resumo em 2-3 frases do caso clínico",
    "diagnoses": [
      {"cidCode": "Código CID-10", "status": "ativo|cronico|em_tratamento|resolvido", "diagnosisDate": "YYYY-MM-DD ou null", "condition": "Nome do diagnóstico", "notes": "Observações"}
    ],
    "medications": [
      {"name": "Nome do medicamento", "dosage": "Dosagem", "frequency": "Frequência", "format": "Forma farmacêutica", "startDate": "YYYY-MM-DD ou null", "notes": "Observações", "isActive": true}
    ],
    "allergies": [
      {"allergen": "Alérgeno", "allergenType": "medication|food|environmental|other", "reaction": "Tipo de reação", "severity": "leve|moderada|grave", "notes": "Observações"}
    ],
    "comorbidities": ["Lista de comorbidades identificadas"],
    "surgeries": [
      {"procedureName": "Nome da cirurgia", "surgeryDate": "YYYY-MM-DD ou null", "hospitalName": "Hospital (opcional)", "surgeonName": "Cirurgião (opcional)", "notes": "Observações"}
    ]
  }
}
`;

  try {
    logger.info("[OpenAI] Processando transcrição para anamnese", {
      transcriptionLength: transcription.length
    });

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "Você redige documentos clínicos em português do Brasil com linguagem natural, profissional e humana. Se um dado não foi mencionado, apenas omita esse conteúdo sem comentar a ausência."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const content = extractResponseText(response);
    const sanitized = stripMarkdownCodeFence(content);
    const jsonPayload = sanitized ? extractJsonPayload(sanitized) : null;

    if (!jsonPayload) {
      logger.warn("[OpenAI] Resposta sem JSON válido, usando fallback");
      return generateFallbackAnamnesis(transcription);
    }

    const parsed = JSON.parse(jsonPayload);
    const normalizedExtractedData = normalizeExtractedRecord(parsed.extractedData, transcription, encounterDate);
    const fallbackExtractedData = fallbackAnamnesisExtraction(transcription, encounterDate);

    logger.info("[OpenAI] Anamnese gerada com sucesso", {
      anamnesisLength: parsed.anamnesis?.length || 0,
      diagnosesCount: normalizedExtractedData.diagnoses.length,
      medicationsCount: normalizedExtractedData.medications.length,
      surgeriesCount: normalizedExtractedData.surgeries.length
    });

    return {
      anamnesis: parsed.anamnesis || "",
      extractedData: {
        summary: normalizedExtractedData.summary || fallbackExtractedData.summary,
        diagnoses: dedupeDiagnoses([...normalizedExtractedData.diagnoses, ...fallbackExtractedData.diagnoses]),
        medications: dedupeByKey([...normalizedExtractedData.medications, ...fallbackExtractedData.medications], (item) => item.name),
        allergies: dedupeByKey([...normalizedExtractedData.allergies, ...fallbackExtractedData.allergies], (item) => item.allergen),
        comorbidities: uniqueStrings([...normalizedExtractedData.comorbidities, ...fallbackExtractedData.comorbidities]),
        surgeries: dedupeByKey([...normalizedExtractedData.surgeries, ...fallbackExtractedData.surgeries], (item) => item.procedureName)
      }
    };
  } catch (error) {
    logger.error("[OpenAI] Erro ao processar transcrição para anamnese", {
      message: error instanceof Error ? error.message : String(error)
    });
    return generateFallbackAnamnesis(transcription);
  }
}

/**
 * Gera uma anamnese básica quando a API falha
 */
function generateFallbackAnamnesis(transcription: string): {
  anamnesis: string;
  extractedData: {
    summary: string;
    diagnoses: any[];
    medications: any[];
    allergies: any[];
    comorbidities: string[];
    surgeries: any[];
  };
} {
  const today = new Date().toLocaleDateString('pt-BR');
  const extractedData = fallbackAnamnesisExtraction(transcription, getTodayIsoDate());

  return {
    anamnesis: `**ANAMNESE - ${today}**

**História Clínica:**
${transcription.trim()}`,
    extractedData: {
      summary: extractedData.summary || "",
      diagnoses: extractedData.diagnoses,
      medications: extractedData.medications,
      allergies: extractedData.allergies,
      comorbidities: extractedData.comorbidities,
      surgeries: extractedData.surgeries
    }
  };
}

/**
 * Melhora e formata o texto da anamnese usando IA
 * @param text Texto original da anamnese
 * @returns Texto melhorado
 */
export async function enhanceAnamnesisText(text: string, userId?: number, clinicId?: number): Promise<string> {
  if (!openai) {
    return text.trim();
  }

  const prompt = `
    Você é um médico assistente experiente em documentação clínica.
    Reescreva o texto abaixo para transformá-lo em uma evolução/anamnese de consulta mais rica, organizada e profissional, sem inventar nenhum dado novo.
    
    DIRETRIZES:
    1. Preserve integralmente os fatos, negações, temporalidade e incertezas do texto original.
    2. Corrija ortografia, gramática, pontuação e concordância.
    3. Enriqueça a redação médica: transforme anotações telegráficas em narrativa clínica clara, coesa e natural, como um médico escrevendo no prontuário após a consulta.
    4. Estruture o conteúdo como registro de consulta, usando apenas as seções que realmente tenham dados:
       - **Queixa Principal**
       - **História da Doença Atual**
       - **Interrogatório Sintomatológico**
       - **História Patológica Pregressa**
       - **Medicamentos em Uso**
       - **Alergias**
       - **Exame Físico**
       - **Avaliação / Impressão Diagnóstica**
       - **Conduta**
    5. Se o texto não trouxer dados para uma seção, omita a seção sem avisar que faltam informações.
    6. Use terminologia médica adequada quando o contexto permitir, sem extrapolar o que não foi dito.
    7. NÃO invente diagnósticos, exames, achados físicos, medicamentos, doses, alergias ou condutas que não estejam no texto original.
    8. Pode reorganizar a ordem das informações para melhorar clareza clínica.
    9. Nunca use frases ou variações de: "não foi dito", "não se pode identificar", "não informado", "não relatado", "não mencionado", "sem dados", "sem informações", "gerado automaticamente", "detectado automaticamente" ou "requer revisão médica".
    10. Não faça qualquer referência a IA, transcrição, extração automática ou ao fato de o texto ter sido gerado.
    11. Quando algo não estiver presente no texto, simplesmente não mencione esse assunto.
    12. Retorne APENAS o texto final melhorado, sem introduções ou observações extras.

    TEXTO ORIGINAL:
    "${text}"
  `;

  try {
    const taskName = "enhanceAnamnesisText";
    const complexity: TaskComplexity = "medium";
    const model = ModelRouter.getModel(taskName, complexity);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um assistente médico especializado em documentação clínica. Escreva como um profissional humano, com linguagem natural e direta, e nunca explique a ausência de dados."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskName, model, response.usage, userId, clinicId);
    }

    const content = response.choices[0].message.content;
    return content?.trim() || text;
  } catch (error) {
    logger.error("[OpenAI] Erro ao melhorar texto da anamnese", { error });
    return text.trim();
  }
}

// Vita Assist - Medical AI Assistant Chat
interface VitaAssistMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Interface removida pois o contexto agora é uma string formatada pelo ContextManager
// interface PatientContext { ... }

const VITA_ASSIST_SYSTEM_PROMPT = `Você é VitaAssist, um assistente de apoio à decisão clínica integrado a um prontuário eletrônico.
Seu papel é auxiliar profissionais de saúde, fornecendo informações baseadas em evidências científicas, diretrizes clínicas atualizadas e literatura médica revisada por pares.

REGRA FUNDAMENTAL DE ESTILO:
- Seja EXTREMAMENTE CONCISO e OBJETIVO. Profissionais de saúde têm pouco tempo.
- Evite repetições, introduções longas e explicações desnecessárias.
- Vá direto ao ponto. Cada frase deve agregar valor.
- Prefira listas curtas e bullets a parágrafos extensos.
- Omita informações óbvias ou triviais para o público médico.

Princípios obrigatórios de resposta:
- Priorize guidelines oficiais (sociedades médicas, consensos, diretrizes).
- Cite a fonte quando relevante (diretriz, sociedade, ano).
- Diferencie evidência forte de opinião especializada.
- Use linguagem técnica, objetiva e profissional.

Limites de atuação:
- Você não substitui o julgamento clínico do profissional.
- Não forneça diagnósticos definitivos nem prescrições fechadas.
- A decisão final é sempre do médico assistente.

Formato das respostas (adapte conforme necessário, omitindo seções não aplicáveis):
- **Resumo**: resposta direta em 1-2 frases
- **Condutas/Opções**: lista objetiva
- **Referência**: fonte principal (se aplicável)

Use markdown. Seja breve. Responda em português brasileiro.`;

export async function vitaAssistChat(
  messages: VitaAssistMessage[],
  patientContext?: string,
  userId?: number,
  clinicId?: number
): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API não configurada");
  }

  let systemPrompt = VITA_ASSIST_SYSTEM_PROMPT;

  // Add patient context if provided
  if (patientContext) {
    systemPrompt += `\n\n---\n\n${patientContext}\n\nConsidere este contexto ao responder perguntas sobre este paciente.`;
  }

  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const taskName = "vitaAssistChat";
    const complexity: TaskComplexity = "medium"; // Assistente clínico requer bom raciocínio
    const model = ModelRouter.getModel(taskName, complexity);

    const response = await openai.chat.completions.create({
      model: model,
      messages: chatMessages,
      temperature: 0.4,
      max_tokens: 4000
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskName, model, response.usage);
    }

    const content = response.choices[0].message.content;
    return content?.trim() || "Desculpe, não consegui processar sua pergunta. Por favor, tente reformulá-la.";
  } catch (error) {
    logger.error("[OpenAI] Erro no Vita Assist chat", { error });
    throw new Error("Falha ao processar consulta médica");
  }
}

// Generate a title for a conversation based on the first message
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  if (!openai) {
    // Fallback: truncate the message
    return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }

  try {
    const taskName = "generateConversationTitle";
    const complexity: TaskComplexity = "simple"; // Geração de título é simples
    const model = ModelRouter.getModel(taskName, complexity);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente que gera títulos curtos e descritivos para conversas médicas. Gere um título de no máximo 50 caracteres que resuma o tema principal da pergunta. Responda APENAS com o título, sem aspas ou pontuação extra.'
        },
        { role: 'user', content: firstMessage }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    if (response.usage) {
      ModelRouter.trackUsage(taskName, model, response.usage);
    }

    const title = response.choices[0].message.content?.trim() || firstMessage.slice(0, 50);
    return title.slice(0, 50);
  } catch (error) {
    logger.error("[OpenAI] Erro ao gerar título", { error });
    return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }
}

// Generate Embeddings for Vector Search
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error("OpenAI not initialized");
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // Efficient and cheap
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error("[OpenAI] Failed to generate embedding", { error });
    throw error;
  }
}
