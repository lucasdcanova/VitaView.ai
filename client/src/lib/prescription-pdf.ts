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
    patientGender?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientGuardianName?: string;
    patientInsurance?: string; // Nome + Carteirinha
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
const generateBasicPrescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5; // Metade da A4 Landscape
    const centerX = xOffset + (pageWidth / 2);
    const margin = 10;
    const leftX = xOffset + margin;
    const rightX = xOffset + pageWidth - margin;

    let yPos = 15;

    // ===== HEADER =====
    // Logo no canto superior direito
    drawLogo(doc, rightX - 15, 10);

    // Título
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITUÁRIO", centerX, yPos, { align: "center" });

    yPos = 25;

    // Linha divisória
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftX, yPos, rightX, yPos);

    yPos = 32;

    // ===== DADOS DO MÉDICO =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, leftX, yPos);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, leftX, yPos + 5);
    if (data.doctorSpecialty) {
        doc.text(`${data.doctorSpecialty}`, leftX, yPos + 10);
    }

    // Dados da clínica no lado direito
    if (data.clinicName) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(data.clinicName, rightX, yPos, { align: "right" });
        if (data.clinicAddress) {
            doc.text(data.clinicAddress, rightX, yPos + 4, { align: "right" });
        }
        if (data.clinicPhone) {
            doc.text(`Tel: ${data.clinicPhone}`, rightX, yPos + 8, { align: "right" });
        }
    }

    yPos = 50;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos = 58;

    // ===== DADOS DO PACIENTE =====
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PACIENTE:", leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, leftX + 25, yPos);

    // Data no lado direito
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.setFont("helvetica", "bold");
    doc.text("DATA:", rightX - 35, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, rightX, yPos, { align: "right" });

    yPos = 66;

    // Informações adicionais do paciente
    // Informações adicionais do paciente (Layout denso)
    const patientDetails: string[] = [];

    // Linha 1: Idade | Sexo
    let line1 = "";
    if (data.patientAge) line1 += `Idade: ${data.patientAge}`;
    if (data.patientGender) line1 += `${line1 ? "  |  " : ""}Sexo: ${data.patientGender}`;
    if (line1) patientDetails.push(line1);

    // Linha 2: CPF | RG
    let line2 = "";
    if (data.patientCpf) line2 += `CPF: ${data.patientCpf}`;
    if (data.patientRg) line2 += `${line2 ? "  |  " : ""}RG: ${data.patientRg}`;
    if (line2) patientDetails.push(line2);

    // Linha 3: Contatos
    let line3 = "";
    if (data.patientPhone) line3 += `Tel: ${data.patientPhone}`;
    if (data.patientEmail) line3 += `${line3 ? "  |  " : ""}Email: ${data.patientEmail}`;
    if (line3) patientDetails.push(line3);

    // Responsável
    if (data.patientGuardianName) {
        patientDetails.push(`Responsável: ${data.patientGuardianName}`);
    }

    // Convênio
    if (data.patientInsurance) {
        patientDetails.push(`Convênio: ${data.patientInsurance}`);
    }

    doc.setFontSize(8);
    patientDetails.forEach(detail => {
        doc.text(detail, leftX, yPos);
        yPos += 4;
    });

    if (patientDetails.length > 0) yPos += 2;

    if (data.patientAddress) {
        doc.setFontSize(8);
        const addr = data.patientAddress.length > 70 ? data.patientAddress.substring(0, 67) + "..." : data.patientAddress;
        doc.text(`Endereço: ${addr}`, leftX, yPos);
        yPos += 5;
    }

    yPos += 5;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos += 10;

    // ===== PRESCRIÇÃO =====
    // Uso contínuo checkbox
    if (data.isContinuousUse) {
        doc.setFontSize(8);
        doc.rect(leftX, yPos - 3, 3, 3, "S");
        doc.text("X", leftX + 0.7, yPos - 0.5);
        doc.text("Uso Contínuo", leftX + 5, yPos);
        yPos += 8;
    }

    // Medicamentos
    const rightMargin = rightX;
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");

        // Linha 1: Nome (esquerda) | Quantidade (direita)
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();

        doc.text(`${index + 1}.`, leftX, yPos);
        doc.text(medicationLine, leftX + 7, yPos);

        // Quantidade à direita (se houver)
        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        yPos += 5;

        // Linha 2: Dosagem (se houver)
        if (med.dosage) {
            doc.setFont("helvetica", "normal");
            doc.text(med.dosage, leftX + 7, yPos);
            yPos += 5;
        }

        // Linha 3: Posologia (esquerda) | Via de administração (direita)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        if (med.frequency) {
            let posologia = med.frequency;
            // Adicionar "Uso contínuo" se for receita de uso contínuo
            if (data.isContinuousUse) {
                posologia += ". Uso contínuo.";
            }
            // Quebrar texto se for muito longo
            const maxPosologiaWidth = pageWidth - margin * 2 - 30;
            const posologiaLines = doc.splitTextToSize(posologia, maxPosologiaWidth);
            doc.text(posologiaLines, leftX + 7, yPos);
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
            doc.text(`Obs: ${med.notes}`, leftX + 7, yPos);
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
        const obsLines = doc.splitTextToSize(`Observações: ${data.observations}`, pageWidth - (margin * 2));
        doc.text(obsLines, leftX, yPos);
        yPos += obsLines.length * 4;
    }

    // ===== RODAPÉ - Posicionado na parte inferior da página =====
    const pageHeight = 210; // A4 landscape height
    const signatureY = pageHeight - 45; // Assinatura a 45mm do fundo
    const footerY = pageHeight - 15; // Validade a 15mm do fundo

    // ===== ASSINATURA =====
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    // Linha de assinatura centralizada
    doc.line(centerX - 40, signatureY, centerX + 40, signatureY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, centerX, signatureY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, centerX, signatureY + 10, { align: "center" });
    doc.text("Assinatura e Carimbo", centerX, signatureY + 15, { align: "center" });

    // Validade
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Válido por 180 dias a partir da data de emissão.", leftX, footerY);
    doc.text("1ª Via", rightX, footerY, { align: "right" });
};

