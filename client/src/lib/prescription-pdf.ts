import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrescriptionData {
    // Dados do Emitente (Médico/Clínica)
    clinicName?: string;
    clinicAddress?: string;
    clinicPhone?: string;
    doctorName: string;
    doctorCrm: string;
    doctorSpecialty?: string;
    // Dados do Paciente
    patientName: string;
    patientCpf?: string;
    patientRg?: string;
    patientAge?: string;
    patientAddress?: string;
    patientMotherName?: string;
    // Dados da Receita
    issueDate: Date;
    validUntil?: Date;
    isContinuousUse?: boolean;
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        format?: string;
        notes?: string;
        quantity?: string;
        prescriptionType?: string; // padrao, especial, A, B1, B2, C
    }[];
    observations?: string;
}

interface CertificateData {
    type: 'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao' | 'laudo';
    doctorName: string;
    doctorCrm: string;
    doctorSpecialty?: string;
    clinicName?: string;
    clinicAddress?: string;
    clinicPhone?: string;
    patientName: string;
    patientDoc?: string;
    issueDate: Date;
    daysOff?: string;
    cid?: string;
    startTime?: string;
    endTime?: string;
    customText?: string;
}

// Lista de medicamentos controlados
const CONTROLLED_MEDICATIONS = [
    'rivotril', 'clonazepam', 'alprazolam', 'diazepam', 'lorazepam', 'bromazepam',
    'zolpidem', 'ritalina', 'metilfenidato', 'concerta', 'venvanse', 'lisdexanfetamina',
    'morfina', 'codeina', 'tramadol', 'oxicodona', 'fentanil',
    'fluoxetina', 'sertralina', 'escitalopram', 'paroxetina', 'venlafaxina',
    'amitriptilina', 'nortriptilina', 'imipramina',
    'quetiapina', 'olanzapina', 'risperidona', 'aripiprazol',
    'carbonato de lítio', 'lítio', 'ácido valproico', 'valproato',
    'pregabalina', 'gabapentina', 'carbamazepina', 'fenobarbital'
];

const isControlledMedication = (medName: string): boolean => {
    return CONTROLLED_MEDICATIONS.some(c => medName.toLowerCase().includes(c));
};

// Remove emojis e caracteres Unicode especiais do texto (jsPDF/Helvetica não suporta)
const cleanTextForPDF = (text: string): string => {
    if (!text) return '';
    // Remove emojis comuns (💊💧💉 e outros símbolos) usando ranges conhecidos
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\uD800-\uDFFF].|[\u2600-\u27BF]/g, '').trim();
};

// Desenha o logo VitaView de forma minimalista (texto)
const drawLogo = (doc: jsPDF, x: number, y: number) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("VitaView.AI", x, y);
};

