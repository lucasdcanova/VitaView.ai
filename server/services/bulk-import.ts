import OpenAI from "openai";
import type { InsertProfile } from "@shared/schema";
import logger from "../logger";
import * as pdfParse from "pdf-parse";

// Initialize OpenAI
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

const OPENAI_MODEL = process.env.OPENAI_GPT5_MODEL || "gpt-4o";

export interface ExtractedPatient {
    name: string;
    cpf?: string | null;
    rg?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    phone?: string | null;
    landline?: string | null;
    email?: string | null;
    bloodType?: string | null;
    insuranceName?: string | null;
    insuranceCardNumber?: string | null;
    insuranceValidity?: string | null;

    // Address
    cep?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;

    // Complementary
    guardianName?: string | null;
    emergencyPhone?: string | null;
    profession?: string | null;
    maritalStatus?: string | null;
    referralSource?: string | null;
    notes?: string | null;

    // Metadata
    confidence: number; // 0-1, confidence of extraction
    source: string; // filename or source identifier
}

export interface BulkImportResult {
    patients: ExtractedPatient[];
    totalExtracted: number;
    errors: Array<{ file: string; error: string }>;
}

/**
 * Extract patient data from images using GPT-4 Vision
 */
export async function extractPatientsFromImages(
    files: Array<{ buffer: Buffer; filename: string; mimetype: string }>
): Promise<BulkImportResult> {
    const patients: ExtractedPatient[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    if (!openai) {
        logger.warn(`OpenAI client not initialized (NODE_ENV: ${process.env.NODE_ENV}) - using fallback for non-production`);

        // Em ambiente de desenvolvimento ou se não estiver explicitamente em produção, fornecer retorno de exemplo
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'undefined') {
            return {
                patients: [
                    {
                        name: "Ricardo Schroeder Canova",
                        gender: "masculino",
                        birthDate: "2000-01-01",
                        phone: "(11) 98765-4321",
                        source: "mock-extraction",
                        confidence: 0.99
                    },
                    {
                        name: "Sahra Suzana Schroeder Canova",
                        gender: "feminino",
                        birthDate: "1960-01-01",
                        phone: "(11) 91234-5678",
                        source: "mock-extraction",
                        confidence: 0.99
                    }
                ],
                totalExtracted: 2,
                errors: [{ file: "AI (Aviso)", error: "OpenAI API key não configurada no arquivo .env. Usando dados de demonstração para teste." }]
            };
        }

        throw new Error("OpenAI API key not configured");
    }

    for (const file of files) {
        try {
            logger.info(`Processing image: ${file.filename}`);

            // Convert buffer to base64
            const base64Image = file.buffer.toString('base64');
            const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

            const prompt = `
        Você é um assistente médico especializado em extrair dados de pacientes de imagens.
        Analise esta imagem e extraia TODOS os dados de pacientes que você conseguir identificar.
        
        A imagem pode conter:
        - Lista de pacientes de um sistema médico
        - Tabela com informações de pacientes
        - Formulários de cadastro
        - Prontuários
        - Planilhas impressas
        
        Para CADA paciente identificado, extraia o máximo de informações possível:
        - Nome completo (obrigatório)
        - CPF (se disponível)
        - RG (se disponível)
        - Data de nascimento (formato YYYY-MM-DD se possível)
        - Gênero (masculino/feminino/outro)
        - Telefone (celular)
        - Telefone fixo
        - Email
        - Tipo sanguíneo
        - Convênio/Plano de saúde
        - Número da carteirinha
        - Validade do convênio
        - Endereço completo (CEP, rua, número, complemento, bairro, cidade, estado)
        - Nome do responsável (se menor de idade)
        - Telefone de emergência
        - Profissão
        - Estado civil
        - Como conheceu a clínica
        - Observações médicas relevantes
        
        IMPORTANTE:
        - Se um campo não estiver visível ou legível, use null
        - Normalize CPF para formato: XXX.XXX.XXX-XX
        - Normalize telefones para formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        - Datas no formato YYYY-MM-DD
        - CEP no formato: XXXXX-XXX
        
        Retorne APENAS um JSON válido no seguinte formato:
        {
          "patients": [
            {
              "name": "Nome Completo",
              "cpf": "123.456.789-00",
              "rg": "12.345.678-9",
              "birthDate": "1990-01-15",
              "gender": "masculino",
              "phone": "(11) 98765-4321",
              "landline": "(11) 3456-7890",
              "email": "email@example.com",
              "bloodType": "O+",
              "insuranceName": "Unimed",
              "insuranceCardNumber": "123456789",
              "insuranceValidity": "2025-12-31",
              "cep": "01234-567",
              "street": "Rua Exemplo",
              "number": "123",
              "complement": "Apto 45",
              "neighborhood": "Centro",
              "city": "São Paulo",
              "state": "SP",
              "guardianName": null,
              "emergencyPhone": "(11) 91234-5678",
              "profession": "Engenheiro",
              "maritalStatus": "casado",
              "referralSource": "Indicação",
              "notes": "Observações relevantes",
              "confidence": 0.95
            }
          ]
        }
        
        Se não conseguir identificar nenhum paciente, retorne: {"patients": []}
      `;

            const response = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: dataUrl } }
                        ]
                    }
                ],
                max_tokens: 4000,
                temperature: 0.1
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error("Empty response from OpenAI");
            }

            // Parse JSON response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }

            const result = JSON.parse(jsonMatch[0]);

            if (result.patients && Array.isArray(result.patients)) {
                result.patients.forEach((patient: any) => {
                    patients.push({
                        ...patient,
                        source: file.filename,
                        confidence: patient.confidence || 0.8
                    });
                });
                logger.info(`Extracted ${result.patients.length} patients from ${file.filename}`);
            }

        } catch (error) {
            logger.error(`Error processing image ${file.filename}:`, error);
            errors.push({
                file: file.filename,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    return {
        patients,
        totalExtracted: patients.length,
        errors
    };
}

/**
 * Extract patient data from PDF files
 */
export async function extractPatientsFromPDF(
    files: Array<{ buffer: Buffer; filename: string }>
): Promise<BulkImportResult> {
    const patients: ExtractedPatient[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    if (!openai) {
        logger.warn(`OpenAI client not initialized (NODE_ENV: ${process.env.NODE_ENV}) - using fallback for non-production`);

        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'undefined') {
            return {
                patients: [
                    {
                        name: "Paciente de Teste PDF",
                        gender: "masculino",
                        birthDate: "1985-05-20",
                        source: "mock-pdf-extraction",
                        confidence: 0.9
                    }
                ],
                totalExtracted: 1,
                errors: [{ file: "PDFs (Aviso)", error: "OpenAI API key não configurada no arquivo .env. Usando dados de demonstração para teste." }]
            };
        }

        throw new Error("OpenAI API key not configured");
    }

    for (const file of files) {
        try {
            logger.info(`Processing PDF: ${file.filename}`);

            // Extract text from PDF - pdf-parse is a CommonJS module
            const pdfParseDefault = (pdfParse as any).default || pdfParse;
            const pdfData = await pdfParseDefault(file.buffer);
            const pdfText = pdfData.text;

            if (!pdfText || pdfText.trim().length === 0) {
                throw new Error("No text content found in PDF");
            }

            const prompt = `
        Você é um assistente médico especializado em extrair dados de pacientes de documentos.
        Analise este texto extraído de um PDF e identifique TODOS os pacientes mencionados.
        
        O PDF pode conter:
        - Lista de pacientes
        - Relatórios com múltiplos pacientes
        - Cadastros exportados de sistemas médicos
        - Prontuários
        
        TEXTO DO PDF:
        ${pdfText.substring(0, 15000)} // Limit to avoid token limits
        
        Para CADA paciente identificado, extraia o máximo de informações possível:
        - Nome completo (obrigatório)
        - CPF, RG, data de nascimento, gênero
        - Telefones, email
        - Tipo sanguíneo, convênio
        - Endereço completo
        - Outros dados relevantes
        
        Normalize os dados:
        - CPF: XXX.XXX.XXX-XX
        - Telefone: (XX) XXXXX-XXXX
        - Data: YYYY-MM-DD
        - CEP: XXXXX-XXX
        
        Retorne APENAS um JSON válido:
        {
          "patients": [
            {
              "name": "Nome Completo",
              "cpf": "123.456.789-00",
              "birthDate": "1990-01-15",
              "gender": "masculino",
              "phone": "(11) 98765-4321",
              "email": "email@example.com",
              "bloodType": "O+",
              "insuranceName": "Unimed",
              "street": "Rua Exemplo",
              "number": "123",
              "city": "São Paulo",
              "state": "SP",
              "notes": "Observações",
              "confidence": 0.9
            }
          ]
        }
      `;

            const response = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 4000,
                temperature: 0.1
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error("Empty response from OpenAI");
            }

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }

            const result = JSON.parse(jsonMatch[0]);

            if (result.patients && Array.isArray(result.patients)) {
                result.patients.forEach((patient: any) => {
                    patients.push({
                        ...patient,
                        source: file.filename,
                        confidence: patient.confidence || 0.85
                    });
                });
                logger.info(`Extracted ${result.patients.length} patients from ${file.filename}`);
            }

        } catch (error) {
            logger.error(`Error processing PDF ${file.filename}:`, error);
            errors.push({
                file: file.filename,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    return {
        patients,
        totalExtracted: patients.length,
        errors
    };
}

/**
 * Extract patient data from CSV files
 */
export async function extractPatientsFromCSV(
    files: Array<{ buffer: Buffer; filename: string }>
): Promise<BulkImportResult> {
    const patients: ExtractedPatient[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of files) {
        try {
            logger.info(`Processing CSV: ${file.filename}`);

            const csvText = file.buffer.toString('utf-8');
            const lines = csvText.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                throw new Error("CSV file is empty or has no data rows");
            }

            // Parse header
            const header = lines[0].split(/[,;|\t]/).map(h => h.trim().toLowerCase());

            // Map common column names to our fields
            const fieldMap: Record<string, string> = {
                'nome': 'name',
                'name': 'name',
                'paciente': 'name',
                'cpf': 'cpf',
                'rg': 'rg',
                'data nascimento': 'birthDate',
                'data_nascimento': 'birthDate',
                'nascimento': 'birthDate',
                'birth_date': 'birthDate',
                'sexo': 'gender',
                'genero': 'gender',
                'gênero': 'gender',
                'gender': 'gender',
                'telefone': 'phone',
                'celular': 'phone',
                'phone': 'phone',
                'tel': 'phone',
                'fixo': 'landline',
                'telefone_fixo': 'landline',
                'email': 'email',
                'e-mail': 'email',
                'tipo sanguineo': 'bloodType',
                'tipo_sanguineo': 'bloodType',
                'sangue': 'bloodType',
                'convenio': 'insuranceName',
                'convênio': 'insuranceName',
                'plano': 'insuranceName',
                'carteirinha': 'insuranceCardNumber',
                'cep': 'cep',
                'rua': 'street',
                'endereco': 'street',
                'endereço': 'street',
                'numero': 'number',
                'número': 'number',
                'complemento': 'complement',
                'bairro': 'neighborhood',
                'cidade': 'city',
                'estado': 'state',
                'uf': 'state',
                'responsavel': 'guardianName',
                'responsável': 'guardianName',
                'emergencia': 'emergencyPhone',
                'emergência': 'emergencyPhone',
                'profissao': 'profession',
                'profissão': 'profession',
                'estado_civil': 'maritalStatus',
                'observacoes': 'notes',
                'observações': 'notes',
                'obs': 'notes'
            };

            // Process data rows
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = lines[i].split(/[,;|\t]/).map(v => v.trim());

                    if (values.length !== header.length) {
                        logger.warn(`Row ${i + 1} has ${values.length} columns, expected ${header.length}`);
                        continue;
                    }

                    const patient: any = {
                        source: file.filename,
                        confidence: 1.0 // CSV data is usually accurate
                    };

                    // Map values to fields
                    header.forEach((col, idx) => {
                        const field = fieldMap[col];
                        if (field && values[idx]) {
                            patient[field] = values[idx] || null;
                        }
                    });

                    // Validate required field
                    if (!patient.name || patient.name.trim().length === 0) {
                        logger.warn(`Row ${i + 1}: Missing required field 'name'`);
                        continue;
                    }

                    // Normalize data
                    if (patient.gender) {
                        const g = patient.gender.toLowerCase();
                        if (g.startsWith('m') || g === 'masculino') patient.gender = 'masculino';
                        else if (g.startsWith('f') || g === 'feminino') patient.gender = 'feminino';
                    }

                    // Normalize date format
                    if (patient.birthDate) {
                        patient.birthDate = normalizeDateFormat(patient.birthDate);
                    }

                    patients.push(patient as ExtractedPatient);
                } catch (rowError) {
                    logger.error(`Error processing row ${i + 1}:`, rowError);
                }
            }

            logger.info(`Extracted ${patients.length} patients from ${file.filename}`);

        } catch (error) {
            logger.error(`Error processing CSV ${file.filename}:`, error);
            errors.push({
                file: file.filename,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    return {
        patients,
        totalExtracted: patients.length,
        errors
    };
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDateFormat(date: string): string | null {
    if (!date) return null;

    // Try common formats
    const formats = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
        const match = date.match(format);
        if (match) {
            if (format === formats[0]) {
                return date; // Already in correct format
            } else {
                // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
                return `${match[3]}-${match[2]}-${match[1]}`;
            }
        }
    }

    return null;
}

/**
 * Normalize and validate patient data
 */
export function normalizePatientData(patient: ExtractedPatient): ExtractedPatient {
    const normalized = { ...patient };

    // Normalize CPF
    if (normalized.cpf) {
        normalized.cpf = normalized.cpf.replace(/\D/g, '');
        if (normalized.cpf.length === 11) {
            normalized.cpf = normalized.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
    }

    // Normalize phone numbers
    if (normalized.phone) {
        normalized.phone = normalizePhone(normalized.phone);
    }
    if (normalized.landline) {
        normalized.landline = normalizePhone(normalized.landline);
    }
    if (normalized.emergencyPhone) {
        normalized.emergencyPhone = normalizePhone(normalized.emergencyPhone);
    }

    // Normalize CEP
    if (normalized.cep) {
        normalized.cep = normalized.cep.replace(/\D/g, '');
        if (normalized.cep.length === 8) {
            normalized.cep = normalized.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
    }

    // Normalize gender
    if (normalized.gender) {
        const g = normalized.gender.toLowerCase();
        if (g.includes('masc') || g === 'm') normalized.gender = 'masculino';
        else if (g.includes('fem') || g === 'f') normalized.gender = 'feminino';
    }

    return normalized;
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
        // (XX) XXXXX-XXXX
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length === 10) {
        // (XX) XXXX-XXXX
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone;
}

/**
 * Convert ExtractedPatient to InsertProfile format
 */
export function convertToInsertProfile(
    patient: ExtractedPatient,
    userId: number
): Partial<InsertProfile> {
    return {
        userId,
        name: patient.name,
        cpf: patient.cpf || null,
        rg: patient.rg || null,
        birthDate: patient.birthDate || null,
        gender: patient.gender || null,
        phone: patient.phone || null,
        landline: patient.landline || null,
        email: patient.email || null,
        bloodType: patient.bloodType || null,
        insuranceName: patient.insuranceName || null,
        insuranceCardNumber: patient.insuranceCardNumber || null,
        insuranceValidity: patient.insuranceValidity || null,
        cep: patient.cep || null,
        street: patient.street || null,
        number: patient.number || null,
        complement: patient.complement || null,
        neighborhood: patient.neighborhood || null,
        city: patient.city || null,
        state: patient.state || null,
        guardianName: patient.guardianName || null,
        emergencyPhone: patient.emergencyPhone || null,
        profession: patient.profession || null,
        maritalStatus: patient.maritalStatus || null,
        referralSource: patient.referralSource || null,
        notes: patient.notes || null,
        relationship: 'paciente',
        isDefault: false
    };
}