// ==========================================
// RECEITA DE CONTROLE ESPECIAL (Minimalista)
// ==========================================
// ==========================================
// RECEITA DE CONTROLE ESPECIAL (Minimalista) - A5 Landscape
// ==========================================
const generateControlledPrescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5; // A5 width
    const centerX = xOffset + (pageWidth / 2);
    const margin = 10;
    const leftX = xOffset + margin;
    const rightX = xOffset + pageWidth - margin;

    let yPos = 15;

    // ===== HEADER =====
    // Logo no canto superior direito
    drawLogo(doc, rightX - 15, 10);

    // Título
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITA DE CONTROLE ESPECIAL", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("1ª Via - Retenção da Farmácia", centerX, yPos + 5, { align: "center" });

    yPos = 28;

    // Linha divisória dupla
    doc.setLineWidth(0.5);
    doc.line(leftX, yPos, rightX, yPos);
    doc.line(leftX, yPos + 1.5, rightX, yPos + 1.5);

    yPos = 38;

    // ===== IDENTIFICAÇÃO DO EMITENTE =====
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO EMITENTE", leftX, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, leftX, yPos);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, leftX + 65, yPos);

    yPos += 5;
    if (data.doctorSpecialty) {
        doc.text(data.doctorSpecialty, leftX, yPos);
    }

    if (data.clinicAddress) {
        yPos += 4;
        doc.text(data.clinicAddress, leftX, yPos);
    }
    if (data.clinicPhone) {
        doc.text(`Tel: ${data.clinicPhone}`, rightX, yPos, { align: "right" });
    }

    yPos += 8;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos += 8;

    // ===== DADOS DO PACIENTE =====
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO PACIENTE", leftX, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Nome:", leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, leftX + 15, yPos);

    // Data no lado direito
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.setFont("helvetica", "bold");
    doc.text("Data:", rightX - 35, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, rightX, yPos, { align: "right" });

    yPos += 5;

    // CPF e Endereço
    // Linha 1: CPF | RG | Idade | Sexo
    let infoLine = "";
    if (data.patientCpf) infoLine += `CPF: ${data.patientCpf}`;
    if (data.patientRg) infoLine += `${infoLine ? "  |  " : ""}RG: ${data.patientRg}`;
    if (data.patientAge) infoLine += `${infoLine ? "  |  " : ""}Idade: ${data.patientAge}`;
    if (data.patientGender) infoLine += `${infoLine ? "  |  " : ""}Sexo: ${data.patientGender}`;

    if (infoLine) {
        doc.setFont("helvetica", "normal");
        doc.text(infoLine, leftX, yPos);
        yPos += 5;
    }

    // Endereço
    if (data.patientAddress) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Endereço:", leftX, yPos);
        doc.setFont("helvetica", "normal");
        const addr = data.patientAddress.length > 85 ? data.patientAddress.substring(0, 82) + "..." : data.patientAddress;
        doc.text(addr, leftX + 20, yPos);
        yPos += 5;
    }

    // Contatos e Convenio
    let extraLine = "";
    if (data.patientPhone) extraLine += `Tel: ${data.patientPhone}`;
    if (data.patientInsurance) extraLine += `${extraLine ? "  |  " : ""}Convênio: ${data.patientInsurance}`;

    if (extraLine) {
        doc.text(extraLine, leftX, yPos);
        yPos += 5;
    }

    yPos += 8;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos += 8;

    // ===== PRESCRIÇÃO =====
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIÇÃO", leftX, yPos);

    yPos += 8;

    // Medicamentos
    const rightMargin = rightX;
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");

        // Linha 1
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();
        doc.text(`${index + 1}.`, leftX, yPos);
        doc.text(medicationLine, leftX + 7, yPos);

        // Quantidade à direita (obrigatório para controlados)
        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        yPos += 5;

        // Linha 2
        if (med.dosage) {
            doc.setFont("helvetica", "normal");
            doc.text(med.dosage, leftX + 7, yPos);
            yPos += 5;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        if (med.frequency) {
            let posologia = med.frequency;
            if (data.isContinuousUse) posologia += ". Uso contínuo.";
            // Quebrar texto se for muito longo
            const maxPosologiaWidth = pageWidth - margin * 2 - 30;
            const posologiaLines = doc.splitTextToSize(posologia, maxPosologiaWidth);
            doc.text(posologiaLines, leftX + 7, yPos);
        }

        // Via de administração
        if (med.format) {
            let viaAdmin = "Oral";
            const formatLower = med.format.toLowerCase();
            if (formatLower.includes("injet") || formatLower.includes("ampola")) viaAdmin = "Injetável";
            else if (formatLower.includes("topico") || formatLower.includes("pomada") || formatLower.includes("creme")) viaAdmin = "Tópico";
            else if (formatLower.includes("gotas") || formatLower.includes("colírio")) viaAdmin = "Oftálmico";
            else if (formatLower.includes("inalat") || formatLower.includes("spray nasal")) viaAdmin = "Inalatório";
            else if (formatLower.includes("supositório")) viaAdmin = "Retal";
            doc.text(viaAdmin, rightMargin, yPos, { align: "right" });
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // ===== RODAPÉ =====
    const pageHeight = 210; // A5 
    const signatureY = pageHeight - 80; // Acima das caixas
    const boxesY = pageHeight - 55;
    const validityY = pageHeight - 12;

    // ===== ASSINATURA =====
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    doc.line(centerX - 40, signatureY, centerX + 40, signatureY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, centerX, signatureY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, centerX, signatureY + 10, { align: "center" });
    doc.text("Assinatura e Carimbo", centerX, signatureY + 15, { align: "center" });

    // ===== IDENTIFICAÇÃO DO COMPRADOR =====
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    // Largura total disponivel = pageWidth - 2*margin = 128.5
    // Cada caixa = ~62mm
    const boxWidth = 62;
    doc.rect(leftX, boxesY, boxWidth, 35, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", leftX + 3, boxesY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Nome: __________________________", leftX + 3, boxesY + 12);
    doc.text("RG: ____________ Órgão: _________", leftX + 3, boxesY + 18);
    doc.text("Endereço: _______________________", leftX + 3, boxesY + 24);
    doc.text("Telefone: _______________________", leftX + 3, boxesY + 30);

    // ===== IDENTIFICAÇÃO DO FORNECEDOR =====
    const box2X = rightX - boxWidth;
    doc.rect(box2X, boxesY, boxWidth, 35, "S");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO FORNECEDOR", box2X + 3, boxesY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Data: ___/___/______", box2X + 3, boxesY + 12);
    doc.text("Assinatura Farmacêutico:", box2X + 3, boxesY + 18);
    doc.text("__________________________", box2X + 3, boxesY + 24);
    doc.text("CRF: _____________________", box2X + 3, boxesY + 30);

    // Validade no rodapé
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Válido por 30 dias a partir da data de emissão.", leftX, validityY);
};