// ==========================================
// RECEITUÁRIO BÁSICO (Minimalista - Preto)
// ==========================================
const generateBasicPrescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    // ===== HEADER =====
    // Logo no canto superior direito
    drawLogo(doc, pageWidth - 30, 10);

    // Título
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITUÁRIO", 105, yPos, { align: "center" });

    yPos = 25;

    // Linha divisória
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos = 32;

    // ===== DADOS DO MÉDICO =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, 15, yPos);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 15, yPos + 5);
    if (data.doctorSpecialty) {
        doc.text(`${data.doctorSpecialty}`, 15, yPos + 10);
    }

    // Dados da clínica no lado direito
    if (data.clinicName) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(data.clinicName, pageWidth - 15, yPos, { align: "right" });
        if (data.clinicAddress) {
            doc.text(data.clinicAddress, pageWidth - 15, yPos + 4, { align: "right" });
        }
        if (data.clinicPhone) {
            doc.text(`Tel: ${data.clinicPhone}`, pageWidth - 15, yPos + 8, { align: "right" });
        }
    }

    yPos = 50;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos = 58;

    // ===== DADOS DO PACIENTE =====
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PACIENTE:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, 40, yPos);

    // Data no lado direito
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.setFont("helvetica", "bold");
    doc.text("DATA:", pageWidth - 45, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, pageWidth - 30, yPos);

    yPos = 66;

    // Informações adicionais do paciente
    if (data.patientCpf || data.patientAge) {
        doc.setFontSize(8);
        let patientInfo = "";
        if (data.patientAge) patientInfo += `Idade: ${data.patientAge}`;
        if (data.patientCpf) patientInfo += `${patientInfo ? "  •  " : ""}CPF: ${data.patientCpf}`;
        doc.text(patientInfo, 15, yPos);
        yPos += 5;
    }

    if (data.patientAddress) {
        doc.setFontSize(8);
        const addr = data.patientAddress.length > 100 ? data.patientAddress.substring(0, 97) + "..." : data.patientAddress;
        doc.text(`Endereço: ${addr}`, 15, yPos);
        yPos += 5;
    }

    yPos += 5;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 10;

    // ===== PRESCRIÇÃO =====
    // Uso contínuo checkbox
    if (data.isContinuousUse) {
        doc.setFontSize(8);
        doc.rect(15, yPos - 3, 3, 3, "S");
        doc.text("X", 15.7, yPos - 0.5);
        doc.text("Uso Contínuo", 20, yPos);
        yPos += 8;
    }

    // Medicamentos
    const prescriptionStartY = yPos;
    const rightMargin = pageWidth - 15; // Margem direita para textos alinhados à direita
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");

        // Linha 1: Nome + Dosagem (esquerda) | Quantidade (direita)
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();
        if (med.dosage) {
            medicationLine += ` ${med.dosage}`;
        }

        doc.text(`${index + 1}.`, 15, yPos);
        doc.text(medicationLine, 22, yPos);

        // Quantidade à direita (se houver)
        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        // Linha 2: Posologia (esquerda) | Via de administração (direita)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        yPos += 5;

        if (med.frequency) {
            let posologia = med.frequency;
            // Adicionar "Uso contínuo" se for receita de uso contínuo
            if (data.isContinuousUse) {
                posologia += ". Uso contínuo.";
            }
            doc.text(posologia, 22, yPos);
        }

        // Via de administração à direita (format = comprimido, cápsula, etc. => via oral)
        if (med.format) {
            // Determinar via de administração baseado no formato
            let viaAdmin = "Oral"; // Default
            const formatLower = med.format.toLowerCase();
            if (formatLower.includes("injet") || formatLower.includes("ampola")) {
                viaAdmin = "Injetável";
            } else if (formatLower.includes("topico") || formatLower.includes("pomada") || formatLower.includes("creme")) {
                viaAdmin = "Tópico";
            } else if (formatLower.includes("gotas") || formatLower.includes("colírio")) {
                viaAdmin = "Oftálmico";
            } else if (formatLower.includes("inalat") || formatLower.includes("spray nasal")) {
                viaAdmin = "Inalatório";
            } else if (formatLower.includes("supositório")) {
                viaAdmin = "Retal";
            }
            doc.text(viaAdmin, rightMargin, yPos, { align: "right" });
        }

        // Observações do medicamento (se houver)
        if (med.notes) {
            yPos += 4;
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text(`Obs: ${med.notes}`, 22, yPos);
            doc.setFont("helvetica", "normal");
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // Observações gerais
    if (data.observations) {
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const obsLines = doc.splitTextToSize(`Observações: ${data.observations}`, pageWidth - 30);
        doc.text(obsLines, 15, yPos);
        yPos += obsLines.length * 4;
    }

    // ===== RODAPÉ - Posicionado na parte inferior da página =====
    const pageHeight = 297; // A4 height em mm
    const signatureY = pageHeight - 45; // Assinatura a 45mm do fundo
    const footerY = pageHeight - 15; // Validade a 15mm do fundo

    // ===== ASSINATURA =====
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    doc.line(65, signatureY, 145, signatureY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, signatureY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, signatureY + 10, { align: "center" });
    doc.text("Assinatura e Carimbo", 105, signatureY + 15, { align: "center" });

    // Validade
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Válido por 180 dias a partir da data de emissão.", 15, footerY);
    doc.text("1ª Via", pageWidth - 15, footerY, { align: "right" });
};

