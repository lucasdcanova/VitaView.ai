import { CID10_DATABASE } from "@shared/data/cid10-database";

// List of common controlled medications in Brazil (can be expanded)
export const CONTROLLED_MEDICATIONS = [
    'rivotril', 'clonazepam', 'alprazolam', 'diazepam', 'lorazepam', 'bromazepam',
    'zolpidem', 'ritalina', 'metilfenidato', 'concerta', 'venvanse', 'lisdexanfetamina',
    'morfina', 'codeina', 'tramadol', 'oxicodona', 'fentanil',
    'fluoxetina', 'sertralina', 'escitalopram', 'paroxetina', 'venlafaxina',
    'amitriptilina', 'nortriptilina', 'imipramina',
    'quetiapina', 'olanzapina', 'risperidona', 'aripiprazol',
    'carbonato de lítio', 'lítio', 'ácido valproico', 'valproato'
];

export function isControlledMedication(medicationName: string): boolean {
    const nameLower = medicationName.toLowerCase();
    return CONTROLLED_MEDICATIONS.some(controlled => nameLower.includes(controlled));
}

export function generateCertificateHTML({ type, doctorName, doctorCrm, patientName, patientDoc, issueDate, daysOff, startTime, endTime, cid, customText }: any) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const dateStr = formatDate(issueDate || new Date());

    let text = "";
    if (customText) {
        text = customText;
    } else {
        switch (type) {
            case 'afastamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc || '________________'}, foi atendido(a) nesta data e necessita de ${daysOff || '0'} (${daysOff === '1' ? 'um' : ''}) dia(s) de afastamento de suas atividades laborais/escolares a partir desta data, por motivo de doença.`;
                break;
            case 'comparecimento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc || '________________'}, compareceu a este serviço para atendimento médico/exames nesta data, no período das ${startTime || '____'} às ${endTime || '____'} horas.`;
                break;
            case 'acompanhamento':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc || '________________'}, compareceu a este serviço nesta data, como acompanhante de paciente sob meus cuidados.`;
                break;
            case 'aptidao':
                text = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc || '________________'}, foi examinado(a) por mim nesta data e encontra-se APTO(A) para a prática de atividades físicas.`;
                break;
        }
    }

    if (cid) {
        text += `<br><br><strong>CID: ${cid}</strong>`;
    }

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Atestado Médico</title>
      <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Arial', sans-serif; color: #000; padding: 20mm; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; background-color: #eff6ff; padding: 20px; border-bottom: 2px solid #2563eb; }
        .title { font-size: 24px; font-weight: bold; color: #2563eb; margin: 0; }
        .subtitle { font-size: 10px; color: #666; margin-top: 5px; }
        .content { font-size: 14px; text-align: justify; margin: 40px 20px; min-height: 200px; }
        .location-date { text-align: center; margin-top: 60px; margin-bottom: 60px; }
        .signature { text-align: center; border-top: 1px solid #000; width: 60%; margin: 0 auto; padding-top: 10px; }
        .doctor-name { font-weight: bold; font-size: 14px; }
        .crm { font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">ATESTADO MÉDICO</h1>
        <p class="subtitle">VitaView AI Health Platform</p>
      </div>
      <div class="content">
        ${text.replace(/\n/g, '<br>')}
      </div>
      <div class="location-date">
        São Paulo, ${dateStr}.
      </div>
      <div class="signature">
        <div class="doctor-name">${doctorName}</div>
        <div class="crm">CRM: ${doctorCrm}</div>
        <div style="font-size: 10px; margin-top: 5px;">Assinatura e Carimbo</div>
      </div>
    </body>
    </html>
  `;
}

export function generatePrescriptionHTML({ doctorName, doctorCrm, doctorSpecialty, patientName, medications, observations, issueDate, validUntil }: any) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check if any medication is controlled
    const hasControlled = medications.some((med: any) => isControlledMedication(med.name));
    const prescriptionType = hasControlled ? 'CONTROLADA' : 'COMUM';

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receituário Médico - ${prescriptionType}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          color: #000;
          line-height: 1.5;
          padding: 20mm;
          background: white;
        }
        
        .prescription-container {
          max-width: 170mm;
          margin: 0 auto;
          background: white;
        }
        
        /* Header Styles */
        .header {
          text-align: center;
          border: 2px solid ${hasControlled ? '#dc2626' : '#2563eb'};
          padding: 15px;
          margin-bottom: 20px;
          background: ${hasControlled ? '#fee2e2' : '#eff6ff'};
        }
        
        .prescription-type {
          font-size: 20px;
          font-weight: bold;
          color: ${hasControlled ? '#dc2626' : '#2563eb'};
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        
        .header h1 {
          font-size: 16px;
          color: #1f2937;
          margin: 5px 0;
        }
        
        /* Doctor Info */
        .doctor-info {
          border: 1px solid #d1d5db;
          padding: 12px;
          margin-bottom: 15px;
          background: #f9fafb;
        }
        
        .doctor-info h2 {
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 5px;
        }
        
        .doctor-details {
          font-size: 12px;
          line-height: 1.6;
        }
        
        .doctor-details strong {
          color: #1f2937;
        }
        
        /* Patient Info */
        .patient-info {
          border: 1px solid #d1d5db;
          padding: 12px;
          margin-bottom: 20px;
          background: #ffffff;
        }
        
        .patient-info h2 {
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 5px;
        }
        
        .patient-details {
          font-size: 12px;
        }
        
        /* Medications Section */
        .medications-section {
          margin-bottom: 20px;
        }
        
        .medications-section h2 {
          font-size: 14px;
          color: #1f2937;
          margin-bottom: 12px;
          padding: 8px;
          background: ${hasControlled ? '#fee2e2' : '#eff6ff'};
          border-left: 4px solid ${hasControlled ? '#dc2626' : '#2563eb'};
        }
        
        .medication-item {
          margin-bottom: 15px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-left: 3px solid ${hasControlled ? '#dc2626' : '#2563eb'};
          background: white;
          page-break-inside: avoid;
        }
        
        .medication-number {
          display: inline-block;
          width: 25px;
          height: 25px;
          background: ${hasControlled ? '#dc2626' : '#2563eb'};
          color: white;
          text-align: center;
          line-height: 25px;
          border-radius: 50%;
          font-weight: bold;
          font-size: 12px;
          margin-right: 8px;
        }
        
        .medication-name {
          font-size: 14px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 6px;
        }
        
        .medication-controlled-badge {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: bold;
          margin-left: 8px;
          text-transform: uppercase;
        }
        
        .medication-details {
          font-size: 12px;
          color: #4b5563;
          line-height: 1.7;
          margin-left: 33px;
        }
        
        .medication-details div {
          margin-bottom: 3px;
        }
        
        .medication-details strong {
          color: #1f2937;
          font-weight: 600;
        }
        
        /* Observations */
        .observations {
          margin-bottom: 20px;
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 4px;
        }
        
        .observations h3 {
          font-size: 12px;
          color: #92400e;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        .observations p {
          font-size: 11px;
          color: #78350f;
          line-height: 1.6;
        }
        
        /* Legal Disclaimer for Controlled */
        .controlled-warning {
          background: #fee2e2;
          border: 2px solid #dc2626;
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .controlled-warning h3 {
          font-size: 12px;
          color: #991b1b;
          margin-bottom: 6px;
          font-weight: bold;
        }
        
        .controlled-warning p {
          font-size: 10px;
          color: #7f1d1d;
          line-height: 1.5;
        }
        
        /* Validity Info */
        .validity-info {
          margin-bottom: 25px;
          padding: 10px;
          background: #f3f4f6;
          border-left: 3px solid #6b7280;
          font-size: 11px;
        }
        
        /* Signature Area */
        .signature-area {
          margin-top: 40px;
          page-break-inside: avoid;
        }
        
        .signature-line {
          width: 300px;
          margin: 0 auto 8px auto;
          border-top: 1px solid #000;
          padding-top: 5px;
          text-align: center;
        }
        
        .signature-text {
          font-size: 11px;
          text-align: center;
          color: #4b5563;
          line-height: 1.6;
        }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #d1d5db;
          text-align: center;
          font-size: 9px;
          color: #6b7280;
        }
        
        /* Print Styles */
        @media print {
          body {
            padding: 15mm;
          }
          
          .prescription-container {
            max-width: 100%;
          }
          
          .medication-item {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="prescription-container">
        <!-- Header -->
        <div class="header">
          <div class="prescription-type">Receituário ${prescriptionType}</div>
          <h1>Prescrição Médica</h1>
        </div>
        
        <!-- Doctor Information -->
        <div class="doctor-info">
          <h2>Dados do Médico Prescritor</h2>
          <div class="doctor-details">
            <div><strong>Nome:</strong> ${doctorName}</div>
            <div><strong>CRM:</strong> ${doctorCrm}</div>
            ${doctorSpecialty ? `<div><strong>Especialidade:</strong> ${doctorSpecialty}</div>` : ''}
          </div>
        </div>
        
        <!-- Patient Information -->
        <div class="patient-info">
          <h2>Dados do Paciente</h2>
          <div class="patient-details">
            <div><strong>Nome:</strong> ${patientName}</div>
            <div><strong>Data da Prescrição:</strong> ${formatDateTime(issueDate)}</div>
          </div>
        </div>
        
        ${hasControlled ? `
          <!-- Controlled Medication Warning -->
          <div class="controlled-warning">
            <h3>⚠️ ATENÇÃO - MEDICAMENTO(S) CONTROLADO(S)</h3>
            <p>
              Esta receita contém medicamento(s) sujeito(s) a controle especial conforme Portaria SVS/MS nº 344/1998.
              A dispensação deve ser realizada mediante apresentação e retenção desta receita.
              Válida em todo território nacional.
            </p>
          </div>
        ` : ''}
        
        <!-- Medications List -->
        <div class="medications-section">
          <h2>Medicamentos Prescritos</h2>
          ${medications.map((med: any, index: number) => {
        const isControlled = isControlledMedication(med.name);
        return `
              <div class="medication-item">
                <div class="medication-name">
                  <span class="medication-number">${index + 1}</span>
                  ${med.name}
                  ${isControlled ? '<span class="medication-controlled-badge">Controlado</span>' : ''}
                </div>
                <div class="medication-details">
                  ${med.format ? `<div><strong>Forma Farmacêutica:</strong> ${med.format}</div>` : ''}
                  <div><strong>Dosagem:</strong> ${med.dosage || 'Conforme orientação'}${med.dosageUnit ? ` ${med.dosageUnit}` : ''}</div>
                  <div><strong>Posologia:</strong> ${med.frequency || 'Conforme orientação médica'}</div>
                  ${med.notes ? `<div><strong>Observações:</strong> ${med.notes}</div>` : ''}
                </div>
              </div>
            `;
    }).join('')}
        </div>
        
        ${observations ? `
          <!-- Observations -->
          <div class="observations">
            <h3>Observações Gerais</h3>
            <p>${observations}</p>
          </div>
        ` : ''}
        
        <!-- Validity Information -->
        <div class="validity-info">
          <strong>Validade da Prescrição:</strong> ${formatDate(validUntil)}
          ${hasControlled ? ' • Receita de medicamento controlado válida por 30 dias' : ''}
        </div>
        
        <!-- Signature Area -->
        <div class="signature-area">
          <div class="signature-line">
            <div class="signature-text">
              <strong>${doctorName}</strong><br>
              CRM: ${doctorCrm}${doctorSpecialty ? ` - ${doctorSpecialty}` : ''}
            </div>
          </div>
          <div class="signature-text">
            Assinatura e Carimbo do Médico
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Documento gerado eletronicamente por VitaView AI em ${formatDateTime(issueDate)}</p>
          <p>Esta prescrição deve ser validada e assinada pelo médico responsável</p>
          ${hasControlled ? '<p><strong>ATENÇÃO:</strong> Medicamento de uso controlado - Venda sob prescrição médica - Retenção de receita</p>' : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função para gerar HTML do relatório de saúde
export function generateExamReportHTML({ user, exam, metrics }: any) {
    const formatDate = (dateString: string) => {
        return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'Não informado';
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'normal': return '#10b981';
            case 'atenção': case 'atencao': return '#f59e0b';
            case 'alto': case 'crítico': case 'critico': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Exame - ${exam.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 16px; color: #374151; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #2563eb; padding-bottom: 16px; }
        .logo { font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .title { font-size: 16px; color: #1f2937; margin: 8px 0; }
        .patient-info { background: #f8fafc; padding: 16px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .patient-info h3 { margin: 0 0 12px 0; font-size: 14px; color: #1f2937; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { margin-bottom: 6px; }
        .info-label { font-weight: 600; color: #4b5563; }
        .info-value { color: #1f2937; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: 700; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
        .content-box { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
        .summary-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 12px; margin: 12px 0; border-radius: 4px; }
        .analysis-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 12px; margin: 12px 0; border-radius: 4px; }
        .recommendations-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 12px 0; border-radius: 4px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 12px 0; }
        .metric-item { background: white; border: 1px solid #e5e7eb; padding: 8px; border-radius: 4px; }
        .metric-name { font-weight: 600; font-size: 11px; color: #374151; }
        .metric-value { font-size: 13px; font-weight: 700; margin: 2px 0; }
        .metric-unit { font-size: 10px; color: #6b7280; }
        .metric-status { display: inline-block; padding: 2px 6px; border-radius: 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; color: white; margin-top: 4px; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #6b7280; }
        .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VitaView.ai</div>
        <div class="title">Relatório de Análise de Exame</div>
      </div>

      <div class="patient-info">
        <h3>Informações do Exame</h3>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Paciente:</span> <span class="info-value">${user.fullName || user.username}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nome do Exame:</span> <span class="info-value">${exam.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data do Exame:</span> <span class="info-value">${formatDate(exam.exam_date)}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Laboratório:</span> <span class="info-value">${exam.laboratory_name || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Médico Solicitante:</span> <span class="info-value">${exam.requesting_physician || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data da Análise:</span> <span class="info-value">${formatDate(exam.analysis_date)}</span>
            </div>
          </div>
        </div>
        <div style="margin-top: 12px;">
          <span class="info-label">Relatório gerado em:</span> <span class="info-value">${formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      ${exam.summary ? `
      <div class="section">
        <div class="section-title">📋 Resumo Executivo</div>
        <div class="summary-box">
          ${exam.summary}
        </div>
      </div>
      ` : ''}

      ${metrics && metrics.length > 0 ? `
      <div class="section">
        <div class="section-title">📊 Métricas de Saúde</div>
        <div class="metrics-grid">
          ${metrics.map((metric: any) => `
            <div class="metric-item">
              <div class="metric-name">${metric.name}</div>
              <div class="metric-value" style="color: ${getStatusColor(metric.status)}">${metric.value} ${metric.unit || ''}</div>
              <div class="metric-status" style="background-color: ${getStatusColor(metric.status)}">${metric.status || 'N/A'}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${exam.detailed_analysis ? `
      <div class="section">
        <div class="section-title">🔬 Análise Detalhada</div>
        <div class="analysis-box">
          ${exam.detailed_analysis}
        </div>
      </div>
      ` : ''}

      ${exam.recommendations ? `
      <div class="section">
        <div class="section-title">💡 Recomendações</div>
        <div class="recommendations-box">
          ${exam.recommendations}
        </div>
      </div>
      ` : ''}

      <div class="disclaimer">
        <strong>⚠️ Aviso Importante:</strong> Este relatório foi gerado automaticamente pela plataforma VitaView.ai com base na análise de inteligência artificial. As informações contidas neste documento são apenas para fins informativos e não substituem a consulta, diagnóstico ou tratamento médico profissional. Sempre consulte um profissional de saúde qualificado para questões relacionadas à sua saúde.
      </div>

      <div class="footer">
        <p>Este relatório foi gerado pela plataforma VitaView.ai em ${formatDate(new Date().toISOString())}</p>
        <p>Para mais informações, visite nosso site ou entre em contato com nossa equipe de suporte</p>
      </div>
    </body>
    </html>
  `;
}

export function generateHealthReportHTML({ user, exams, diagnoses, medications, metrics, allergies }: any) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "ativo": return "Ativo";
            case "em_tratamento": return "Em Tratamento";
            case "resolvido": return "Resolvido";
            case "cronico": return "Crônico";
            default: return status;
        }
    };

    const getCIDDescription = (cidCode: string): string => {
        const cidEntry = CID10_DATABASE.find(item => item.code === cidCode);
        return cidEntry ? `${cidCode} - ${cidEntry.description}` : cidCode;
    };

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Saúde - ${user.fullName || user.username}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; margin: 0; padding: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 12px; border-bottom: 1px solid #1E3A5F; padding-bottom: 8px; }
        .logo { font-size: 14px; font-weight: bold; color: #1E3A5F; }
        .patient-info { background: #f8f9fa; padding: 8px; margin-bottom: 12px; border-radius: 3px; }
        .patient-info h3 { margin: 0 0 6px 0; font-size: 12px; color: #1E3A5F; }
        .patient-info p { margin: 2px 0; font-size: 10px; }
        .section { margin-bottom: 12px; }
        .section-title { font-size: 12px; font-weight: bold; color: #1E3A5F; border-bottom: 1px solid #48C9B0; padding-bottom: 3px; margin-bottom: 8px; }
        .item { padding: 6px; margin-bottom: 4px; border: 1px solid #e0e0e0; border-radius: 2px; }
        .item-title { font-weight: bold; color: #1E3A5F; font-size: 11px; }
        .item-date { color: #666; font-size: 9px; margin: 2px 0; }
        .item-details { font-size: 10px; margin: 2px 0; }
        .status { padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; }
        .status-ativo { background: #fee; color: #c53030; }
        .status-em_tratamento { background: #fff5e6; color: #d69e2e; }
        .status-resolvido { background: #f0fff4; color: #38a169; }
        .status-cronico { background: #ebf8ff; color: #3182ce; }
        .footer { margin-top: 15px; padding-top: 8px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 8px; color: #666; }
        .compact-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .compact-item { flex: 1; min-width: 45%; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VitaView AI - Relatório de Saúde</div>
      </div>

      <div class="patient-info">
        <h3>Paciente: ${user.fullName || user.username}</h3>
        <p>Relatório gerado em: ${formatDate(new Date().toISOString())}</p>
      </div>

      ${diagnoses.length > 0 ? `
      <div class="section">
        <div class="section-title">Diagnósticos</div>
        <div class="compact-grid">
          ${diagnoses.map((diag: any) => `
            <div class="item compact-item">
              <div class="item-title">${getCIDDescription(diag.cid_code)}</div>
              <div class="item-date">${formatDate(diag.diagnosis_date)}</div>
              ${diag.status ? `<span class="status status-${diag.status}">${getStatusLabel(diag.status)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${medications.length > 0 ? `
      <div class="section">
        <div class="section-title">Medicamentos</div>
        ${medications.map((med: any) => `
          <div class="item">
            <div class="item-title">${med.name}</div>
            <div class="item-details">${med.dosage} • ${med.frequency} • Desde ${formatDate(med.start_date)}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${allergies && allergies.length > 0 ? `
      <div class="section">
        <div class="section-title">Alergias</div>
        <div class="compact-grid">
          ${allergies.map((allergy: any) => `
            <div class="item compact-item">
              <div class="item-title">${allergy.allergen}</div>
              ${allergy.reaction ? `<div class="item-details">${allergy.reaction}</div>` : ''}
              ${allergy.severity ? `<div class="item-details">Severidade: ${allergy.severity}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : `
      <div class="section">
        <div class="section-title">Alergias</div>
        <div class="item" style="text-align: center; color: #666;">Sem alergias registradas</div>
      </div>
      `}

      <div class="footer">
        <p>VitaView AI • ${formatDate(new Date().toISOString())} • Para uso médico</p>
      </div>
    </body>
    </html>
  `;
}