// ==========================================
// RECEITA TIPO A (Amarela - Opioides)
// ==========================================
// ==========================================
// RECEITA TIPO A (Amarela - Opioides)
// ==========================================
const generateTypeAPrescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5;
    const centerX = xOffset + (pageWidth / 2);
    const rightX = xOffset + pageWidth - 10;
    let yPos = 15;

    // Header com fundo amarelo claro
    doc.setFillColor(255, 248, 220);
    doc.rect(xOffset, 0, pageWidth, 30, 'F');

    drawLogo(doc, rightX - 15, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 120, 0);
    doc.text("NOTIFICAÇÃO DE RECEITA \"A\"", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 80, 0);
    doc.text("Entorpecentes e Psicotrópicos - Lista A1/A2 (Opioides)", centerX, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia", centerX, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    // Usar apenas o conteúdo controlado (sem header duplicado)
    generateControlledContent(doc, data, yPos, xOffset);
};

// ==========================================
// RECEITA TIPO B1 (Azul - Psicotrópicos)
// ==========================================
// ==========================================
// RECEITA TIPO B1 (Azul - Psicotrópicos)
// ==========================================
const generateTypeB1Prescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5;
    const centerX = xOffset + (pageWidth / 2);
    const rightX = xOffset + pageWidth - 10;
    let yPos = 15;

    // Header com fundo azul claro
    doc.setFillColor(220, 235, 255);
    doc.rect(xOffset, 0, pageWidth, 30, 'F');

    drawLogo(doc, rightX - 15, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 80, 150);
    doc.text("NOTIFICAÇÃO DE RECEITA \"B\"", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 80, 120);
    doc.text("Psicotrópicos - Lista B1 (Ansiolíticos, Hipnóticos, Anticonvulsivantes)", centerX, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia", centerX, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    // Usar estrutura controlada
    generateControlledContent(doc, data, yPos, xOffset);
};

