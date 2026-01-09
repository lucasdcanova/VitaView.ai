import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PrescriptionData {
    doctorName: string;
    doctorCrm: string;
    doctorSpecialty?: string;
    patientName: string;
    issueDate: Date;
    validUntil?: Date;
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        format?: string;
        notes?: string;
        dosageUnit?: string;
    }[];
    observations?: string;
}

export const generatePrescriptionPDF = (data: PrescriptionData) => {
    const doc = new jsPDF();

    // Check for controlled medications
    const controlledMeds = [
        'rivotril', 'clonazepam', 'alprazolam', 'diazepam', 'lorazepam', 'bromazepam',
        'zolpidem', 'ritalina', 'metilfenidato', 'concerta', 'venvanse', 'lisdexanfetamina',
        'morfina', 'codeina', 'tramadol', 'oxicodona', 'fentanil',
        'fluoxetina', 'sertralina', 'escitalopram', 'paroxetina', 'venlafaxina',
        'amitriptilina', 'nortriptilina', 'imipramina',
        'quetiapina', 'olanzapina', 'risperidona', 'aripiprazol',
        'carbonato de lítio', 'lítio', 'ácido valproico', 'valproato'
    ];

    const hasControlled = data.medications.some(med =>
        controlledMeds.some(c => med.name.toLowerCase().includes(c))
    );

    const primaryColor = hasControlled ? [220, 38, 38] : [37, 99, 235]; // Red or Blue
    const lightColor = hasControlled ? [254, 226, 226] : [239, 246, 255]; // Light Red or Light Blue

    // Header
    doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(hasControlled ? "RECEITUÁRIO CONTROLADO" : "RECEITUÁRIO MÉDICO", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("VitaView AI Health Platform", 105, 30, { align: "center" });

    let yPos = 50;

    // Doctor Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Dr(a). " + data.doctorName, 20, yPos);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 20, yPos + 5);
    if (data.doctorSpecialty) {
        doc.text(`Especialidade: ${data.doctorSpecialty}`, 20, yPos + 10);
    }

    doc.line(20, yPos + 15, 190, yPos + 15);
    yPos += 25;

    // Patient Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, 45, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Data:", 140, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.issueDate.toLocaleDateString('pt-BR'), 155, yPos);

    yPos += 15;

    // Controlled Warning
    if (hasControlled) {
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(220, 38, 38);
        doc.roundedRect(20, yPos, 170, 15, 1, 1, "FD");

        doc.setTextColor(185, 28, 28);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("⚠️ ATENÇÃO - MEDICAMENTO(S) DE CONTROLE ESPECIAL", 105, yPos + 6, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text("Dispensação sob retenção de receita.", 105, yPos + 11, { align: "center" });

        yPos += 25;
    }

    // Medications Table
    const tableBody = data.medications.map((med, index) => [
        `${index + 1}`,
        med.name,
        `${med.dosage || ''}`,
        med.frequency,
        med.notes || ''
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Medicamento', 'Dose/Conc.', 'Posologia', 'Observações']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor as any,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 4,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 60, fontStyle: 'bold' },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 'auto' }
        }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    // Observations
    if (data.observations) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Observações Clínicas:", 20, yPos);

        yPos += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const splitText = doc.splitTextToSize(data.observations, 170);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 5 + 10;
    }

    // Footer / Signature
    yPos = Math.max(yPos, 240); // Push to bottom if content is short

    // Signature Line
    doc.setDrawColor(0, 0, 0);
    doc.line(65, yPos, 145, yPos);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, yPos + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, yPos + 10, { align: "center" });
    doc.text("Assinatura do Prescritor", 105, yPos + 15, { align: "center" });

    // Validity
    if (data.validUntil) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Validade desta prescrição: ${data.validUntil.toLocaleDateString('pt-BR')}`, 20, 280);
    }

    doc.save(`Receita_${data.patientName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};
