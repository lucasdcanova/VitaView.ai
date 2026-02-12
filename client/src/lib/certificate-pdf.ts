import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CertificateData {
    type: 'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao' | 'laudo';
    doctorName: string;
    doctorCrm: string;
    patientName: string;
    patientDoc?: string;
    issueDate: string | Date; // Allow string from JSON
    daysOff?: number | string;
    cid?: string;
    city?: string;
    startTime?: string;
    endTime?: string;
    customText?: string;
}

// Remove emojis and special characters not supported by standard fonts
const cleanTextForPDF = (text: string): string => {
    if (!text) return '';
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\uD800-\uDFFF].|[\u2600-\u27BF]/g, '').trim();
};

const drawLogo = (doc: jsPDF, x: number, y: number) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Black
    doc.text("VitaView", x, y);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(".AI", x + 16, y);
};

// Helper to generate text for preview/editing
const numberToText = (num: number | string): string => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(n)) return '';

    const ones = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];

    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return tens[ten] + (one ? ' e ' + ones[one] : '');
    }
    return n.toString(); // Fallback for larger numbers
};

export const generateCertificateText = (data: CertificateData): string => {
    if (data.customText) return data.customText;

    const patientName = cleanTextForPDF(data.patientName);
    const patientDoc = data.patientDoc ? cleanTextForPDF(data.patientDoc) : '________________';

    const days = data.daysOff ? data.daysOff.toString() : '0';
    const daysInt = parseInt(days);
    const daysExt = numberToText(daysInt);
    const dayLabel = daysInt === 1 ? 'dia' : 'dias';

    switch (data.type) {
        case 'afastamento':
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, foi atendido(a) nesta data e necessita de ${days} (${daysExt}) ${dayLabel} de afastamento de suas atividades laborais/escolares a partir desta data, por motivo de doença.`;
        case 'comparecimento':
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, compareceu a este serviço para atendimento médico/exames nesta data, no período das ${data.startTime || '____'} às ${data.endTime || '____'} horas.`;
        case 'acompanhamento':
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, compareceu a este serviço nesta data, como acompanhante de paciente sob meus cuidados.`;
        case 'aptidao':
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, foi examinado(a) por mim nesta data e encontra-se APTO(A) para a prática de atividades físicas.`;
        case 'laudo':
            return ''; // Laudo always uses customText, so if fallback here, return empty or default
        default:
            return '';
    }
};

export const generateCertificatePDF = (data: CertificateData): Blob => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    let yPos = 20;

    // ===== HEADER =====
    // Background header bar
    doc.setFillColor(245, 245, 245); // Gray-100/Light Gray
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Bottom border of header
    doc.setDrawColor(0, 0, 0); // Black
    doc.setLineWidth(1);
    doc.line(0, 40, pageWidth, 40);

    yPos = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Black
    doc.text("ATESTADO MÉDICO", centerX, yPos, { align: "center" });

    // Subtitle
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("VitaView AI Health Platform", centerX, yPos, { align: "center" });

    // ===== CONTENT =====
    yPos = 80;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const text = generateCertificateText(data);

    // Paragraph text
    const splitText = doc.splitTextToSize(text, contentWidth);
    doc.text(splitText, margin, yPos, { align: "justify", maxWidth: contentWidth });

    yPos += (splitText.length * 7) + 20;

    // CID if present
    if (data.cid) {
        doc.setFont("helvetica", "bold");
        doc.text(`CID: ${cleanTextForPDF(data.cid)}`, margin, yPos);
        yPos += 20;
    }

    // Verify if there is space for signature, otherwise add new page
    // A simple heuristic: if yPos > 240, add new page
    if (yPos > 230) {
        doc.addPage();
        yPos = 40;
    }

    // ===== CID AUTHORIZATION (If CID is present) =====
    if (data.cid) {
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);

        const authText = `Eu, ${cleanTextForPDF(data.patientName).toUpperCase()}, autorizo o(a) Dr(a) ${cleanTextForPDF(data.doctorName).toUpperCase()} a registrar o diagnóstico codificado CID10 neste atestado.`;
        const splitAuth = doc.splitTextToSize(authText, contentWidth - 40); // narrower width for emphasis
        doc.text(splitAuth, centerX, yPos, { align: "center", maxWidth: contentWidth - 40 });

        yPos += (splitAuth.length * 5) + 15;

        // Patient Signature Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(80, 80, 80);
        doc.line(centerX - 40, yPos, centerX + 40, yPos);

        doc.setFontSize(8);
        doc.text("Assinatura do Paciente", centerX, yPos + 4, { align: "center" });

        yPos += 20;
    }

    // ===== DOCTOR SIGNATURE =====
    // Ensure doctor signature is at the bottom or after content
    const signatureY = Math.max(yPos + 10, 250);

    // Check if we need a new page for doctor signature
    if (signatureY > 270) {
        doc.addPage();
        // yPos = 40; // Not needed as we use absolute Y for signature at bottom usually, but here we might just place it at top of new page
        // Let's just place it at standard position on new page or relative
        // simpler: just draw at 250 on new page
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(centerX - 40, 250, centerX + 40, 250);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(cleanTextForPDF(data.doctorName), centerX, 250 + 6, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`CRM: ${cleanTextForPDF(data.doctorCrm)}`, centerX, 250 + 11, { align: "center" });

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Assinatura e Carimbo", centerX, 250 + 16, { align: "center" });
    } else {
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(centerX - 40, signatureY, centerX + 40, signatureY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(cleanTextForPDF(data.doctorName), centerX, signatureY + 6, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`CRM: ${cleanTextForPDF(data.doctorCrm)}`, centerX, signatureY + 11, { align: "center" });

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Assinatura e Carimbo", centerX, signatureY + 16, { align: "center" });
    }

    // Return blob
    return doc.output("blob");
};