// ==========================================
// RECEITA DE CONTROLE ESPECIAL (Minimalista)
// ==========================================
const generateControlledPrescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    // ===== HEADER =====
    // Logo no canto superior direito
    drawLogo(doc, pageWidth - 30, 10);

    // Título
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITA DE CONTROLE ESPECIAL", 105, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("1ª Via - Retenção da Farmácia", 105, yPos + 5, { align: "center" });

    yPos = 28;

    // Linha divisória dupla
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    doc.line(15, yPos + 1.5, pageWidth - 15, yPos + 1.5);

    yPos = 38;

    // ===== IDENTIFICAÇÃO DO EMITENTE =====
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO EMITENTE", 15, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, 15, yPos);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 80, yPos);

    yPos += 5;
    if (data.doctorSpecialty) {
        doc.text(data.doctorSpecialty, 15, yPos);
    }

    if (data.clinicAddress) {
        yPos += 4;
        doc.text(data.clinicAddress, 15, yPos);
    }
    if (data.clinicPhone) {
        doc.text(`Tel: ${data.clinicPhone}`, 130, yPos);
    }

    yPos += 8;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 8;

    // ===== DADOS DO PACIENTE =====
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO PACIENTE", 15, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Nome:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, 30, yPos);

    // Data no lado direito
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.setFont("helvetica", "bold");
    doc.text("Data:", 150, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, 165, yPos);

    yPos += 5;

    // CPF e Endereço
    if (data.patientCpf) {
        doc.setFont("helvetica", "bold");
        doc.text("CPF:", 15, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(data.patientCpf, 28, yPos);
    }

    if (data.patientRg) {
        doc.setFont("helvetica", "bold");
        doc.text("RG:", 70, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(data.patientRg, 80, yPos);
    }

    if (data.patientAge) {
        doc.setFont("helvetica", "bold");
        doc.text("Idade:", 120, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(data.patientAge, 135, yPos);
    }

    yPos += 5;

    if (data.patientAddress) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Endereço:", 15, yPos);
        doc.setFont("helvetica", "normal");
        const addr = data.patientAddress.length > 85 ? data.patientAddress.substring(0, 82) + "..." : data.patientAddress;
        doc.text(addr, 35, yPos);
    }

    yPos += 8;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 8;

    // ===== PRESCRIÇÃO =====
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIÇÃO", 15, yPos);

    yPos += 8;

    // Medicamentos
    const rightMargin = pageWidth - 15; // Margem direita para textos alinhados à direita
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");

        // Linha 1: Nome + Dosagem (esquerda) | Quantidade (direita)
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();
        if (med.dosage) {
            medicationLine += ` ${med.dosage}`;
        }

        doc.text(`${index + 1}.`, 15, yPos);
        doc.text(medicationLine, 22, yPos);

        // Quantidade à direita (obrigatório para controlados)
        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        // Linha 2: Posologia (esquerda) | Via de administração (direita)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        yPos += 5;

        if (med.frequency) {
            let posologia = med.frequency;
            // Adicionar "Uso contínuo" se for receita de uso contínuo
            if (data.isContinuousUse) {
                posologia += ". Uso contínuo.";
            }
            doc.text(posologia, 22, yPos);
        }

        // Via de administração à direita
        if (med.format) {
            let viaAdmin = "Oral"; // Default
            const formatLower = med.format.toLowerCase();
            if (formatLower.includes("injet") || formatLower.includes("ampola")) {
                viaAdmin = "Injetável";
            } else if (formatLower.includes("topico") || formatLower.includes("pomada") || formatLower.includes("creme")) {
                viaAdmin = "Tópico";
            } else if (formatLower.includes("gotas") || formatLower.includes("colírio")) {
                viaAdmin = "Oftálmico";
            } else if (formatLower.includes("inalat") || formatLower.includes("spray nasal")) {
                viaAdmin = "Inalatório";
            } else if (formatLower.includes("supositório")) {
                viaAdmin = "Retal";
            }
            doc.text(viaAdmin, rightMargin, yPos, { align: "right" });
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // ===== RODAPÉ - Posicionado na parte inferior da página =====
    const pageHeight = 297; // A4 height em mm
    const signatureY = pageHeight - 80; // Assinatura a 80mm do fundo (logo acima das caixas)
    const boxesY = pageHeight - 55; // Posição das caixas (55mm do fundo)
    const validityY = pageHeight - 12; // Posição da validade (12mm do fundo)

    // ===== ASSINATURA =====
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    doc.line(65, signatureY, 145, signatureY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, signatureY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, signatureY + 10, { align: "center" });
    doc.text("Assinatura e Carimbo", 105, signatureY + 15, { align: "center" });

    // ===== IDENTIFICAÇÃO DO COMPRADOR =====
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    doc.rect(15, boxesY, 85, 35, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", 18, boxesY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Nome: _________________________________", 18, boxesY + 12);
    doc.text("RG: _________________ Órgão: ___________", 18, boxesY + 18);
    doc.text("Endereço: ______________________________", 18, boxesY + 24);
    doc.text("Telefone: _______________________________", 18, boxesY + 30);

    // ===== IDENTIFICAÇÃO DO FORNECEDOR =====
    doc.rect(110, boxesY, 85, 35, "S");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO FORNECEDOR", 113, boxesY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Data: ___/___/______", 113, boxesY + 12);
    doc.text("Assinatura Farmacêutico:", 113, boxesY + 18);
    doc.text("____________________________________", 113, boxesY + 24);
    doc.text("CRF: _______________________________", 113, boxesY + 30);

    // Validade no rodapé
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Válido por 30 dias a partir da data de emissão.", 15, validityY);
};

// ==========================================
// RECEITA TIPO A (Amarela - Opioides)
// ==========================================
const generateTypeAPrescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    // Header com fundo amarelo claro
    doc.setFillColor(255, 248, 220);
    doc.rect(0, 0, pageWidth, 30, 'F');

    drawLogo(doc, pageWidth - 30, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 120, 0);
    doc.text("NOTIFICAÇÃO DE RECEITA \"A\"", 105, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 80, 0);
    doc.text("Entorpecentes e Psicotrópicos - Lista A1/A2 (Opioides)", 105, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia", 105, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    // Reutilizar estrutura do controlado
    generateControlledPrescription(doc, data);
};

// ==========================================
// RECEITA TIPO B1 (Azul - Psicotrópicos)
// ==========================================
const generateTypeB1Prescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    // Header com fundo azul claro
    doc.setFillColor(220, 235, 255);
    doc.rect(0, 0, pageWidth, 30, 'F');

    drawLogo(doc, pageWidth - 30, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 80, 150);
    doc.text("NOTIFICAÇÃO DE RECEITA \"B\"", 105, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 80, 120);
    doc.text("Psicotrópicos - Lista B1 (Ansiolíticos, Hipnóticos, Anticonvulsivantes)", 105, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia", 105, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    // Usar estrutura controlada
    generateControlledContent(doc, data, yPos);
};

// ==========================================
// RECEITA TIPO B2 (Azul - Anorexígenos)
// ==========================================
const generateTypeB2Prescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    // Header com fundo azul mais intenso
    doc.setFillColor(200, 220, 255);
    doc.rect(0, 0, pageWidth, 30, 'F');

    drawLogo(doc, pageWidth - 30, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 60, 130);
    doc.text("NOTIFICAÇÃO DE RECEITA \"B2\"", 105, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 70, 110);
    doc.text("Psicotrópicos Anorexígenos - Lista B2", 105, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia", 105, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    generateControlledContent(doc, data, yPos);
};

// ==========================================
// RECEITA TIPO C (Branca 2 vias - Retinoides)
// ==========================================
const generateTypeCPrescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    drawLogo(doc, pageWidth - 30, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITA DE CONTROLE ESPECIAL", 105, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Retinoides, Imunossupressores - Lista C (2 vias)", 105, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia  |  2ª Via - Paciente", 105, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    generateControlledContent(doc, data, yPos);
};

// ==========================================
// RECEITA ESPECIAL (Antibióticos, etc)
// ==========================================
const generateSpecialPrescription = (doc: jsPDF, data: PrescriptionData) => {
    const pageWidth = 210;
    let yPos = 15;

    // Header com fundo amarelo suave
    doc.setFillColor(255, 250, 230);
    doc.rect(0, 0, pageWidth, 25, 'F');

    drawLogo(doc, pageWidth - 30, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 100, 0);
    doc.text("RECEITA ESPECIAL", 105, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 80, 0);
    doc.text("Antimicrobianos - 2 vias (Retenção Farmácia)", 105, yPos + 5, { align: "center" });

    yPos = 32;
    doc.setTextColor(0, 0, 0);

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos = 40;

    // Continuar com estrutura básica
    generateBasicContent(doc, data, yPos);
};

// Helper: Conteúdo da receita controlada (sem header)
const generateControlledContent = (doc: jsPDF, data: PrescriptionData, startY: number) => {
    const pageWidth = 210;
    let yPos = startY;

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(15, yPos - 5, pageWidth - 15, yPos - 5);

    // Dados do médico
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 80, yPos);
    if (data.doctorSpecialty) {
        doc.setFontSize(8);
        doc.text(data.doctorSpecialty, 15, yPos + 4);
    }

    yPos += 12;

    // Dados do paciente
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, 35, yPos);

    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.text(`Data: ${dateStr}`, 150, yPos);

    yPos += 10;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 8;

    // Medicamentos
    const rightMargin = pageWidth - 15;
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();
        if (med.dosage) medicationLine += ` ${med.dosage}`;

        doc.text(`${index + 1}.`, 15, yPos);
        doc.text(medicationLine, 22, yPos);

        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        yPos += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (med.frequency) {
            doc.text(med.frequency, 22, yPos);
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // Assinatura e caixas
    const pageHeight = 297;
    const signatureY = pageHeight - 80;
    const boxesY = pageHeight - 55;

    doc.setLineWidth(0.3);
    doc.line(65, signatureY, 145, signatureY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, signatureY + 10, { align: "center" });

    // Caixas de identificação
    doc.rect(15, boxesY, 85, 35, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", 18, boxesY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Nome: _________________________________", 18, boxesY + 12);
    doc.text("RG: _________________ Órgão: ___________", 18, boxesY + 18);
    doc.text("Endereço: ______________________________", 18, boxesY + 24);

    doc.setTextColor(0, 0, 0);
    doc.rect(110, boxesY, 85, 35, "S");
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO FORNECEDOR", 113, boxesY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Data: ___/___/______", 113, boxesY + 12);
    doc.text("Assinatura: ____________________________", 113, boxesY + 18);
};

