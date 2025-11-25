/**
 * Sistema de normalização de nomes de exames médicos
 * 
 * Este módulo implementa uma solução para unificar diferentes variações dos nomes
 * de exames, incluindo diferenças de capitalização, acentuação, abreviações e
 * nomenclaturas alternativas. Isso garante que o sistema trate diferentes representações
 * do mesmo exame como uma única entidade, melhorando a consistência dos dados e
 * possibilitando comparações históricas mais precisas.
 */

// Mapeamento de variações comuns para nomes padronizados
const examNameMap: Record<string, string> = {
  // Hemograma
  'hemacias': 'eritrócitos',
  'hemácias': 'eritrócitos',
  'eritrócitos': 'eritrócitos',
  'eritrocitos': 'eritrócitos',
  'hemoglobina': 'hemoglobina',
  'hgb': 'hemoglobina',
  'hb': 'hemoglobina',
  'hematócrito': 'hematócrito',
  'hematocrito': 'hematócrito',
  'ht': 'hematócrito',
  'htc': 'hematócrito',
  'v.c.m.': 'vcm',
  'vcm': 'vcm',
  'volume corpuscular médio': 'vcm',
  'h.c.m.': 'hcm',
  'hcm': 'hcm',
  'hemoglobina corpuscular média': 'hcm',
  'c.h.c.m.': 'chcm',
  'chcm': 'chcm',
  'concentração de hemoglobina corpuscular média': 'chcm',
  'rdw': 'rdw',
  'r.d.w.': 'rdw',
  'rdw-cv': 'rdw',
  'rdw-sd': 'rdw-sd',
  'amplitude de distribuição dos eritrócitos': 'rdw',

  // Leucograma
  'leucócitos': 'leucócitos',
  'leucocitos': 'leucócitos',
  'wbc': 'leucócitos',
  'leucograma': 'leucócitos',
  'neutrófilos': 'neutrófilos',
  'neutrofilos': 'neutrófilos',
  'segmentados': 'neutrófilos',
  'bastonetes': 'bastonetes',
  'eosinófilos': 'eosinófilos',
  'eosinofilos': 'eosinófilos',
  'basófilos': 'basófilos',
  'basofilos': 'basófilos',
  'linfócitos': 'linfócitos',
  'linfocitos': 'linfócitos',
  'monócitos': 'monócitos',
  'monocitos': 'monócitos',

  // Plaquetas
  'plaquetas': 'plaquetas',
  'plt': 'plaquetas',
  'contagem de plaquetas': 'plaquetas',

  // Glicose
  'glicose': 'glicose',
  'glicemia': 'glicose',
  'glicemia de jejum': 'glicose',
  'glic.': 'glicose',
  'gli': 'glicose',

  // Colesterol
  'colesterol total': 'colesterol total',
  'colesterol': 'colesterol total',
  'col. total': 'colesterol total',
  'col total': 'colesterol total',
  'hdl': 'colesterol hdl',
  'hdl-colesterol': 'colesterol hdl',
  'colesterol hdl': 'colesterol hdl',
  'hdl-c': 'colesterol hdl',
  'ldl': 'colesterol ldl',
  'ldl-colesterol': 'colesterol ldl',
  'colesterol ldl': 'colesterol ldl',
  'ldl-c': 'colesterol ldl',
  'vldl': 'colesterol vldl',
  'vldl-colesterol': 'colesterol vldl',
  'colesterol vldl': 'colesterol vldl',
  'vldl-c': 'colesterol vldl',

  // Triglicerídeos
  'triglicerídeos': 'triglicerídeos',
  'triglicerideos': 'triglicerídeos',
  'triglicérides': 'triglicerídeos',
  'triglicerides': 'triglicerídeos',
  'tg': 'triglicerídeos',

  // Função hepática
  'tgo': 'tgo',
  'ast': 'tgo',
  'aspartato aminotransferase': 'tgo',
  'transaminase glutâmica oxalacética': 'tgo',
  'tgp': 'tgp',
  'alt': 'tgp',
  'alanina aminotransferase': 'tgp',
  'transaminase glutâmica pirúvica': 'tgp',
  'gama gt': 'gama gt',
  'ggt': 'gama gt',
  'gama glutamil transferase': 'gama gt',
  'gama glutamil transpeptidase': 'gama gt',
  'γ-gt': 'gama gt',
  'fosfatase alcalina': 'fosfatase alcalina',
  'fa': 'fosfatase alcalina',
  'fosf alc': 'fosfatase alcalina',
  'bilirubina total': 'bilirubina total',
  'bt': 'bilirubina total',
  'bilirrubina total': 'bilirubina total',
  'bilirubina direta': 'bilirubina direta',
  'bd': 'bilirubina direta',
  'bilirrubina direta': 'bilirubina direta',
  'bilirubina indireta': 'bilirubina indireta',
  'bi': 'bilirubina indireta',
  'bilirrubina indireta': 'bilirubina indireta',

  // Função renal
  'ureia': 'ureia',
  'uréia': 'ureia',
  'ur': 'ureia',
  'bun': 'ureia',
  'nitrogênio ureico': 'ureia',
  'creatinina': 'creatinina',
  'cr': 'creatinina',
  'creat': 'creatinina',
  'clearance de creatinina': 'clearance de creatinina',
  'ácido úrico': 'ácido úrico',
  'acido urico': 'ácido úrico',
  'au': 'ácido úrico',

  // Eletrólitos
  'sódio': 'sódio',
  'sodio': 'sódio',
  'na': 'sódio',
  'na+': 'sódio',
  'potássio': 'potássio',
  'potassio': 'potássio',
  'k': 'potássio',
  'k+': 'potássio',
  'cálcio': 'cálcio',
  'calcio': 'cálcio',
  'ca': 'cálcio',
  'ca++': 'cálcio',
  'fósforo': 'fósforo',
  'fosforo': 'fósforo',
  'p': 'fósforo',
  'magnésio': 'magnésio',
  'magnesio': 'magnésio',
  'mg': 'magnésio',
  'ferro': 'ferro',
  'fe': 'ferro',

  // Proteínas
  'proteínas totais': 'proteínas totais',
  'proteinas totais': 'proteínas totais',
  'prot. totais': 'proteínas totais',
  'pt': 'proteínas totais',
  'albumina': 'albumina',
  'alb': 'albumina',
  'globulina': 'globulina',
  'glob': 'globulina',
  'relação albumina/globulina': 'relação albumina/globulina',
  'rel a/g': 'relação albumina/globulina',

  // Coagulação
  'tempo de protrombina': 'tempo de protrombina',
  'tp': 'tempo de protrombina',
  'tpae': 'tempo de tromboplastina parcial ativada',
  'ttpa': 'tempo de tromboplastina parcial ativada',
  'tempo de tromboplastina parcial ativada': 'tempo de tromboplastina parcial ativada',
  'kttp': 'tempo de tromboplastina parcial ativada',
  'inr': 'inr',
  'razão normalizada internacional': 'inr',

  // Inflamação
  'vhs': 'vhs',
  'hemossedimentação': 'vhs',
  'velocidade de hemossedimentação': 'vhs',
  'pcr': 'proteína c reativa',
  'proteína c reativa': 'proteína c reativa',
  'proteina c reativa': 'proteína c reativa',

  // Hormônios
  'tsh': 'tsh',
  'hormônio estimulante da tireoide': 'tsh',
  't4': 't4',
  't4 livre': 't4 livre',
  't4l': 't4 livre',
  'tiroxina livre': 't4 livre',
  't3': 't3',
  't3 livre': 't3 livre',
  't3l': 't3 livre',
  'insulina': 'insulina',

  // Outros
  'ferritina': 'ferritina',
  'vitamina d': 'vitamina d',
  '25-hidroxivitamina d': 'vitamina d',
  'vitamina b12': 'vitamina b12',
  'acido folico': 'ácido fólico',
  'ácido fólico': 'ácido fólico',
  'b12': 'vitamina b12',
  'hemoglobina glicada': 'hemoglobina glicada',
  'hba1c': 'hemoglobina glicada',
  'a1c': 'hemoglobina glicada',
};