// ==========================================
// RECEITA TIPO B2 (Azul - Anorexígenos)
// ==========================================
// ==========================================
// RECEITA TIPO B2 (Azul - Anorexígenos)
// ==========================================
const generateTypeB2Prescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5;
    const centerX = xOffset + (pageWidth / 2);
    const rightX = xOffset + pageWidth - 10;
    let yPos = 15;

    // Header com fundo azul mais intenso
    doc.setFillColor(200, 220, 255);
    doc.rect(xOffset, 0, pageWidth, 30, 'F');

    drawLogo(doc, rightX - 15, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 60, 130);
    doc.text("NOTIFICAÇÃO DE RECEITA \"B2\"", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 70, 110);
    doc.text("Psicotrópicos Anorexígenos - Lista B2", centerX, yPos + 5, { align: "center" });
    doc.text("1ª Via - Retenção da Farmácia", centerX, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    generateControlledContent(doc, data, yPos, xOffset);
};

// ==========================================
// RECEITA TIPO C (Branca 2 vias - Retinoides)
// ==========================================
// ==========================================
// RECEITA TIPO C (Branca 2 vias - Retinoides)
// ==========================================
const generateTypeCPrescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5;
    const centerX = xOffset + (pageWidth / 2);
    const rightX = xOffset + pageWidth - 10;
    let yPos = 15;

    drawLogo(doc, rightX - 15, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITA DE CONTROLE ESPECIAL", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Retinoides, Imunossupressores - Lista C (2 vias)", centerX, yPos + 5, { align: "center" });
    doc.text("Retinoides, Imunossupressores - Lista C (2 vias)", centerX, yPos + 5, { align: "center" });

    const viaText = xOffset > 0 ? "2ª Via - Paciente" : "1ª Via - Retenção da Farmácia";
    doc.text(viaText, centerX, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    generateControlledContent(doc, data, yPos, xOffset);
};