// Helper: Conteúdo básico (sem header)
const generateBasicContent = (doc: jsPDF, data: PrescriptionData, startY: number) => {
    const pageWidth = 210;
    let yPos = startY;

    // Dados do médico
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, 15, yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 15, yPos + 5);

    yPos += 15;

    // Paciente
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PACIENTE:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, 40, yPos);

    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.text(`DATA: ${dateStr}`, 150, yPos);

    yPos += 10;
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 10;

    // Medicamentos
    const rightMargin = pageWidth - 15;
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();
        if (med.dosage) medicationLine += ` ${med.dosage}`;

        doc.text(`${index + 1}.`, 15, yPos);
        doc.text(medicationLine, 22, yPos);

        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        yPos += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (med.frequency) {
            doc.text(med.frequency, 22, yPos);
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // Assinatura
    const signatureY = 220;
    doc.setLineWidth(0.3);
    doc.line(65, signatureY, 145, signatureY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, signatureY + 10, { align: "center" });
};

// ==========================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO DE RECEITA
// ==========================================
export const generatePrescriptionPDF = (data: PrescriptionData) => {
    // Agrupar medicamentos por tipo de receituário
    const groups: { [key: string]: typeof data.medications } = {
        padrao: [],
        especial: [],
        A: [],
        B1: [],
        B2: [],
        C: []
    };

    data.medications.forEach(med => {
        const type = med.prescriptionType || 'padrao';
        if (groups[type]) {
            groups[type].push(med);
        } else {
            // Fallback: detectar controlados pelo nome se não tiver tipo definido
            if (isControlledMedication(med.name)) {
                groups['B1'].push(med); // Padrão para controlados sem tipo
            } else {
                groups['padrao'].push(med);
            }
        }
    });

    // Ordem de geração das páginas
    const typeOrder: Array<keyof typeof groups> = ['padrao', 'especial', 'A', 'B1', 'B2', 'C'];
    const typesWithMeds = typeOrder.filter(type => groups[type].length > 0);

    if (typesWithMeds.length === 0) {
        console.warn("Nenhum medicamento para gerar receita");
        return;
    }

    const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
    let isFirstPage = true;

    typesWithMeds.forEach(type => {
        if (!isFirstPage) {
            doc.addPage();
        }
        isFirstPage = false;

        const groupData = { ...data, medications: groups[type] };

        switch (type) {
            case 'padrao':
                generateBasicPrescription(doc, groupData);
                break;
            case 'especial':
                generateSpecialPrescription(doc, groupData);
                break;
            case 'A':
                generateTypeAPrescription(doc, groupData);
                break;
            case 'B1':
                generateTypeB1Prescription(doc, groupData);
                break;
            case 'B2':
                generateTypeB2Prescription(doc, groupData);
                break;
            case 'C':
                generateTypeCPrescription(doc, groupData);
                break;
        }
    });

    // Abrir PDF em nova aba
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
};