/**
 * Normaliza o nome de um exame para um formato padronizado
 * 
 * @param name Nome do exame para normalizar
 * @returns Nome normalizado
 */
export function normalizeExamName(name: string): string {
  if (!name) return "desconhecido";

  // Converter para minúsculo e remover espaços extras
  const normalized = name.toLowerCase().trim();

  // Verificar no mapeamento
  if (examNameMap[normalized]) {
    const result = examNameMap[normalized];
    return result;
  }

  // Se não estiver no mapeamento, retorna o nome original com primeira letra maiúscula 
  // e resto minúscula para manter consistência
  const result = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return result;
}

/**
 * Normaliza as métricas de saúde em um array, combinando métricas duplicadas
 * 
 * @param metrics Array de métricas para normalizar
 * @returns Array de métricas normalizadas sem duplicatas
 */
export function normalizeHealthMetrics(metrics: any[]): any[] {
  if (!metrics || !Array.isArray(metrics)) return [];

  // Usar um mapa para agrupar métricas por nome normalizado
  const processedMetrics = new Map<string, any>();

  // Normalizar todos os nomes e agrupar métricas idênticas
  for (const metric of metrics) {
    if (!metric || !metric.name) continue;

    const normalizedName = normalizeExamName(metric.name);

    // Parse reference range if available and min/max not already set
    let referenceMin = metric.referenceMin;
    let referenceMax = metric.referenceMax;

    if ((!referenceMin || !referenceMax) && metric.referenceRange) {
      // Try to parse "min - max" or similar patterns
      // Examples: "70 - 99", "70-99", "< 200", "> 60", "Até 150"
      const rangeStr = String(metric.referenceRange).trim();

      // Pattern: "X - Y" or "X to Y"
      const rangeMatch = rangeStr.match(/([\d,.]+)\s*(?:-|a|to)\s*([\d,.]+)/i);
      if (rangeMatch) {
        referenceMin = rangeMatch[1];
        referenceMax = rangeMatch[2];
      } else {
        // Pattern: "< X" or "Até X"
        const maxMatch = rangeStr.match(/(?:<|até|inf\.|inferior a)\s*([\d,.]+)/i);
        if (maxMatch) {
          referenceMin = "0";
          referenceMax = maxMatch[1];
        } else {
          // Pattern: "> X" or "Superior a X"
          const minMatch = rangeStr.match(/(?:>|sup\.|superior a)\s*([\d,.]+)/i);
          if (minMatch) {
            referenceMin = minMatch[1];
            // No explicit max, maybe leave undefined or set a high number?
            // For visualization, we might need a max.
          }
        }
      }
    }

    // Se já temos uma métrica com esse nome normalizado, usamos a mais recente
    // ou a que tem mais informações (assumindo que a ordem indica prioridade)
    if (!processedMetrics.has(normalizedName)) {
      processedMetrics.set(normalizedName, {
        ...metric,
        name: normalizedName,
        referenceMin,
        referenceMax
      });
    }
  }

  // Converter de volta para array
  return Array.from(processedMetrics.values());
}

