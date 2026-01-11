import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface CertificateData {
    type: 'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao';
    doctorName: string;
    doctorCrm: string;
    patientName: string;
    patientDoc?: string; // RG ou CPF opcional
    issueDate: Date;
    daysOff?: string; // Para afastamento
    cid?: string;
    startTime?: string; // Para comparecimento
    endTime?: string; // Para comparecimento
    customText?: string;
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

export const generateCertificatePDF = (data: CertificateData) => {
    const doc = new jsPDF();
    const primaryColor = [37, 99, 235]; // Blue

    // Header
    doc.setFillColor(240, 244, 255);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("ATESTADO MÉDICO", 105, 22, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("VitaView AI Health Platform", 105, 32, { align: "center" });

    let yPos = 70;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    // doc.text("ATESTADO", 105, yPos, { align: "center" });
    yPos += 20;

    // Text Body
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.setLineHeightFactor(1.5);

    let text = "";

    const dateStr = format(data.issueDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    if (data.customText) {
        text = data.customText;
    } else {
        switch (data.type) {
            case 'afastamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}, portador(a) do documento nº ${data.patientDoc || '________________'}, foi atendido(a) nesta data e necessita de ${data.daysOff || '0'} (${data.daysOff === '1' ? 'um' : ''}) dia(s) de afastamento de suas atividades laborais/escolares a partir desta data, por motivo de doença.`;
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
        }
    }

    if (data.cid) {
        text += `\n\nCID: ${data.cid}`;
    }

    const splitText = doc.splitTextToSize(text, 160);
    doc.text(splitText, 25, yPos, { align: "justify", maxWidth: 160 });

    yPos += 80;

    // Location and Date
    doc.setFont("helvetica", "normal");
    doc.text(`São Paulo, ${dateStr}.`, 105, yPos, { align: "center" });

    yPos += 50;

    // Signature
    doc.setDrawColor(0, 0, 0);
    doc.line(65, yPos, 145, yPos);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(data.doctorName, 105, yPos + 5, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CRM: ${data.doctorCrm}`, 105, yPos + 10, { align: "center" });
    doc.text("Assinatura e Carimbo", 105, yPos + 15, { align: "center" });

    doc.save(`Atestado_${data.type}_${data.patientName.replace(/\s+/g, '_')}.pdf`);
};
