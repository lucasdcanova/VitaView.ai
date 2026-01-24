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

    let text = "";

    // Determine text based on type
    if (data.customText) {
        text = data.customText;
    } else {
        const patientName = cleanTextForPDF(data.patientName);
        const patientDoc = data.patientDoc ? cleanTextForPDF(data.patientDoc) : '________________';

        // Helper for days formatting
        const days = data.daysOff ? data.daysOff.toString() : '0';
        const daysExt = days === '1' ? 'um' : '';
        const dayLabel = days === '1' ? 'dia' : 'dias';

        switch (data.type) {
            case 'afastamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, foi atendido(a) nesta data e necessita de ${days} (${daysExt}) ${dayLabel} de afastamento de suas atividades laborais/escolares a partir desta data, por motivo de doença.`;
                break;
            case 'comparecimento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, compareceu a este serviço para atendimento médico/exames nesta data, no período das ${data.startTime || '____'} às ${data.endTime || '____'} horas.`;
                break;
            case 'acompanhamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, compareceu a este serviço nesta data, como acompanhante de paciente sob meus cuidados.`;
                break;
            case 'aptidao':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, foi examinado(a) por mim nesta data e encontra-se APTO(A) para a prática de atividades físicas.`;
                break;
        }
    }

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

    // ===== LOCATION & DATE =====
    yPos = Math.max(yPos, 200); // Ensure it pushes down a bit

    // Format date
    const dateObj = new Date(data.issueDate);
    const dateStr = format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const city = data.city || "São Paulo";
    doc.text(`${city}, ${dateStr}.`, centerX, yPos, { align: "center" });

    // ===== SIGNATURE =====
    const signatureY = 250;

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(centerX - 40, signatureY, centerX + 40, signatureY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(cleanTextForPDF(data.doctorName), centerX, signatureY + 6, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`CRM: ${cleanTextForPDF(data.doctorCrm)}`, centerX, signatureY + 11, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Assinatura e Carimbo", centerX, signatureY + 16, { align: "center" });

    // Return blob
    return doc.output("blob");
};