interface ExamResult {
  category: string;
  name: string;
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  status: 'normal' | 'high' | 'low';
}

const examNormalRanges: Record<string, { min: number; max: number; unit: string; category: string }> = {
  'hemoglobina': { min: 12, max: 16, unit: 'g/dL', category: 'Blood Test' },
  'glicose': { min: 70, max: 100, unit: 'mg/dL', category: 'Blood Test' },
  'colesterol total': { min: 0, max: 200, unit: 'mg/dL', category: 'Blood Test' },
  'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L', category: 'Hormones' },
  't4 livre': { min: 0.8, max: 1.8, unit: 'ng/dL', category: 'Hormones' },
  'triglicerídeos': { min: 0, max: 150, unit: 'mg/dL', category: 'Blood Test' },
  'creatinina': { min: 0.6, max: 1.2, unit: 'mg/dL', category: 'Renal Function' },
  'ureia': { min: 15, max: 40, unit: 'mg/dL', category: 'Renal Function' },
};

/**
 * Normaliza resultados de exames de texto livre para formato estruturado
 * 
 * @param text Texto com resultados de exames
 * @returns Array de resultados normalizados
 */
export function normalizeExamResults(text: string): ExamResult[] {
  if (!text || text.trim() === '') return [];

  const results: ExamResult[] = [];
  const lines = text.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // Tentar diferentes padrões de parsing
    const patterns = [
      /(.+?):\s*([\d,\.]+)\s*(.+)?/,  // Nome: valor unidade
      /(.+?)\s*=\s*([\d,\.]+)\s*(.+)?/, // Nome = valor unidade
      /(.+?)\s*-\s*([\d,\.]+)\s*(.+)?/, // Nome - valor unidade
    ];

    let match = null;
    for (const pattern of patterns) {
      match = line.match(pattern);
      if (match) break;
    }

    if (match) {
      const [, nameRaw, valueRaw, unitRaw = ''] = match;
      const name = normalizeExamName(nameRaw.trim());
      const value = parseFloat(valueRaw.replace(',', '.'));
      const unit = unitRaw.trim() || 'units';

      if (!isNaN(value)) {
        const rangeInfo = examNormalRanges[name.toLowerCase()] || {
          min: 0,
          max: Infinity,
          unit: unit,
          category: 'Other'
        };

        let status: 'normal' | 'high' | 'low' = 'normal';
        if (value < rangeInfo.min) status = 'low';
        else if (value > rangeInfo.max) status = 'high';

        results.push({
          category: rangeInfo.category,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          unit: rangeInfo.unit || unit,
          normalRange: { min: rangeInfo.min, max: rangeInfo.max },
          status
        });
      }
    }
  }

  return results;
}

