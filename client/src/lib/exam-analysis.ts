type NullableText = string | null | undefined;

export type StructuredExamFinding = {
  title?: NullableText;
  category?: NullableText;
  bodySite?: NullableText;
  value?: NullableText;
  unit?: NullableText;
  qualitativeResult?: NullableText;
  status?: NullableText;
  referenceRange?: NullableText;
  interpretation?: NullableText;
  significance?: NullableText;
  notes?: NullableText;
};

export type StructuredExamImpression = {
  description?: NullableText;
  severity?: NullableText;
  chronicity?: NullableText;
  laterality?: NullableText;
  status?: NullableText;
  notes?: NullableText;
};

export type StructuredExamDiagnosis = {
  condition?: NullableText;
  cidCode?: NullableText;
  confidence?: NullableText;
  basis?: NullableText;
  status?: NullableText;
  notes?: NullableText;
};

export type StructuredExamMetadata = {
  documentTitle?: NullableText;
  examType?: NullableText;
  examCategory?: NullableText;
  examPurpose?: NullableText;
  examModality?: NullableText;
  bodyRegion?: NullableText;
  technique?: NullableText;
  contrastUsed?: NullableText;
  specimenType?: NullableText;
  requestingPhysician?: NullableText;
  performingPhysician?: NullableText;
  laboratoryName?: NullableText;
  institutionName?: NullableText;
  patientName?: NullableText;
  collectionDate?: NullableText;
  reportDate?: NullableText;
  examDate?: NullableText;
};

export type StructuredExamAnalysis = {
  summary?: NullableText;
  detailedAnalysis?: NullableText;
  recommendations?: string[];
  healthMetrics?: any[];
  clinicalFindings?: StructuredExamFinding[];
  diagnosticImpression?: StructuredExamImpression[];
  suggestedDiagnoses?: StructuredExamDiagnosis[];
  examMetadata?: StructuredExamMetadata;
  aiProvider?: NullableText;
};

const toText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const stripCodeFence = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned.startsWith("```")) return cleaned;

  const firstBreak = cleaned.indexOf("\n");
  const withoutStart = firstBreak >= 0 ? cleaned.slice(firstBreak + 1) : cleaned.replace(/^```[\w-]*/i, "");
  return withoutStart.replace(/```$/, "").trim();
};

export const extractJsonObject = (value: string) => {
  const firstBrace = value.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let previous = "";

  for (let index = firstBrace; index < value.length; index += 1) {
    const character = value[index];

    if (character === "\"" && previous !== "\\") {
      inString = !inString;
    }

    if (!inString) {
      if (character === "{") depth += 1;
      if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          return value.slice(firstBrace, index + 1);
        }
      }
    }

    previous = character;
  }

  return null;
};

export const parseStructuredExamAnalysis = (value: unknown): StructuredExamAnalysis | null => {
  if (!value) return null;
  if (typeof value === "object") return value as StructuredExamAnalysis;

  const raw = stripCodeFence(toText(value));
  if (!raw) return null;

  const jsonValue = extractJsonObject(raw);
  if (!jsonValue) return null;

  try {
    return JSON.parse(jsonValue) as StructuredExamAnalysis;
  } catch {
    return null;
  }
};

export const splitRecommendations = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }

  const text = toText(value);
  if (!text) return [];

  return text
    .split(/\n|[•*-]\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const formatStructuredDate = (value?: NullableText) => {
  const text = toText(value);
  if (!text) return null;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;

  return parsed.toLocaleDateString("pt-BR");
};

export const buildFindingDescription = (finding: StructuredExamFinding) => {
  const title = toText(finding.title);
  if (!title) return "";

  const parts = [title];
  const bodySite = toText(finding.bodySite);
  const value = toText(finding.value);
  const unit = toText(finding.unit);
  const qualitativeResult = toText(finding.qualitativeResult);
  const interpretation = toText(finding.interpretation);
  const significance = toText(finding.significance);

  if (bodySite) parts.push(`em ${bodySite}`);
  if (value) parts.push(`(${value}${unit ? ` ${unit}` : ""})`);
  else if (qualitativeResult) parts.push(`(${qualitativeResult})`);
  if (interpretation) parts.push(`- ${interpretation}`);
  if (significance) parts.push(`- ${significance}`);

  return parts.join(" ");
};

export const buildImpressionDescription = (item: StructuredExamImpression) => {
  const description = toText(item.description);
  if (!description) return "";

  const extras = [item.severity, item.chronicity, item.laterality, item.status]
    .map((value) => toText(value))
    .filter(Boolean);

  return extras.length > 0 ? `${description} (${extras.join(" | ")})` : description;
};

export const buildDiagnosisDescription = (diagnosis: StructuredExamDiagnosis) => {
  const condition = toText(diagnosis.condition) || "Condição sugerida";
  const extras = [
    diagnosis.cidCode ? `CID ${toText(diagnosis.cidCode)}` : "",
    diagnosis.confidence ? `confiança ${toText(diagnosis.confidence)}` : "",
    diagnosis.basis ? toText(diagnosis.basis) : ""
  ].filter(Boolean);

  return extras.length > 0 ? `${condition} (${extras.join(" | ")})` : condition;
};
