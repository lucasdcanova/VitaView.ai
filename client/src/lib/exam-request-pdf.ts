import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExamRequestData {
    // Dados do Médico
    doctorName: string;
    doctorCrm: string;
    doctorSpecialty?: string;
    doctorRqe?: string;
    clinicName?: string;
    clinicAddress?: string;
    clinicPhone?: string;
    // Dados do Paciente
    patientName: string;
    patientCpf?: string;
    patientBirthDate?: string;
    patientAge?: string;
    patientGender?: string;
    patientAddress?: string;
    patientPhone?: string;
    patientInsurance?: string;
    // Dados da Solicitação
    issueDate: Date;
    exams: {
        name: string;
        type: 'laboratorial' | 'imagem' | 'outros';
        notes?: string;
    }[];
    clinicalIndication?: string;
    observations?: string;
}

// Desenha o logo VitaView de forma minimalista
const drawLogo = (doc: jsPDF, x: number, y: number) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("VitaView.AI", x, y);
};

// Gera PDF de Solicitação de Exames
const generateExamRequestContent = (doc: jsPDF, data: ExamRequestData) => {
    const pageWidth = 210; // A4 Portrait
    const centerX = pageWidth / 2;
    const margin = 20;
    const leftX = margin;
    const rightX = pageWidth - margin;

    let yPos = 20;

    // ===== HEADER =====
    drawLogo(doc, rightX - 15, 15);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("SOLICITAÇÃO DE EXAMES", centerX, yPos, { align: "center" });

    yPos = 35;

    // Linha divisória
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftX, yPos, rightX, yPos);

    yPos = 45;

    // ===== DADOS DO MÉDICO =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, leftX, yPos);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, rightX, yPos, { align: "right" });

    yPos += 6;
    if (data.doctorSpecialty) {
        const specialtyText = data.doctorRqe
            ? `${data.doctorSpecialty} - RQE ${data.doctorRqe}`
            : data.doctorSpecialty;
        doc.text(specialtyText, rightX, yPos, { align: "right" });
    }

    yPos += 15;

    // ===== DADOS DO PACIENTE =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, leftX + 25, yPos);

    // Data no lado direito
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });
    doc.setFont("helvetica", "bold");
    doc.text("Data:", rightX - 35, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, rightX, yPos, { align: "right" });

    yPos += 6;

    // Dados adicionais do paciente
    doc.setFontSize(10);
    let patientInfoLine = "";

    if (data.patientBirthDate) {
        let formattedBirthDate = data.patientBirthDate;
        if (data.patientBirthDate.includes("-")) {
            const [year, month, day] = data.patientBirthDate.split("-");
            formattedBirthDate = `${day}/${month}/${year}`;
        }
        patientInfoLine += `DN: ${formattedBirthDate}`;
    }

    if (data.patientCpf) {
        if (patientInfoLine) patientInfoLine += "    ";
        patientInfoLine += `CPF: ${data.patientCpf}`;
    }

    if (patientInfoLine) {
        doc.text(patientInfoLine, leftX, yPos);
    }

    yPos += 6;

    if (data.patientInsurance) {
        doc.text(`Convênio: ${data.patientInsurance}`, leftX, yPos);
    }

    yPos += 10;

    // Linha divisória
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, rightX, yPos);

    yPos += 10;

    // ===== INDICAÇÃO CLÍNICA =====
    if (data.clinicalIndication) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Indicação Clínica:", leftX, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const indicationLines = doc.splitTextToSize(data.clinicalIndication, pageWidth - margin * 2);
        doc.text(indicationLines, leftX, yPos);
        yPos += indicationLines.length * 5 + 10;
    }

    // ===== EXAMES SOLICITADOS =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Exames Solicitados:", leftX, yPos);
    yPos += 8;

    // Agrupar por tipo
    const laboratoriais = data.exams.filter(e => e.type === 'laboratorial');
    const imagem = data.exams.filter(e => e.type === 'imagem');
    const outros = data.exams.filter(e => e.type === 'outros');

    doc.setFontSize(11);

    // Laboratoriais
    if (laboratoriais.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 100, 0);
        doc.text("Laboratoriais:", leftX, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        laboratoriais.forEach((exam, idx) => {
            doc.text(`${idx + 1}. ${exam.name}`, leftX + 5, yPos);
            if (exam.notes) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "italic");
                yPos += 4;
                doc.text(`   Obs: ${exam.notes}`, leftX + 5, yPos);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
            }
            yPos += 6;
        });
        yPos += 5;
    }

    // Imagem
    if (imagem.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 150);
        doc.text("Imagem:", leftX, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        imagem.forEach((exam, idx) => {
            doc.text(`${idx + 1}. ${exam.name}`, leftX + 5, yPos);
            if (exam.notes) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "italic");
                yPos += 4;
                doc.text(`   Obs: ${exam.notes}`, leftX + 5, yPos);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
            }
            yPos += 6;
        });
        yPos += 5;
    }

    // Outros
    if (outros.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Outros:", leftX, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        outros.forEach((exam, idx) => {
            doc.text(`${idx + 1}. ${exam.name}`, leftX + 5, yPos);
            if (exam.notes) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "italic");
                yPos += 4;
                doc.text(`   Obs: ${exam.notes}`, leftX + 5, yPos);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
            }
            yPos += 6;
        });
    }

    // ===== OBSERVAÇÕES =====
    if (data.observations) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const obsLines = doc.splitTextToSize(`Observações: ${data.observations}`, pageWidth - margin * 2);
        doc.text(obsLines, leftX, yPos);
        yPos += obsLines.length * 5;
    }

    // ===== RODAPÉ =====
    const pageHeight = 297; // A4
    const signatureY = pageHeight - 50;
    const footerY = pageHeight - 20;

    // Assinatura
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    doc.line(centerX - 50, signatureY, centerX + 50, signatureY);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, centerX, signatureY + 6, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, centerX, signatureY + 11, { align: "center" });
    doc.text("Assinatura e Carimbo", centerX, signatureY + 16, { align: "center" });

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Solicitação válida por 30 dias a partir da emissão.", centerX, footerY, { align: "center" });
    // const viaText = xOffset > 0 ? "2ª Via" : "1ª Via";
    // doc.text(viaText, rightX, footerY, { align: "right" });
};

/**
 * Gera PDF de Solicitação de Exames
 * @param data Dados da solicitação
 * @param existingWindow Janela já aberta para evitar bloqueio de popup
 * @returns void (abre em nova aba ou usa janela existente)
 */
export function generateExamRequestPDF(data: ExamRequestData, existingWindow?: Window | null): void {
    // A4 Portrait (210 x 297mm)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // Gerar via única
    generateExamRequestContent(doc, data);

    // Gerar blob com bom suporte cross-browser
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    if (existingWindow) {
        existingWindow.location.href = pdfUrl;
    } else {
        window.open(pdfUrl, "_blank");
    }
}

export type { ExamRequestData };