/**
 * Formata o nome da métrica para exibição, corrigindo capitalização e siglas
 * 
 * @param name Nome da métrica para formatar
 * @returns Nome formatado com capitalização correta
 */
export function formatMetricDisplayName(name: string): string {
  if (!name) return "Desconhecido";

  // Remover underscores e substituir por espaços
  let formatted = name.replace(/_/g, ' ');

  // Lista de siglas que devem ser todas maiúsculas
  const acronyms = [
    'vcm', 'hcm', 'chcm', 'rdw', 'tsh', 't3', 't4', 'ldl', 'hdl', 'vhs',
    'pcr', 'inr', 'ige', 'igg', 'iga', 'igm', 'hbsag', 'anti-hbs', 'psa',
    'ca', 'cea', 'afp', 'beta-hcg', 'ck', 'ck-mb', 'ldh', 'ggt', 'ast',
    'alt', 'tgo', 'tgp', 'fa', 'dhl', 'cpk', 'pt', 'ttpa', 'tp', 'ttp',
    'ch50', 'c3', 'c4', 'dna', 'rna', 'hla', 'ana', 'anca', 'hiv', 'hcv',
    'hbv', 'cmv', 'ebv', 'hsv', 'vzv', 'toxo', 'rubéola', 'citomegalovírus'
  ];

  // Dividir em palavras
  const words = formatted.toLowerCase().split(/\s+/);

  // Formatar cada palavra
  const formattedWords = words.map(word => {
    const cleanWord = word.trim();

    // Se for uma sigla conhecida, deixar toda maiúscula
    if (acronyms.includes(cleanWord)) {
      return cleanWord.toUpperCase();
    }

    // Casos especiais para algumas palavras compostas
    if (cleanWord.includes('-')) {
      return cleanWord.split('-').map(part => {
        if (acronyms.includes(part)) {
          return part.toUpperCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1);
      }).join('-');
    }

    // Casos especiais para palavras específicas
    switch (cleanWord) {
      case 'vitamina':
        return 'Vitamina';
      case 'alfa':
        return 'Alfa';
      case 'beta':
        return 'Beta';
      case 'gama':
        return 'Gama';
      case 'globulina':
        return 'Globulina';
      case 'específico':
        return 'Específico';
      case 'inferior':
        return 'Inferior';
      case 'pólen':
        return 'Pólen';
      case 'ácaros':
        return 'Ácaros';
      case 'poeira':
        return 'Poeira';
      case 'fungos':
        return 'Fungos';
      case 'cão':
        return 'Cão';
      case 'gato':
        return 'Gato';
      case 'relação':
        return 'Relação';
      case 'proteína':
        return 'Proteína';
      case 'proteínas':
        return 'Proteínas';
      case 'monoclonal':
        return 'Monoclonal';
      case 'testosterona':
        return 'Testosterona';
      case 'total':
        return 'Total';
      case 'livre':
        return 'Livre';
      case 'complemento':
        return 'Complemento';
      case 'imunoglobulina':
        return 'Imunoglobulina';
      case 'fator':
        return 'Fator';
      case 'reumatóide':
        return 'Reumatóide';
      case 'núcleo':
        return 'Núcleo';
      case 'nucléolo':
        return 'Nucléolo';
      case 'citoplasma':
        return 'Citoplasma';
      case 'aparelho':
        return 'Aparelho';
      case 'mitótico':
        return 'Mitótico';
      case 'placa':
        return 'Placa';
      case 'metafásica':
        return 'Metafásica';
      case 'cromossômica':
        return 'Cromossômica';
      case 'hepatite':
        return 'Hepatite';
      case 'anti':
        return 'Anti';
      case 'triiodotironina':
        return 'Triiodotironina';
      default:
        // Capitalizar primeira letra
        return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    }
  });

  return formattedWords.join(' ');
}