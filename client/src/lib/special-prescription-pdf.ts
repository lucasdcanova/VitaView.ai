import jsPDF from "jspdf";
import { PRESCRIPTION_TYPES, PrescriptionTypeKey } from "@/constants/special-prescription-types";

interface SpecialPrescriptionData {
    selectedType: PrescriptionTypeKey;
    patientName: string;
    doctorName: string;
    doctorCrm: string;
    prescriptionItem: {
        name?: string;
        dosage?: string;
        frequency?: string;
        quantity?: string;
        notes?: string;
    };
}

export function generateSpecialPrescriptionPDF({
    selectedType,
    patientName,
    doctorName,
    doctorCrm,
    prescriptionItem
}: SpecialPrescriptionData) {
    const selectedTypeInfo = PRESCRIPTION_TYPES[selectedType];

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5" // A5 para receituário especial
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = 15;

    // Cor de fundo do tipo de receita
    doc.setFillColor(selectedTypeInfo.color);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Título do receituário
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`RECEITUÁRIO ${selectedTypeInfo.name.toUpperCase()}`, pageWidth / 2, 12, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(selectedTypeInfo.description, pageWidth / 2, 18, { align: "center" });
    doc.text(`Validade: ${selectedTypeInfo.validity}`, pageWidth / 2, 22, { align: "center" });

    y = 35;

    // Dados do médico
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO EMITENTE", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nome: ${doctorName || "Profissional"}`, margin, y);
    y += 4;
    doc.text(`CRM: ${doctorCrm || "___________"}`, margin, y);
    y += 4;
    doc.text(`Endereço: ___________________________________`, margin, y);
    y += 4;
    doc.text(`Cidade/UF: _____________ Tel: ______________`, margin, y);
    y += 8;

    // Dados do paciente
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO PACIENTE", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${patientName}`, margin, y);
    y += 4;
    doc.text(`Endereço: ___________________________________`, margin, y);
    y += 4;
    doc.text(`Cidade/UF: _____________`, margin, y);
    y += 8;

    // Prescrição
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIÇÃO", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const prescText = `${prescriptionItem.name} - ${prescriptionItem.dosage}`;
    doc.text(prescText, margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.text(`Quantidade: ${prescriptionItem.quantity}`, margin, y);
    y += 4;
    doc.text(`Posologia: ${prescriptionItem.frequency}`, margin, y);
    y += 4;

    if (prescriptionItem.notes) {
        doc.text(`Obs: ${prescriptionItem.notes}`, margin, y);
        y += 4;
    }

    y += 10;

    // Data e assinatura
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    doc.text(`Data: ${dateStr}`, margin, y);
    y += 15;

    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
    doc.setFontSize(8);
    doc.text("Assinatura e Carimbo do Prescritor", pageWidth / 2, y, { align: "center" });

    // Aviso legal
    y += 10;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Este documento deve ser preenchido manualmente pelo profissional de saúde.", pageWidth / 2, y, { align: "center" });
    y += 3;
    doc.text("Modelo para controle interno - A receita física oficial deve ser emitida em formulário apropriado.", pageWidth / 2, y, { align: "center" });

    // Abrir PDF
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
}
