
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LegalReportData {
    patientName: string;
    patientDoc?: string;
    patientBirth?: string;
    reportDate: Date;
    generatedBy: string;
    items: LegalReportItem[];
}

export interface LegalReportItem {
    date: Date;
    type: string;
    description: string;
    details?: string;
}

export const generateLegalReportPDF = (data: LegalReportData) => {
    const doc = new jsPDF();

    // -- Header --
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Relatório de Histórico de Saúde", 105, 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Patient Info Block (Left)
    let yPos = 25;
    doc.text(`Paciente: ${data.patientName}`, 14, yPos);
    yPos += 5;
    if (data.patientDoc) {
        doc.text(`CPF/RG: ${data.patientDoc}`, 14, yPos);
        yPos += 5;
    }
    if (data.patientBirth) {
        doc.text(`Nascimento: ${data.patientBirth}`, 14, yPos);
    }

    // Report Info Block (Right)
    yPos = 25;
    const rightColX = 140;
    doc.text(`Data Emissão: ${format(data.reportDate, "dd/MM/yyyy HH:mm")}`, rightColX, yPos);
    yPos += 5;
    doc.text(`Emitido por: ${data.generatedBy}`, rightColX, yPos);

    // -- Content Table --
    // Prepare headers and body
    const tableHead = [["Data", "Evento", "Descrição / Detalhes"]];
    const tableBody = data.items
        .sort((a, b) => b.date.getTime() - a.date.getTime()) // Chronological descending (newest first)
        .map(item => [
            format(item.date, "dd/MM/yyyy"),
            item.type,
            `${item.description}${item.details ? `\n${item.details}` : ''}`
        ]);

    autoTable(doc, {
        startY: 40,
        head: tableHead,
        body: tableBody,
        theme: 'plain', // Neutral, no colorful stripes
        styles: {
            fontSize: 8,
            cellPadding: 2,
            font: 'helvetica',
            textColor: 0, // Black
            lineColor: 200, // Light gray lines
            lineWidth: 0.1,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: 240, // Very light gray header
            textColor: 0,
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: 200
        },
        columnStyles: {
            0: { cellWidth: 25 }, // Date
            1: { cellWidth: 35 }, // Type
            2: { cellWidth: 'auto' } // Description
        },
        didDrawPage: (data) => {
            // Footer page number
            doc.setFontSize(8);
            doc.text(
                `Página ${data.pageNumber}`,
                doc.internal.pageSize.width - 20,
                doc.internal.pageSize.height - 10
            );

            // Neutral Footer
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text(
                "Documento gerado eletronicamente. Sua validade legal depende da assinatura digital ou verificação de autenticidade, se aplicável.",
                14,
                doc.internal.pageSize.height - 10
            );
        }
    });

    return doc;
};