// ==========================================
// ATESTADOS / CERTIFICADOS (Minimalista)
// ==========================================
export const generateCertificatePDF = (data: CertificateData) => {
    const doc = new jsPDF();
    const pageWidth = 210;
    let yPos = 15;

    // Logo no canto superior direito
    drawLogo(doc, pageWidth - 30, 10);

    // Título
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const title = data.type === 'laudo' ? "LAUDO MÉDICO" : "ATESTADO MÉDICO";
    doc.text(title, 105, yPos, { align: "center" });

    yPos = 25;

    // Linha divisória
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos = 35;

    // Dados do médico
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, 15, yPos);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 15, yPos + 5);
    if (data.doctorSpecialty) {
        doc.text(data.doctorSpecialty, 15, yPos + 10);
    }

    if (data.clinicName) {
        doc.setFontSize(8);
        doc.text(data.clinicName, pageWidth - 15, yPos, { align: "right" });
        if (data.clinicAddress) {
            doc.text(data.clinicAddress, pageWidth - 15, yPos + 4, { align: "right" });
        }
        if (data.clinicPhone) {
            doc.text(`Tel: ${data.clinicPhone}`, pageWidth - 15, yPos + 8, { align: "right" });
        }
    }

    yPos = 60;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos = 80;

    // Corpo do atestado
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.setLineHeightFactor(1.5);

    let text = "";
    const dateStr = format(data.issueDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    if (data.customText) {
        text = data.customText;
    } else {
        switch (data.type) {
            case 'afastamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}, portador(a) do documento nº ${data.patientDoc || '________________'}, foi atendido(a) nesta data e necessita de ${data.daysOff || '___'} dia(s) de afastamento de suas atividades laborais/escolares a partir desta data, por motivo de doença.`;
                break;
            case 'comparecimento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}, portador(a) do documento nº ${data.patientDoc || '________________'}, compareceu a este serviço para atendimento médico/exames nesta data, no período das ${data.startTime || '____'} às ${data.endTime || '____'} horas.`;
                break;
            case 'acompanhamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}, portador(a) do documento nº ${data.patientDoc || '________________'}, compareceu a este serviço nesta data, como acompanhante de paciente sob meus cuidados.`;
                break;
            case 'aptidao':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}, portador(a) do documento nº ${data.patientDoc || '________________'}, foi examinado(a) por mim nesta data e encontra-se APTO(A) para a prática de atividades físicas.`;
                break;
            case 'laudo':
                text = `Paciente: ${data.patientName}\n\n[Descrição do quadro clínico]`;
                break;
        }
    }

    if (data.cid) {
        text += `\n\nCID: ${data.cid}`;
    }

    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, yPos);

    yPos += splitText.length * 6 + 30;

    // Local e Data
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Local e data: __________________, ${dateStr}.`, 105, yPos, { align: "center" });

    yPos += 40;

    // Assinatura
    doc.setLineWidth(0.3);
    doc.line(65, yPos, 145, yPos);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, yPos + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, yPos + 10, { align: "center" });
    doc.text("Assinatura e Carimbo", 105, yPos + 15, { align: "center" });

    // Abrir em nova aba
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
};