// ==========================================
// RECEITA TIPO C1 (Especial - Antidepressivos, Antipsicóticos)
// ==========================================
// ==========================================
// RECEITA TIPO C1 (Especial - Antidepressivos, Antipsicóticos)
// ==========================================
const generateTypeC1Prescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5;
    const centerX = xOffset + (pageWidth / 2);
    const rightX = xOffset + pageWidth - 10;
    let yPos = 15;

    drawLogo(doc, rightX - 15, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("RECEITA DE CONTROLE ESPECIAL", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Antidepressivos, Antipsicóticos - Lista C1 (2 vias)", centerX, yPos + 5, { align: "center" });
    doc.text("Antidepressivos, Antipsicóticos - Lista C1 (2 vias)", centerX, yPos + 5, { align: "center" });

    const viaText = xOffset > 0 ? "2ª Via - Paciente" : "1ª Via - Retenção da Farmácia";
    doc.text(viaText, centerX, yPos + 9, { align: "center" });

    yPos = 38;
    doc.setTextColor(0, 0, 0);

    generateControlledContent(doc, data, yPos, xOffset);
};

// ==========================================
// RECEITA ESPECIAL (Antibióticos, etc)
// ==========================================
// ==========================================
// RECEITA ESPECIAL (Antibióticos, etc)
// ==========================================
const generateSpecialPrescription = (doc: jsPDF, data: PrescriptionData, xOffset: number = 0) => {
    const pageWidth = 148.5;
    const centerX = xOffset + (pageWidth / 2);
    const rightX = xOffset + pageWidth - 10;
    const leftX = xOffset + 10;
    let yPos = 15;

    // Header com fundo amarelo suave
    doc.setFillColor(255, 250, 230);
    doc.rect(xOffset, 0, pageWidth, 25, 'F');

    drawLogo(doc, rightX - 15, 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 100, 0);
    doc.text("RECEITA ESPECIAL", centerX, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 80, 0);
    doc.text("Antimicrobianos - 2 vias (Retenção Farmácia)", centerX, yPos + 5, { align: "center" });

    const viaText = xOffset > 0 ? "2ª Via - Paciente" : "1ª Via - Retenção da Farmácia";
    doc.text(viaText, centerX, yPos + 9, { align: "center" });

    yPos = 32;
    doc.setTextColor(0, 0, 0);

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(leftX, yPos, rightX, yPos);

    yPos = 40;

    // Continuar com estrutura básica
    generateBasicContent(doc, data, yPos, xOffset);
};

// Helper: Conteúdo da receita controlada (sem header)
const generateControlledContent = (doc: jsPDF, data: PrescriptionData, startY: number, xOffset: number = 0) => {
    const pageWidth = 148.5; // A5
    const centerX = xOffset + (pageWidth / 2);
    const margin = 10;
    const leftX = xOffset + margin;
    const rightX = xOffset + pageWidth - margin;

    let yPos = startY;

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(leftX, yPos - 5, rightX, yPos - 5);

    // Dados do médico
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, leftX + 65, yPos);
    if (data.doctorSpecialty) {
        doc.setFontSize(8);
        doc.text(data.doctorSpecialty, leftX, yPos + 4);
    }

    yPos += 12;

    // Dados do paciente
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, leftX + 20, yPos);

    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.text(`Data: ${dateStr}`, rightX, yPos, { align: "right" });

    yPos += 5;

    // Dados extras do paciente - compactados
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    let line1 = "";
    if (data.patientCpf) line1 += `CPF: ${data.patientCpf}`;
    if (data.patientRg) line1 += `${line1 ? " | " : ""}RG: ${data.patientRg}`;
    if (data.patientPhone) line1 += `${line1 ? " | " : ""}Tel: ${data.patientPhone}`;
    if (data.patientGuardianName) line1 += `${line1 ? " | " : ""}Resp: ${data.patientGuardianName}`;

    if (line1) {
        doc.text(line1, leftX, yPos);
        yPos += 4;
    }

    if (data.patientAddress) {
        const addr = data.patientAddress.length > 80 ? data.patientAddress.substring(0, 77) + "..." : data.patientAddress;
        doc.text(`Endereço: ${addr}`, leftX, yPos);
        yPos += 4;
    }

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos += 8;

    // Medicamentos
    const rightMargin = rightX;
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();

        doc.text(`${index + 1}.`, leftX, yPos);
        doc.text(medicationLine, leftX + 7, yPos);

        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        yPos += 5;

        // Linha 2: Dosagem (se houver)
        if (med.dosage) {
            doc.setFont("helvetica", "normal");
            doc.text(med.dosage, leftX + 7, yPos);
            yPos += 5;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (med.frequency) {
            // Quebrar texto se for muito longo
            const maxPosologiaWidth = pageWidth - margin * 2 - 30;
            const posologiaLines = doc.splitTextToSize(med.frequency, maxPosologiaWidth);
            doc.text(posologiaLines, leftX + 7, yPos);
        }

        // Via de administração
        if (med.format) {
            let viaAdmin = "Oral";
            const formatLower = med.format.toLowerCase();
            if (formatLower.includes("injet") || formatLower.includes("ampola")) viaAdmin = "Injetável";
            else if (formatLower.includes("topico") || formatLower.includes("pomada") || formatLower.includes("creme")) viaAdmin = "Tópico";
            else if (formatLower.includes("gotas") || formatLower.includes("colírio")) viaAdmin = "Oftálmico";
            else if (formatLower.includes("inalat") || formatLower.includes("spray nasal")) viaAdmin = "Inalatório";
            else if (formatLower.includes("supositório")) viaAdmin = "Retal";
            doc.text(viaAdmin, rightMargin, yPos, { align: "right" });
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // Assinatura e caixas
    const pageHeight = 210;
    const signatureY = pageHeight - 80;
    const boxesY = pageHeight - 55;

    doc.setLineWidth(0.3);
    doc.line(centerX - 40, signatureY, centerX + 40, signatureY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, centerX, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, centerX, signatureY + 10, { align: "center" });

    // Caixas de identificação
    const boxWidth = 62;
    doc.rect(leftX, boxesY, boxWidth, 35, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", leftX + 3, boxesY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Nome: __________________________", leftX + 3, boxesY + 12);
    doc.text("RG: ____________ Órgão: _________", leftX + 3, boxesY + 18);
    doc.text("Endereço: _______________________", leftX + 3, boxesY + 24);

    doc.setTextColor(0, 0, 0);
    const box2X = rightX - boxWidth;
    doc.rect(box2X, boxesY, boxWidth, 35, "S");
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO FORNECEDOR", box2X + 3, boxesY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Data: ___/___/______", box2X + 3, boxesY + 12);
    doc.text("Assinatura: ____________________", box2X + 3, boxesY + 18);
};

// Helper: Conteúdo básico (sem header)
const generateBasicContent = (doc: jsPDF, data: PrescriptionData, startY: number, xOffset: number = 0) => {
    const pageWidth = 148.5; // A5
    const centerX = xOffset + (pageWidth / 2);
    const margin = 10;
    const leftX = xOffset + margin;
    const rightX = xOffset + pageWidth - margin;

    let yPos = startY;

    // Dados do médico
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, leftX, yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, leftX, yPos + 5);

    yPos += 15;

    // Paciente
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PACIENTE:", leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, leftX + 25, yPos);

    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.text(`DATA: ${dateStr}`, rightX, yPos, { align: "right" });

    yPos += 5;

    // Detalhes extras do paciente
    doc.setFontSize(8);
    let details = "";
    if (data.patientCpf) details += `CPF: ${data.patientCpf}`;
    if (data.patientPhone) details += `${details ? " | " : ""}Tel: ${data.patientPhone}`;
    if (data.patientGender) details += `${details ? " | " : ""}Sexo: ${data.patientGender}`;
    if (data.patientInsurance) details += `${details ? " | " : ""}Convênio: ${data.patientInsurance}`;

    if (details) {
        doc.text(details, leftX, yPos);
        yPos += 4;
    }

    if (data.patientAddress) {
        const addr = data.patientAddress.length > 90 ? data.patientAddress.substring(0, 87) + "..." : data.patientAddress;
        doc.text(`End: ${addr}`, leftX, yPos);
        yPos += 4;
    }

    yPos += 10;
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos += 10;

    // Medicamentos
    const rightMargin = rightX;
    doc.setFontSize(10);

    data.medications.forEach((med, index) => {
        doc.setFont("helvetica", "bold");
        let medicationLine = cleanTextForPDF(med.name).toUpperCase();

        doc.text(`${index + 1}.`, leftX, yPos);
        doc.text(medicationLine, leftX + 7, yPos);

        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.text(med.quantity, rightMargin, yPos, { align: "right" });
        }

        yPos += 5;

        if (med.dosage) {
            doc.setFont("helvetica", "normal");
            doc.text(med.dosage, leftX + 7, yPos);
            yPos += 5;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (med.frequency) {
            // Quebrar texto se for muito longo
            const maxPosologiaWidth = pageWidth - margin * 2 - 30;
            const posologiaLines = doc.splitTextToSize(med.frequency, maxPosologiaWidth);
            doc.text(posologiaLines, leftX + 7, yPos);
        }

        // Via de administração
        if (med.format) {
            let viaAdmin = "Oral";
            const formatLower = med.format.toLowerCase();
            if (formatLower.includes("injet") || formatLower.includes("ampola")) viaAdmin = "Injetável";
            else if (formatLower.includes("topico") || formatLower.includes("pomada") || formatLower.includes("creme")) viaAdmin = "Tópico";
            else if (formatLower.includes("gotas") || formatLower.includes("colírio")) viaAdmin = "Oftálmico";
            else if (formatLower.includes("inalat") || formatLower.includes("spray nasal")) viaAdmin = "Inalatório";
            else if (formatLower.includes("supositório")) viaAdmin = "Retal";
            doc.text(viaAdmin, rightMargin, yPos, { align: "right" });
        }

        yPos += 10;
        doc.setFontSize(10);
    });

    // Assinatura
    const pageHeight = 210;
    const signatureY = pageHeight - 45;
    doc.setLineWidth(0.3);
    doc.line(centerX - 40, signatureY, centerX + 40, signatureY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, centerX, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, centerX, signatureY + 10, { align: "center" });
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
        C: [],
        C1: []  // Antidepressivos e Antipsicóticos (Receita Especial branca 2 vias)
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
    const typeOrder: Array<keyof typeof groups> = ['padrao', 'especial', 'A', 'B1', 'B2', 'C', 'C1'];
    const typesWithMeds = typeOrder.filter(type => groups[type].length > 0);

    if (typesWithMeds.length === 0) {
        console.warn("Nenhum medicamento para gerar receita");
        return;
    }

    // Paisagem (landscape), A4 (297x210)
    const doc = new jsPDF({ format: 'a4', orientation: 'landscape' });
    let isFirstPage = true;

    typesWithMeds.forEach(type => {
        if (!isFirstPage) {
            doc.addPage();
        }
        isFirstPage = false;

        const groupData = { ...data, medications: groups[type] };

        // Definindo offsets para 2 vias na mesma página (A4 Landscape dividida ao meio)
        // Largura total: 297mm. Metade: 148.5mm
        const offsets = [0, 148.5];

        // Desenha linha tracejada no meio para corte
        doc.setLineWidth(0.1);
        doc.setDrawColor(150, 150, 150);
        // doc.setLineDash([3, 3], 0); // FIXME: setLineDash não existe no types do jsPDF, ver workaround
        doc.line(148.5, 10, 148.5, 200); // Linha vertical central
        // doc.setLineDash([], 0); // Reset dash

        offsets.forEach(xOffset => {
            switch (type) {
                case 'padrao':
                    generateBasicPrescription(doc, groupData, xOffset);
                    break;
                case 'especial':
                    generateSpecialPrescription(doc, groupData, xOffset);
                    break;
                case 'A':
                    generateTypeAPrescription(doc, groupData, xOffset);
                    break;
                case 'B1':
                    generateTypeB1Prescription(doc, groupData, xOffset);
                    break;
                case 'B2':
                    generateTypeB2Prescription(doc, groupData, xOffset);
                    break;
                case 'C':
                    generateTypeCPrescription(doc, groupData, xOffset);
                    break;
                case 'C1':
                    generateTypeC1Prescription(doc, groupData, xOffset);
                    break;
            }
        });
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
